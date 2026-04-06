import os
import time
import httpx
from typing import Optional
from datetime import datetime, timezone

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
OVERPASS_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
]

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")


def get_supabase():
    from supabase import create_client
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


# ── /gyms/all with module-level TTL cache ────────────────────────────────────

from fastapi import APIRouter as _APIRouter

gyms_router = _APIRouter(prefix="/gyms", tags=["gyms"])

_GYMS_CACHE_TTL = 3600  # seconds
_gym_cache: dict = {"data": None, "cached_at": None}


@gyms_router.get("/all")
def get_all_gyms():
    now = time.time()
    if _gym_cache["data"] is None or (now - (_gym_cache["cached_at"] or 0)) > _GYMS_CACHE_TTL:
        supabase = get_supabase()
        result = supabase.from_("gyms").select("*").execute()
        _gym_cache["data"] = result.data
        _gym_cache["cached_at"] = now
    return {
        "gyms": _gym_cache["data"],
        "cached_at": datetime.now(timezone.utc).isoformat(),
    }


async def geocode_location(location: str) -> Optional[dict]:
    """Resolve a location string to coordinates and address via Nominatim."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            NOMINATIM_URL,
            params={"q": location, "format": "json", "limit": 1, "addressdetails": 1},
            headers={"User-Agent": "Smear-ClimbingApp/1.0 (contact@smearapp.com)"},
            timeout=10,
        )
        resp.raise_for_status()
        results = resp.json()
        return results[0] if results else None


async def fetch_gyms_from_overpass(south: float, west: float, north: float, east: float) -> list[dict]:
    """Query Overpass API for climbing gyms in a bounding box, with endpoint fallbacks."""
    query = f"""
[out:json][timeout:25];
(
  node["sport"="climbing"]({south},{west},{north},{east});
  way["sport"="climbing"]({south},{west},{north},{east});
  relation["sport"="climbing"]({south},{west},{north},{east});
);
out center;
"""
    last_error = None
    async with httpx.AsyncClient() as client:
        for endpoint in OVERPASS_ENDPOINTS:
            try:
                resp = await client.post(endpoint, data={"data": query}, timeout=30)
                resp.raise_for_status()
                return resp.json().get("elements", [])
            except httpx.HTTPError as e:
                last_error = e
                continue
    raise last_error


def parse_osm_element(element: dict, city: str, state: str) -> Optional[dict]:
    tags = element.get("tags", {})
    name = tags.get("name")
    if not name:
        return None

    if element["type"] == "node":
        lat = element.get("lat")
        lng = element.get("lon")
    else:
        center = element.get("center", {})
        lat = center.get("lat")
        lng = center.get("lon")

    if lat is None or lng is None:
        return None

    address_parts = []
    if tags.get("addr:housenumber") and tags.get("addr:street"):
        address_parts.append(f"{tags['addr:housenumber']} {tags['addr:street']}")
    elif tags.get("addr:street"):
        address_parts.append(tags["addr:street"])

    return {
        "place_id": f"osm-{element['type']}-{element['id']}",
        "name": name,
        "address": address_parts[0] if address_parts else None,
        "city": city,
        "state": state,
        "lat": lat,
        "lng": lng,
        "source": "openstreetmap",
    }


async def seed_region(location: str) -> tuple[list[dict], str, str]:
    """
    Geocode location, check if already fetched, fetch from OSM if not,
    store in Supabase, return (gyms, city, state).
    """
    supabase = get_supabase()

    geo = await geocode_location(location)
    if not geo:
        return [], "", ""

    addr = geo.get("address", {})
    city = addr.get("city") or addr.get("town") or addr.get("village") or location
    state = addr.get("state", "")

    # Check if this region was already fetched
    existing = (
        supabase.table("fetched_regions")
        .select("id, gym_count_found")
        .eq("city", city)
        .eq("state", state)
        .execute()
    )
    if existing.data:
        gyms = (
            supabase.table("gyms")
            .select("*")
            .eq("city", city)
            .eq("state", state)
            .execute()
        )
        return gyms.data, city, state

    # Build bounding box from Nominatim result, padded slightly
    bbox = geo.get("boundingbox", [])
    if len(bbox) == 4:
        south, north, west, east = (
            float(bbox[0]),
            float(bbox[1]),
            float(bbox[2]),
            float(bbox[3]),
        )
        pad = 0.15
        south -= pad
        north += pad
        west -= pad
        east += pad
    else:
        lat, lng = float(geo["lat"]), float(geo["lon"])
        pad = 0.3
        south, north, west, east = lat - pad, lat + pad, lng - pad, lng + pad

    elements = await fetch_gyms_from_overpass(south, west, north, east)

    gyms = []
    for element in elements:
        gym = parse_osm_element(element, city, state)
        if gym:
            gyms.append(gym)

    if gyms:
        supabase.table("gyms").upsert(gyms, on_conflict="place_id").execute()

    supabase.table("fetched_regions").insert(
        {"city": city, "state": state, "gym_count_found": len(gyms)}
    ).execute()

    # Re-fetch to get DB-assigned UUIDs
    stored = (
        supabase.table("gyms")
        .select("*")
        .eq("city", city)
        .eq("state", state)
        .execute()
    )
    return stored.data, city, state
