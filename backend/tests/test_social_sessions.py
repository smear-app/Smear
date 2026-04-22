import unittest
from unittest.mock import patch

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.routers import social


class FakeResult:
    def __init__(self, data):
        self.data = data


class FakeQuery:
    def __init__(self, supabase, table: str):
        self.supabase = supabase
        self.table = table
        self.filters: list[tuple[str, str, object]] = []
        self.in_filters: list[tuple[str, list[object]]] = []
        self._maybe_single = False
        self._order: tuple[str, bool] | None = None

    def select(self, _fields, count=None):
        return self

    def eq(self, field, value):
        self.filters.append(("eq", field, value))
        return self

    def in_(self, field, values):
        self.in_filters.append((field, list(values)))
        return self

    def order(self, field, desc=False):
        self._order = (field, desc)
        return self

    def maybe_single(self):
        self._maybe_single = True
        return self

    def execute(self):
        rows = [dict(row) for row in self.supabase.tables[self.table]]

        for _, field, value in self.filters:
            rows = [row for row in rows if row.get(field) == value]

        for field, values in self.in_filters:
            rows = [row for row in rows if row.get(field) in values]

        if self._order:
            field, desc = self._order
            rows.sort(key=lambda row: row.get(field) or "", reverse=desc)

        if self._maybe_single:
            return FakeResult(rows[0] if rows else None)

        return FakeResult(rows)


class FakeSupabase:
    def __init__(self):
        self.tables = {
            "sessions": [
                {
                    "id": "session-1",
                    "user_id": "author-1",
                    "gym_id": "gym-1",
                    "gym_name": "Movement",
                    "started_at": "2026-04-20T18:00:00Z",
                    "ended_at": "2026-04-20T19:15:00Z",
                    "visibility": "public",
                    "is_published": True,
                    "total_climbs": 2,
                    "sends": 1,
                    "flashes": 1,
                    "attempts": 0,
                    "hardest_grade": "V5",
                    "hardest_grade_value": 5,
                    "hardest_flash": "V3",
                    "hardest_flash_value": 3,
                    "top_tags": ["slab", "technical"],
                    "cover_photo_url": None,
                    "created_at": "2026-04-20T18:00:00Z",
                    "profiles": {
                        "display_name": "Avery",
                        "username": "avery",
                        "avatar_url": None,
                    },
                }
            ],
            "session_reactions": [
                {"session_id": "session-1", "user_id": "viewer-1"},
                {"session_id": "session-1", "user_id": "viewer-2"},
            ],
            "session_comments": [
                {"session_id": "session-1"},
            ],
            "climbs": [
                {
                    "id": "climb-2",
                    "user_id": "author-1",
                    "gym_id": "gym-1",
                    "gym_name": "Movement",
                    "gym_grade": "V5",
                    "gym_grade_value": 5,
                    "personal_grade": None,
                    "personal_grade_value": None,
                    "send_type": "send",
                    "tags": ["slab"],
                    "photo_url": None,
                    "hold_color": "blue",
                    "notes": "Fought for the topout",
                    "canonical_climb_id": None,
                    "session_id": "session-1",
                    "created_at": "2026-04-20T19:05:00Z",
                    "canonical_climbs": {},
                },
                {
                    "id": "climb-1",
                    "user_id": "author-1",
                    "gym_id": "gym-1",
                    "gym_name": "Movement",
                    "gym_grade": "V3",
                    "gym_grade_value": 3,
                    "personal_grade": None,
                    "personal_grade_value": None,
                    "send_type": "flash",
                    "tags": ["technical"],
                    "photo_url": None,
                    "hold_color": "green",
                    "notes": None,
                    "canonical_climb_id": None,
                    "session_id": "session-1",
                    "created_at": "2026-04-20T18:20:00Z",
                    "canonical_climbs": {},
                },
            ],
            "follows": [],
        }

    def from_(self, table: str):
        return FakeQuery(self, table)


class SocialSessionDetailTests(unittest.TestCase):
    def setUp(self):
        self.app = FastAPI()
        self.app.include_router(social.router, prefix="/api/v1")
        self.app.dependency_overrides[social.get_current_user] = lambda: "viewer-1"
        self.client = TestClient(self.app)

    def tearDown(self):
        self.app.dependency_overrides.clear()

    def test_session_detail_returns_climbs_for_public_session(self):
        fake_supabase = FakeSupabase()

        with patch("app.routers.social.get_supabase", return_value=fake_supabase):
            response = self.client.get("/api/v1/social/sessions/session-1")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["id"], "session-1")
        self.assertEqual(payload["reaction_count"], 2)
        self.assertTrue(payload["viewer_has_reacted"])
        self.assertEqual(payload["comment_count"], 1)
        self.assertEqual([climb["id"] for climb in payload["climbs"]], ["climb-2", "climb-1"])
        self.assertEqual(payload["climbs"][0]["session_id"], "session-1")


if __name__ == "__main__":
    unittest.main()
