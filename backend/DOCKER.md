# Running the Backend Locally with Docker

The easiest local workflow is Docker Compose from the repo root:

```bash
docker compose up --build backend
```

This builds `./backend`, loads `backend/.env`, and serves the API on port `8000`.

Stop it with:

```bash
docker compose down
```

Verify the container is serving:

```bash
curl http://localhost:8000/
```

Expected response:

```json
{"Hello":"World"}
```

For local frontend development, use this in `frontend/.env.development.local`:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

Then restart Vite:

```bash
cd frontend
npm run dev
```

Notes:

- The compose file is for local development only. Render still uses `backend/Dockerfile` directly, so this does not change deployment behavior.
- `backend/.env` is intentionally excluded from the Docker build context, so pass it with `--env-file`.
- Required backend env vars include `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`.
- If `docker` is not found, install and start Docker Desktop first.

Manual Docker commands still work if needed:

```bash
docker build -t smear-backend ./backend
docker run --rm --name smear-backend --env-file backend/.env -p 8000:8000 smear-backend
```
