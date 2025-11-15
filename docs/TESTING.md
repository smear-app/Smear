Testing & CI — Smear
=====================

Testing strategy
----------------
- Unit tests: fast, isolated tests for individual functions and components.
- Integration tests: test endpoints using FastAPI TestClient and an in-memory or test MongoDB (mongomock or a temporary test database).
- E2E tests: use Playwright or Cypress to simulate user flows (sign up, log climb, view stats).

Backend tests
-------------
- Use pytest and httpx/fastapi TestClient.
- For DB isolation, either use a Docker-based ephemeral MongoDB instance in the CI, or mock the DB layer (mongomock) for speed.

Example pytest setup (concept)

def test_post_climb(client):
    resp = client.post('/api/v1/climbs', json=sample_payload, headers={...})
    assert resp.status_code == 201

Frontend tests
--------------
- Unit: React Testing Library + Jest for components and small integration points.
- E2E: Playwright for full flows (recommended for multi-page flows and auth).

CI recommendations
------------------
- Use GitHub Actions with jobs for:
  - lint + typecheck
  - backend tests (pytest)
  - frontend tests (npm test)
  - optional: build & deploy jobs

Example matrix job (high level):
- runs-on: ubuntu-latest
- steps: checkout, setup Python, pip install, run pytest. For MongoDB-backed tests, start a mongo service or use a Docker container.

Quality gates
-------------
- Run linters (flake8/ruff) and type-checking (mypy) in CI.
- Keep tests fast; prioritize unit/integration tests for PR feedback.
Testing & CI — Smear
=====================

Testing strategy
----------------
- Unit tests: fast, isolated tests for individual functions and components.
- Integration tests: test endpoints using FastAPI TestClient and an in-memory or test MongoDB (mongomock or a temporary test database).
- E2E tests: use Playwright or Cypress to simulate user flows (sign up, log climb, view stats).

Backend tests
-------------
- Use pytest and httpx/fastapi TestClient.
- For DB isolation, either use a Docker-based ephemeral MongoDB instance in the CI, or mock the DB layer (mongomock) for speed.

Example pytest setup (concept)

def test_post_climb(client):
    resp = client.post('/api/v1/climbs', json=sample_payload, headers={...})
    assert resp.status_code == 201

Frontend tests
--------------
- Unit: React Testing Library + Jest for components and small integration points.
- E2E: Playwright for full flows (recommended for multi-page flows and auth).

CI recommendations
------------------
- Use GitHub Actions with jobs for:
  - lint + typecheck
  - backend tests (pytest)
  - frontend tests (npm test)
  - optional: build & deploy jobs

Example matrix job (high level):
- runs-on: ubuntu-latest
- steps: checkout, setup Python, pip install, run pytest. For MongoDB-backed tests, start a mongo service or use a Docker container.

Quality gates
-------------
- Run linters (flake8/ruff) and type-checking (mypy) in CI.
- Keep tests fast; prioritize unit/integration tests for PR feedback.
