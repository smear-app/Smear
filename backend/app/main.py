import logging
logging.basicConfig(level=logging.INFO)

import fastapi
from fastapi import BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
load_dotenv()
from app.gyms import seed_region, get_supabase
from app.duplicate_detection import run_duplicate_check

app = fastapi.FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://smearapp.vercel.app"],
    allow_methods=["*"],
    allow_headers=["*"],
)


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
