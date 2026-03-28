import logging
import os
from typing import List, Optional

import httpx

from app.gyms import get_supabase

logger = logging.getLogger(__name__)

EMBEDDING_SERVICE_URL = os.getenv("EMBEDDING_SERVICE_URL", "https://jphan10--image-embedding-gen-embedder-embed.modal.run")
SIMILARITY_THRESHOLD = 0.85

async def _fetch_embedding(photo_url: str) -> Optional[List[float]]:
    """Get a 512-dim CLIP embedding for an image URL via the HF Space."""
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            EMBEDDING_SERVICE_URL,
            json={"image_url": photo_url},
        )

    if resp.status_code != 200:
        logger.error("Embedding service error %d: %s", resp.status_code, resp.text)
        return None

    data = resp.json()
    logger.info("Got embedding dim=%d", data.get("dim"))
    return data["embedding"]


async def run_duplicate_check(canonical_id: str) -> None:
    """
    Full duplicate detection pipeline for a single canonical climb:
      1. Fetch photo_url from DB
      2. Get CLIP embedding via HF Space
      3. Write embedding back to canonical_climbs
      4. Query for cosine similarity > SIMILARITY_THRESHOLD within same fingerprint bucket
      5. Insert flagged pairs into duplicate_flags
    """
    supabase = get_supabase()

    result = (
        supabase.table("canonical_climbs")
        .select("id, photo_url, gym_id, gym_grade_value, hold_color")
        .eq("id", canonical_id)
        .single()
        .execute()
    )
    canonical = result.data
    if not canonical:
        logger.warning("Canonical %s not found", canonical_id)
        return

    if not canonical.get("photo_url"):
        logger.info("Canonical %s has no photo — skipping duplicate check", canonical_id)
        return

    logger.info("Fetching embedding for canonical %s", canonical_id)
    embedding = await _fetch_embedding(canonical["photo_url"])
    if not embedding:
        return

    supabase.table("canonical_climbs").update({"embedding": embedding}).eq("id", canonical_id).execute()
    logger.info("Saved embedding for canonical %s", canonical_id)

    matches = (
        supabase.rpc(
            "find_duplicate_canonicals",
            {
                "query_embedding": embedding,
                "p_gym_id": canonical["gym_id"],
                "p_grade_value": canonical["gym_grade_value"],
                "p_hold_color": canonical["hold_color"],
                "p_canonical_id": canonical_id,
                "p_threshold": SIMILARITY_THRESHOLD,
            },
        )
        .execute()
        .data
    ) or []

    for match in matches:
        id_a, id_b = sorted([canonical_id, match["id"]])
        try:
            supabase.table("duplicate_flags").insert(
                {
                    "canonical_id_a": id_a,
                    "canonical_id_b": id_b,
                    "similarity_score": match["similarity"],
                }
            ).execute()
            logger.info("Flagged duplicate pair (%s, %s) score=%.3f", id_a, id_b, match["similarity"])
        except Exception as exc:
            logger.debug("Duplicate flag already exists or insert failed: %s", exc)
