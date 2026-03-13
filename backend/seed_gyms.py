"""
Seed climbing gyms for a city into Supabase.

Usage:
  python seed_gyms.py "San Francisco, CA"
  python seed_gyms.py "Denver, CO"
  python seed_gyms.py "New York, NY"
"""

import sys
import time
import requests
from dotenv import load_dotenv
import os

load_dotenv()

from supabase import create_client

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]

OVERPASS_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
]


def geocode(location: str) -> dict:
    print(f"Geocoding '{location}'...")
    resp = requests.get(
        "https://nominatim.openstreetmap.org/search",
        params={"q": location, "format": "json", "limit": 1, "addressdetails": 1},
        headers={"User-Agent": "Smear-ClimbingApp/1.0"},
        timeout=10,
    )
    resp.raise_for_status()
    results = resp.json()
    if not results:
        raise SystemExit(f"Could not geocode '{location}'")
    return results[0]


def fetch_from_overpass(south, west, north, east) -> list:
    query = f"""
[out:json][timeout:40];
(
  node["sport"="climbing"]({south},{west},{north},{east});
  way["sport"="climbing"]({south},{west},{north},{east});
  relation["sport"="climbing"]({south},{west},{north},{east});
);
out center;
"""
    for endpoint in OVERPASS_ENDPOINTS:
        print(f"Querying {endpoint}...")
        try:
            resp = requests.post(endpoint, data={"data": query}, timeout=45)
            resp.raise_for_status()
            elements = resp.json().get("elements", [])
            print(f"  Got {len(elements)} elements")
            return elements
        except requests.HTTPError as e:
            print(f"  Failed ({e}), trying next...")
            time.sleep(1)

    raise SystemExit("All Overpass endpoints failed. Try again later.")


def parse_element(element: dict, city: str, state: str) -> "dict | None":
    tags = element.get("tags", {})
    name = tags.get("name")
    if not name:
        return None

    if element["type"] == "node":
        lat, lng = element.get("lat"), element.get("lon")
    else:
        center = element.get("center", {})
        lat, lng = center.get("lat"), center.get("lon")

    if lat is None or lng is None:
        return None

    address = None
    if tags.get("addr:housenumber") and tags.get("addr:street"):
        address = f"{tags['addr:housenumber']} {tags['addr:street']}"
    elif tags.get("addr:street"):
        address = tags["addr:street"]

    return {
        "place_id": f"osm-{element['type']}-{element['id']}",
        "name": name,
        "address": address,
        "city": city,
        "state": state,
        "lat": lat,
        "lng": lng,
        "source": "openstreetmap",
    }


def main():
    if len(sys.argv) < 2:
        raise SystemExit("Usage: python seed_gyms.py \"City, STATE\"")

    location = sys.argv[1]
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    geo = geocode(location)
    addr = geo.get("address", {})
    city = addr.get("city") or addr.get("town") or addr.get("village") or location
    state = addr.get("state", "")
    print(f"Resolved to: {city}, {state}")

    # Check if already fetched
    existing = supabase.table("fetched_regions").select("id").eq("city", city).eq("state", state).execute()
    if existing.data:
        print(f"Already seeded. Gyms in DB:")
        gyms = supabase.table("gyms").select("name, address").eq("city", city).eq("state", state).execute()
        for g in gyms.data:
            print(f"  - {g['name']} ({g['address'] or 'no address'})")
        return

    # Build bounding box
    bbox = geo.get("boundingbox", [])
    if len(bbox) == 4:
        south, north, west, east = float(bbox[0]), float(bbox[1]), float(bbox[2]), float(bbox[3])
        pad = 0.15
        south -= pad; north += pad; west -= pad; east += pad
    else:
        lat, lng = float(geo["lat"]), float(geo["lon"])
        pad = 0.3
        south, north, west, east = lat - pad, lat + pad, lng - pad, lng + pad

    elements = fetch_from_overpass(south, west, north, east)

    gyms = [g for e in elements for g in [parse_element(e, city, state)] if g]
    print(f"\nFound {len(gyms)} climbing gyms:")
    for g in gyms:
        print(f"  - {g['name']} ({g['address'] or 'no address'})")

    if gyms:
        supabase.table("gyms").upsert(gyms, on_conflict="place_id").execute()
        print(f"\nUpserted {len(gyms)} gyms into Supabase.")

    supabase.table("fetched_regions").upsert(
        {"city": city, "state": state, "gym_count_found": len(gyms)},
        on_conflict="city,state",
    ).execute()
    print(f"Marked '{city}, {state}' as fetched.")


if __name__ == "__main__":
    main()
