import logging
logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s:%(name)s:%(message)s",
)
logging.getLogger("httpx").setLevel(logging.WARNING)

import os
import fastapi
from fastapi import BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
load_dotenv()
from app.gyms import seed_region, get_supabase, gyms_router
from app.duplicate_detection import run_duplicate_check, merge_canonicals, dismiss_flag
from app.routers.me import router as me_router
from app.routers.climbs import router as climbs_router
from app.routers.canonical_climbs import router as canonical_climbs_router
from app.routers.admin import router as admin_router
from app.routers.sessions import router as sessions_router
from app.routers.social import router as social_router
from app.routers.access_requests import router as access_requests_router


def get_allowed_origins() -> list[str]:
    configured = os.environ.get("CORS_ALLOW_ORIGINS", "")
    if configured.strip():
        return [origin.strip() for origin in configured.split(",") if origin.strip()]

    return [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
        "https://smearapp.vercel.app",
    ]


app = fastapi.FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_methods=["*"],
    allow_headers=["*"],
)

# v1 API routers
app.include_router(me_router, prefix="/api/v1")
app.include_router(climbs_router, prefix="/api/v1")
app.include_router(canonical_climbs_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")
app.include_router(sessions_router, prefix="/api/v1")
app.include_router(social_router, prefix="/api/v1")
app.include_router(access_requests_router, prefix="/api/v1")
app.include_router(gyms_router, prefix="/api/v1")


@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/api/v1/gyms")
async def search_gyms(q: str = ""):
    """Search gyms in Supabase. Returns all gyms if q is empty."""
    supabase = get_supabase()
    query = supabase.table("gyms").select("*")
    if q.strip():
        query = query.or_(
            f"name.ilike.%{q}%,city.ilike.%{q}%,state.ilike.%{q}%,address.ilike.%{q}%"
        )
    result = query.limit(200).execute()
    return result.data


class SeedCityRequest(BaseModel):
    location: str


@app.post("/api/v1/canonical-climbs/{canonical_id}/process-embedding", status_code=202)
async def process_embedding(canonical_id: str, background_tasks: BackgroundTasks):
    """
    Trigger async duplicate detection for a canonical climb.
    Fetches a DINOv2 embedding for its photo, stores it, and flags near-duplicates.
    Returns 202 immediately — the job runs in the background.
    """
    background_tasks.add_task(run_duplicate_check, canonical_id)
    return {"status": "queued", "canonical_id": canonical_id}


class MergeFlagRequest(BaseModel):
    winner_id: str
    loser_id: str


@app.post("/api/v1/duplicate-flags/{flag_id}/merge")
def merge_flag(flag_id: str, body: MergeFlagRequest):
    """Merge two duplicate canonical climbs and mark the flag reviewed."""
    return merge_canonicals(body.winner_id, body.loser_id, flag_id)


@app.post("/api/v1/duplicate-flags/{flag_id}/dismiss")
def dismiss_flag_endpoint(flag_id: str):
    """Dismiss a duplicate flag without merging."""
    return dismiss_flag(flag_id)


@app.post("/api/v1/gyms/seed-city")
async def seed_city(body: SeedCityRequest):
    """
    Geocode a location, fetch climbing gyms from OpenStreetMap, and store
    them in Supabase. Skips the fetch if the region was already seeded.
    """
    if not body.location.strip():
        raise HTTPException(status_code=400, detail="location is required")

    gyms, city, state = await seed_region(body.location)
    return {"gyms": gyms, "city": city, "state": state, "count": len(gyms)}
