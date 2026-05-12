import unittest
from unittest.mock import patch

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.climb_attempts import (
    compute_canonical_attempt_progress,
    resolve_attempts_for_send_type,
)
from app.routers import climbs


class AttemptHelperTests(unittest.TestCase):
    def test_flash_always_resolves_to_one_attempt(self):
        self.assertEqual(resolve_attempts_for_send_type("flash", None), 1)
        self.assertEqual(resolve_attempts_for_send_type("flash", 9), 1)

    def test_worked_outcomes_require_valid_attempts(self):
        self.assertEqual(resolve_attempts_for_send_type("send", 5), 5)
        self.assertEqual(resolve_attempts_for_send_type("attempt", 4), 4)
        with self.assertRaises(ValueError):
            resolve_attempts_for_send_type("send", None)
        with self.assertRaises(ValueError):
            resolve_attempts_for_send_type("attempt", 1)

    def test_prior_unsent_attempts_roll_into_first_send(self):
        progress = compute_canonical_attempt_progress(
            [
                {"id": "1", "send_type": "attempt", "attempts": 3, "created_at": "2026-05-01T10:00:00Z"},
                {"id": "2", "send_type": "attempt", "attempts": 2, "created_at": "2026-05-02T10:00:00Z"},
                {"id": "3", "send_type": "send", "attempts": 4, "created_at": "2026-05-03T10:00:00Z"},
            ]
        )

        self.assertIsNotNone(progress)
        self.assertEqual(progress.pre_send_attempt_count, 5)
        self.assertEqual(progress.first_send_attempt_count, 9)
        self.assertEqual(progress.first_sent_at, "2026-05-03T10:00:00Z")

    def test_attempts_stop_accumulating_after_first_send(self):
        progress = compute_canonical_attempt_progress(
            [
                {"id": "1", "send_type": "attempt", "attempts": 2, "created_at": "2026-05-01T10:00:00Z"},
                {"id": "2", "send_type": "send", "attempts": 3, "created_at": "2026-05-02T10:00:00Z"},
                {"id": "3", "send_type": "attempt", "attempts": 8, "created_at": "2026-05-03T10:00:00Z"},
                {"id": "4", "send_type": "send", "attempts": 6, "created_at": "2026-05-04T10:00:00Z"},
            ]
        )

        self.assertIsNotNone(progress)
        self.assertEqual(progress.pre_send_attempt_count, 2)
        self.assertEqual(progress.first_send_attempt_count, 5)
        self.assertEqual(progress.first_sent_at, "2026-05-02T10:00:00Z")


class FakeResult:
    def __init__(self, data):
        self.data = data


class FakeQuery:
    def __init__(self, supabase, table: str):
        self.supabase = supabase
        self.table = table
        self.filters: list[tuple[str, object]] = []
        self.gt_filters: list[tuple[str, str]] = []
        self._order: tuple[str, bool] | None = None
        self._limit: int | None = None
        self._insert_payload = None
        self._update_payload = None
        self._maybe_single = False

    def select(self, _fields, count=None):
        return self

    def eq(self, field, value):
        self.filters.append((field, value))
        return self

    def gt(self, field, value):
        self.gt_filters.append((field, value))
        return self

    def order(self, field, desc=False):
        self._order = (field, desc)
        return self

    def limit(self, value):
        self._limit = value
        return self

    def insert(self, payload):
        self._insert_payload = dict(payload)
        return self

    def update(self, payload):
        self._update_payload = dict(payload)
        return self

    def maybe_single(self):
        self._maybe_single = True
        return self

    def execute(self):
        rows = self.supabase.tables[self.table]
        matches = [
            row
            for row in rows
            if all(row.get(field) == value for field, value in self.filters)
            and all((row.get(field) or "") > value for field, value in self.gt_filters)
        ]

        if self._order:
            field, desc = self._order
            matches = sorted(matches, key=lambda row: row.get(field) or "", reverse=desc)

        if self._insert_payload is not None:
            created = dict(self._insert_payload)
            if self.table == "sessions":
                created.setdefault("id", f"session-{len(rows) + 1}")
            else:
                created.setdefault("id", f"climb-{len(rows) + 1}")
            created.setdefault("created_at", "2026-05-12T12:00:00Z")
            rows.append(created)
            self.supabase.last_insert_payloads[self.table] = created
            return FakeResult([dict(created)])

        if self._update_payload is not None:
            for row in matches:
                row.update(self._update_payload)
            return FakeResult([dict(row) for row in matches])

        data = [dict(row) for row in matches]
        if self._limit is not None:
            data = data[: self._limit]
        if self._maybe_single:
            return FakeResult(data[0] if data else None)
        return FakeResult(data)


