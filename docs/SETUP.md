Developer setup — Smear
======================

Overview
--------
This file documents a minimal local development setup for the backend (FastAPI) and frontend (React).

Prerequisites
-------------
- Python 3.11+ (3.10 may work) and pip
- Node 18+ and npm/yarn
- MongoDB (local or Atlas). For local dev you can run MongoDB via Docker: `docker run -p 27017:27017 -d --name smear-mongo mongo:6`.

Backend (backend/app)
---------------------
1. Create a virtual environment and activate it

   # on Windows with bash (Git Bash / WSL)
   python -m venv .venv
   source .venv/Scripts/activate

2. Install dependencies (example)

   pip install fastapi uvicorn[standard] pymongo motor pydantic python-dotenv passlib[bcrypt] python-jose

3. Environment variables (store in .env during development)

   MONGO_URI=mongodb://localhost:27017/smear
   SECRET_KEY=replace-this-with-a-secure-random-string
   ACCESS_TOKEN_EXPIRE_MINUTES=60

4. Run FastAPI dev server

   uvicorn app.main:app --reload --port 8000

Frontend (frontend)
-------------------
1. Initialize project

   npm create vite@latest frontend -- --template react-ts
   cd frontend
   npm install

2. Environment variables for frontend (connect to backend)

   VITE_API_BASE_URL=http://localhost:8000/api/v1

3. Start dev server

   npm run dev

Notes
-----
- Keep credentials and production secrets out of VCS. Add `.env` to `.gitignore`.
- Use a managed MongoDB (Atlas) for production and set IP/network rules.
Developer setup — Smear
======================

Overview
--------
This file documents a minimal local development setup for the backend (FastAPI) and frontend (React).

Prerequisites
-------------
- Python 3.11+ (3.10 may work) and pip
- Node 18+ and npm/yarn
- MongoDB (local or Atlas). For local dev you can run MongoDB via Docker: `docker run -p 27017:27017 -d --name smear-mongo mongo:6`.

Backend (backend/app)
---------------------
1. Create a virtual environment and activate it

   # on Windows with bash (Git Bash / WSL)
   python -m venv .venv
   source .venv/Scripts/activate

2. Install dependencies (example)

   pip install fastapi uvicorn[standard] pymongo motor pydantic python-dotenv passlib[bcrypt] python-jose

3. Environment variables (store in .env during development)

   MONGO_URI=mongodb://localhost:27017/smear
   SECRET_KEY=replace-this-with-a-secure-random-string
   ACCESS_TOKEN_EXPIRE_MINUTES=60

4. Run FastAPI dev server

   uvicorn app.main:app --reload --port 8000

Frontend (frontend)
-------------------
1. Initialize project

   npm create vite@latest frontend -- --template react-ts
   cd frontend
   npm install

2. Environment variables for frontend (connect to backend)

   VITE_API_BASE_URL=http://localhost:8000/api/v1

3. Start dev server

   npm run dev

Notes
-----
- Keep credentials and production secrets out of VCS. Add `.env` to `.gitignore`.
- Use a managed MongoDB (Atlas) for production and set IP/network rules.
