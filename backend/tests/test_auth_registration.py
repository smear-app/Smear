import unittest
from types import SimpleNamespace
from unittest.mock import patch

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.routers import auth


class FakeResult:
    def __init__(self, data):
        self.data = data


class FakeTableQuery:
    def __init__(self, rows):
        self.rows = rows
        self.filters = {}
        self.selected = None
        self.limit_value = None
        self.inserted_payload = None

    def select(self, fields):
        self.selected = fields
        return self

    def eq(self, key, value):
        self.filters[key] = value
        return self

    def limit(self, value):
        self.limit_value = value
        return self

    def insert(self, payload):
        self.inserted_payload = dict(payload)
        return self

    def execute(self):
        if self.inserted_payload is not None:
            return FakeResult([self.inserted_payload])

        filtered = [
            row for row in self.rows
            if all(row.get(key) == value for key, value in self.filters.items())
        ]
        if self.limit_value is not None:
            filtered = filtered[:self.limit_value]
        return FakeResult(filtered)


class FakeAdminAuth:
    def __init__(self):
        self.created_payload = None
        self.deleted_user_id = None

    def create_user(self, payload):
        self.created_payload = dict(payload)
        return SimpleNamespace(user=SimpleNamespace(id="user-123"))

    def delete_user(self, user_id):
        self.deleted_user_id = user_id


class FakeSupabase:
    def __init__(self, access_requests=None, profiles=None):
        self.tables = {
            "access_requests": FakeTableQuery(access_requests or []),
            "profiles": FakeTableQuery(profiles or []),
        }
        self.auth = SimpleNamespace(admin=FakeAdminAuth())

    def from_(self, table):
        return self.tables[table]


class AuthRegistrationTests(unittest.TestCase):
    def setUp(self):
        self.app = FastAPI()
        self.app.include_router(auth.router, prefix="/api/v1")
        self.client = TestClient(self.app)

    def test_register_requires_invited_access_request(self):
        fake_supabase = FakeSupabase(access_requests=[{"email": "person@example.com", "status": "pending"}])

        with patch("app.routers.auth.get_supabase", return_value=fake_supabase):
            response = self.client.post(
                "/api/v1/auth/register",
                json={
                    "email": "person@example.com",
                    "password": "secret123",
                    "username": "person",
                    "display_name": "Person",
                },
            )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json()["detail"], "This email has not been invited yet.")
        self.assertIsNone(fake_supabase.auth.admin.created_payload)

    def test_register_creates_user_for_invited_email(self):
        fake_supabase = FakeSupabase(
            access_requests=[{"email": "person@example.com", "status": "invited"}],
            profiles=[{"id": "ref-1", "referral_code": "JADE42"}],
        )

        with patch("app.routers.auth.get_supabase", return_value=fake_supabase):
            response = self.client.post(
                "/api/v1/auth/register",
                json={
                    "email": " Person@Example.com ",
                    "password": "secret123",
                    "username": "person",
                    "display_name": "Person",
                    "referral_code": "jade42",
                },
            )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json(), {"email": "person@example.com", "user_id": "user-123"})
        self.assertEqual(
            fake_supabase.auth.admin.created_payload,
            {
                "email": "person@example.com",
                "password": "secret123",
                "email_confirm": True,
            },
        )
        self.assertEqual(
            fake_supabase.tables["profiles"].inserted_payload,
            {
                "id": "user-123",
                "username": "person",
                "avatar_url": None,
                "display_name": "Person",
                "referred_by": "ref-1",
            },
        )


if __name__ == "__main__":
    unittest.main()
