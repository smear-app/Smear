import unittest
from unittest.mock import patch

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.routers import sessions


class FakeResult:
    def __init__(self, data):
        self.data = data


class FakeQuery:
    def __init__(self, supabase, table: str):
        self.supabase = supabase
        self.table = table
        self.filters: list[tuple[str, object]] = []
        self._selected = False
        self._maybe_single = False
        self._update_payload = None

    def select(self, _fields):
        self._selected = True
        return self

    def eq(self, field, value):
        self.filters.append((field, value))
        return self

    def maybe_single(self):
        self._maybe_single = True
        return self

    def update(self, payload):
        self._update_payload = dict(payload)
        return self

    def execute(self):
        rows = self.supabase.tables[self.table]
        matches = [
            row for row in rows
            if all(row.get(field) == value for field, value in self.filters)
        ]

        if self._update_payload is not None:
            if not self._selected:
                raise RuntimeError("Missing response")
            for row in matches:
                row.update(self._update_payload)
            return FakeResult([{"id": row["id"]} for row in matches])

        data = [dict(row) for row in matches]
        if self._maybe_single:
            return FakeResult(data[0] if data else None)
        return FakeResult(data)


class FakeSupabase:
    def __init__(self):
        self.tables = {
            "sessions": [
                {
                    "id": "session-1",
                    "user_id": "user-1",
                    "gym_id": "gym-1",
                    "gym_name": "Movement",
                    "started_at": "2026-04-20T18:00:00Z",
                    "ended_at": "2026-04-20T19:00:00Z",
                    "visibility": "followers",
                    "is_published": False,
                    "top_tags": [],
                }
            ],
            "profiles": [
                {
                    "id": "user-1",
                    "default_visibility": "followers",
                }
            ],
            "climbs": [
                {
                    "session_id": "session-1",
                    "send_type": "send",
                    "gym_grade": "V4",
                    "gym_grade_value": 4,
                    "tags": ["slab"],
                    "photo_url": None,
                },
                {
                    "session_id": "session-1",
                    "send_type": "flash",
                    "gym_grade": "V3",
                    "gym_grade_value": 3,
                    "tags": ["technical"],
                    "photo_url": None,
                },
            ],
        }

    def from_(self, table: str):
        return FakeQuery(self, table)


class SessionEndTests(unittest.TestCase):
    def setUp(self):
        self.app = FastAPI()
        self.app.include_router(sessions.router, prefix="/api/v1")
        self.app.dependency_overrides[sessions.get_current_user] = lambda: "user-1"
        self.client = TestClient(self.app)

    def tearDown(self):
        self.app.dependency_overrides.clear()

    def test_end_session_updates_with_select_to_avoid_missing_response_errors(self):
        fake_supabase = FakeSupabase()

        with patch("app.routers.sessions.get_supabase", return_value=fake_supabase):
            response = self.client.post("/api/v1/sessions/session-1/end", json={})

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertTrue(payload["is_published"])
        self.assertEqual(payload["total_climbs"], 2)
        self.assertEqual(payload["sends"], 1)
        self.assertEqual(payload["flashes"], 1)
        self.assertEqual(payload["attempts"], 0)
        self.assertEqual(payload["hardest_grade"], "V4")
        self.assertEqual(payload["hardest_flash"], "V3")
        self.assertEqual(payload["top_tags"], ["slab", "technical"])


if __name__ == "__main__":
    unittest.main()
