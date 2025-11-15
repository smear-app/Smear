API design — Smear (FastAPI)
=================================

Authentication
--------------
- POST /auth/register — register a user. Request: {email, password, displayName}
- POST /auth/login — returns JWT access token. Request: {email, password}
- POST /auth/refresh — refresh token if implemented

Users
-----
- GET /users/me — get current user profile (requires auth)
- PATCH /users/me — update profile fields (height, weight, preferred grading system)

Climbs (core resource)
----------------------
- POST /climbs — log a climb
  - Request example:
    {
      "user_id": "<implicit from token>",
      "route_id": "optional-route-id",
      "gym_id": "optional-gym-id",
      "grade": "V5" ,
      "style": "boulder",
      "attempt_type": "redpoint|onsight|flash|attempt",
      "attempts": 3,
      "sent": true,
      "date": "2025-11-07T18:30:00Z",
      "notes": "felt strong",
      "hang_time_seconds": 12
    }

- GET /climbs — list climbs (filter by user, gym, date range, grade)
- GET /climbs/{id} — climb details
- PATCH /climbs/{id} — update a climb
- DELETE /climbs/{id} — remove a climb

Routes / Problems
-----------------
- POST /routes — create route metadata (name, color, setters, grade, wall, sector)
- GET /routes — search routes (by gym, grade, tags)
- GET /routes/{id}

Gyms / Locations
-----------------
- POST /gyms — add a gym (name, address, lat/lon, timezone)
- GET /gyms — search gyms

Stats & Analytics
-----------------
- GET /stats/me — derived metrics for current user, e.g., weekly XP, grade progression
- GET /leaderboards — leaderboard query params (gym/global, period)

Error handling
--------------
- Use consistent error shape: {"detail": "message", "code": "ERR_CODE"}
- Common 400/401/403/404/500 statuses

Pagination
----------
- Use standard limit/offset or cursor-based pagination for lists. Recommend cursor-based for large sets.

Contract notes
--------------
- Dates: use ISO 8601 UTC strings. Convert to user timezone on frontend when displaying.
- Grades: store as both original string and normalized numeric value (see Data Model) to make sorting and analytics easier.

Versioning
----------
- Prefix API with /api/v1/ for now. Keep breaking changes behind new version.

Auth example (FastAPI)
----------------------
- Use OAuth2PasswordBearer for token flow, or any minimal JWT-based auth with secure token storage on client.
API design — Smear (FastAPI)
=================================

Authentication
--------------
- POST /auth/register — register a user. Request: {email, password, displayName}
- POST /auth/login — returns JWT access token. Request: {email, password}
- POST /auth/refresh — refresh token if implemented

Users
-----
- GET /users/me — get current user profile (requires auth)
- PATCH /users/me — update profile fields (height, weight, preferred grading system)

Climbs (core resource)
----------------------
- POST /climbs — log a climb
  - Request example:
    {
      "user_id": "<implicit from token>",
      "route_id": "optional-route-id",
      "gym_id": "optional-gym-id",
      "grade": "V5" ,
      "style": "boulder",
      "attempt_type": "redpoint|onsight|flash|attempt",
      "attempts": 3,
      "sent": true,
      "date": "2025-11-07T18:30:00Z",
      "notes": "felt strong",
      "hang_time_seconds": 12
    }

- GET /climbs — list climbs (filter by user, gym, date range, grade)
- GET /climbs/{id} — climb details
- PATCH /climbs/{id} — update a climb
- DELETE /climbs/{id} — remove a climb

Routes / Problems
-----------------
- POST /routes — create route metadata (name, color, setters, grade, wall, sector)
- GET /routes — search routes (by gym, grade, tags)
- GET /routes/{id}

Gyms / Locations
-----------------
- POST /gyms — add a gym (name, address, lat/lon, timezone)
- GET /gyms — search gyms

Stats & Analytics
-----------------
- GET /stats/me — derived metrics for current user, e.g., weekly XP, grade progression
- GET /leaderboards — leaderboard query params (gym/global, period)

Error handling
--------------
- Use consistent error shape: {"detail": "message", "code": "ERR_CODE"}
- Common 400/401/403/404/500 statuses

Pagination
----------
- Use standard limit/offset or cursor-based pagination for lists. Recommend cursor-based for large sets.

Contract notes
--------------
- Dates: use ISO 8601 UTC strings. Convert to user timezone on frontend when displaying.
- Grades: store as both original string and normalized numeric value (see Data Model) to make sorting and analytics easier.

Versioning
----------
- Prefix API with /api/v1/ for now. Keep breaking changes behind new version.

Auth example (FastAPI)
----------------------
- Use OAuth2PasswordBearer for token flow, or any minimal JWT-based auth with secure token storage on client.
