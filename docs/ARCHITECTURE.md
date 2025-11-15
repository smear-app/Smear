Smear — Architecture
=====================

Overview
--------
This document describes the high-level architecture and component responsibilities for Smear. The goal is a small, maintainable system with clear separation between backend (API + business logic), database (MongoDB), and frontend (React SPA).

Components
----------
- Frontend (React): UI for logging climbs, viewing progress, leaderboards, and settings. Talks to the backend over HTTPS REST (and later GraphQL/WebSocket if needed for real-time features).
- Backend (FastAPI): REST API for authentication, climbs, routes, gyms, and user analytics. Implements validation (Pydantic), business rules, and security.
- Database (MongoDB): Stores users, climbs, routes/problems, gyms, and derived aggregates.
- Optional: Background worker (Celery/RQ) for heavy analytics, badge generation, and scheduled jobs (weekly summaries).

Data flow
---------
1. User submits a climb via frontend.
2. Frontend POSTs to backend /climbs endpoint.
3. Backend validates and persists a 'climb' document in MongoDB, updates user stats or a denormalized leaderboard document.
4. For heavy computations (e.g., recalculating long timeseries), a background worker consumes a job and updates aggregates.

Deployment
----------
- Simple dev: run FastAPI with uvicorn, run React dev server.
- Production: containerize backend & frontend; use managed MongoDB (Atlas) or self-hosted; host backend on an app service (Heroku/GCP/Azure) or container platform (Cloud Run, App Service, or Kubernetes for more scale).

Security & auth
---------------
- Use HTTPS everywhere.
- JWT for session tokens, or secure server-side sessions.
- Keep database access behind the backend; frontend never connects directly to DB.

Scaling considerations
----------------------
- MongoDB scales well for append-heavy event-like data (climbs). Consider time-series collections or capped collections if you have sensor data.
- Introduce a cache (Redis) for leaderboard or common queries.
- Use background workers to offload heavy aggregations.

Observability
-------------
- Add request logging and metrics (Prometheus/Grafana or a managed provider).
- Implement structured logging to trace user actions (log IDs for climb submissions).

Notes
-----
- Keep the backend API granular and well-documented; it will be the single source of truth for the frontend.
Smear — Architecture
=====================

Overview
--------
This document describes the high-level architecture and component responsibilities for Smear. The goal is a small, maintainable system with clear separation between backend (API + business logic), database (MongoDB), and frontend (React SPA).

Components
----------
- Frontend (React): UI for logging climbs, viewing progress, leaderboards, and settings. Talks to the backend over HTTPS REST (and later GraphQL/WebSocket if needed for real-time features).
- Backend (FastAPI): REST API for authentication, climbs, routes, gyms, and user analytics. Implements validation (Pydantic), business rules, and security.
- Database (MongoDB): Stores users, climbs, routes/problems, gyms, and derived aggregates.
- Optional: Background worker (Celery/RQ) for heavy analytics, badge generation, and scheduled jobs (weekly summaries).

Data flow
---------
1. User submits a climb via frontend.
2. Frontend POSTs to backend /climbs endpoint.
3. Backend validates and persists a 'climb' document in MongoDB, updates user stats or a denormalized leaderboard document.
4. For heavy computations (e.g., recalculating long timeseries), a background worker consumes a job and updates aggregates.

Deployment
----------
- Simple dev: run FastAPI with uvicorn, run React dev server.
- Production: containerize backend & frontend; use managed MongoDB (Atlas) or self-hosted; host backend on an app service (Heroku/GCP/Azure) or container platform (Cloud Run, App Service, or Kubernetes for more scale).

Security & auth
---------------
- Use HTTPS everywhere.
- JWT for session tokens, or secure server-side sessions.
- Keep database access behind the backend; frontend never connects directly to DB.

Scaling considerations
----------------------
- MongoDB scales well for append-heavy event-like data (climbs). Consider time-series collections or capped collections if you have sensor data.
- Introduce a cache (Redis) for leaderboard or common queries.
- Use background workers to offload heavy aggregations.

Observability
-------------
- Add request logging and metrics (Prometheus/Grafana or a managed provider).
- Implement structured logging to trace user actions (log IDs for climb submissions).

Notes
-----
- Keep the backend API granular and well-documented; it will be the single source of truth for the frontend.