class FakeSupabase:
    def __init__(self):
        self.tables = {
            "sessions": [],
            "climbs": [],
        }
        self.last_insert_payloads: dict[str, dict] = {}

    def from_(self, table: str):
        return FakeQuery(self, table)


class PostClimbAttemptTests(unittest.TestCase):
    def setUp(self):
        self.app = FastAPI()
        self.app.include_router(climbs.router, prefix="/api/v1")
        self.app.dependency_overrides[climbs.get_current_user] = lambda: "user-1"
        self.client = TestClient(self.app)

    def tearDown(self):
        self.app.dependency_overrides.clear()

    def test_flash_save_persists_attempts_as_one(self):
        fake_supabase = FakeSupabase()

        with (
            patch("app.routers.climbs.get_supabase", return_value=fake_supabase),
            patch("app.routers.climbs.publish_stale_sessions", return_value=None),
        ):
            response = self.client.post(
                "/api/v1/climbs",
                json={
                    "gym_id": "gym-1",
                    "gym_name": "Movement",
                    "gym_grade": "V4",
                    "gym_grade_value": 4,
                    "send_type": "flash",
                    "tags": [],
                },
            )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(fake_supabase.last_insert_payloads["climbs"]["attempts"], 1)
        self.assertEqual(response.json()["attempts"], 1)

    def test_send_and_attempt_saves_persist_selected_attempts(self):
        fake_supabase = FakeSupabase()

        with (
            patch("app.routers.climbs.get_supabase", return_value=fake_supabase),
            patch("app.routers.climbs.publish_stale_sessions", return_value=None),
        ):
            send_response = self.client.post(
                "/api/v1/climbs",
                json={
                    "gym_id": "gym-1",
                    "gym_name": "Movement",
                    "gym_grade": "V5",
                    "gym_grade_value": 5,
                    "send_type": "send",
                    "attempts": 5,
                    "tags": [],
                },
            )
            attempt_response = self.client.post(
                "/api/v1/climbs",
                json={
                    "gym_id": "gym-1",
                    "gym_name": "Movement",
                    "gym_grade": "V5",
                    "gym_grade_value": 5,
                    "send_type": "attempt",
                    "attempts": 7,
                    "tags": [],
                },
            )

        self.assertEqual(send_response.status_code, 201)
        self.assertEqual(send_response.json()["attempts"], 5)
        self.assertEqual(attempt_response.status_code, 201)
        self.assertEqual(attempt_response.json()["attempts"], 7)

    def test_send_without_attempts_is_rejected(self):
        fake_supabase = FakeSupabase()

        with patch("app.routers.climbs.get_supabase", return_value=fake_supabase):
            response = self.client.post(
                "/api/v1/climbs",
                json={
                    "gym_id": "gym-1",
                    "gym_name": "Movement",
                    "gym_grade": "V5",
                    "gym_grade_value": 5,
                    "send_type": "send",
                    "tags": [],
                },
            )

        self.assertEqual(response.status_code, 400)
        self.assertIn("Attempts are required", response.json()["detail"])


if __name__ == "__main__":
    unittest.main()
