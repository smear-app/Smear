import unittest
from unittest.mock import patch

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.routers import access_requests


class FakeResult:
    def __init__(self, data):
        self.data = data


class FakeQuery:
    def __init__(self):
        self.payload = None
        self.on_conflict = None

    def upsert(self, payload, on_conflict=None):
        self.payload = dict(payload)
        self.on_conflict = on_conflict
        return self

    def execute(self):
        return FakeResult([self.payload])


class FakeSupabase:
    def __init__(self):
        self.query = FakeQuery()

    def from_(self, table: str):
        assert table == "access_requests"
        return self.query


class AccessRequestTests(unittest.TestCase):
    def setUp(self):
        self.app = FastAPI()
        self.app.include_router(access_requests.router, prefix="/api/v1")
        self.client = TestClient(self.app)

    def test_create_access_request_normalizes_and_upserts_email(self):
        fake_supabase = FakeSupabase()

        with patch("app.routers.access_requests.get_supabase", return_value=fake_supabase):
            response = self.client.post(
                "/api/v1/access-requests",
                json={"email": "  Person@Example.com  "},
            )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json(), {"email": "person@example.com", "status": "pending"})
        self.assertEqual(fake_supabase.query.on_conflict, "email")
        self.assertEqual(fake_supabase.query.payload["source"], "landing_page")

    def test_create_access_request_rejects_invalid_email(self):
        response = self.client.post(
            "/api/v1/access-requests",
            json={"email": "not-an-email"},
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["detail"], "Enter a valid email.")


if __name__ == "__main__":
    unittest.main()
