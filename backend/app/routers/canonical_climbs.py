import logging
import math
from datetime import datetime, timezone
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from typing import Optional
from app.deps import get_current_user
from app.gyms import get_supabase
from app.models import (
    CanonicalClimbObject,
    PostCanonicalRequest,
    PatchCanonicalPhotoRequest,
)
from app.duplicate_detection import run_duplicate_check

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/canonical-climbs", tags=["canonical-climbs"])

# Tune these thresholds as confidence score distribution becomes clearer in prod
CONFIDENCE_VERIFIED_THRESHOLD = 0.7
CONFIDENCE_ARCHIVED_THRESHOLD = 0.3


def _compute_confidence(log_count: int, last_logged: Optional[str], photo_url: Optional[str]) -> float:
    raw_score = min(1.0, math.log(log_count + 1) / math.log(21))

    if last_logged:
        days_ago = (datetime.now(timezone.utc) - datetime.fromisoformat(last_logged)).days
    else:
        days_ago = 0
    recency_score = math.pow(0.5, days_ago / 30)

    photo_bonus = 0.15 if photo_url else 0.0

    return round(0.7 * raw_score + 0.15 * recency_score + photo_bonus, 4)


def _status_from_confidence(confidence: float) -> str:
    if confidence >= CONFIDENCE_VERIFIED_THRESHOLD:
        return "verified"
    if confidence <= CONFIDENCE_ARCHIVED_THRESHOLD:
        return "archived"
    return "pending"


def recompute_canonical_confidence(supabase, canonical_climb_id: str) -> None:
    """Recompute confidence_score and derive status for a single canonical climb."""
    result = (
        supabase.from_("canonical_climbs")
        .select("log_count, last_logged_at, photo_url")
        .eq("id", canonical_climb_id)
        .maybe_single()
        .execute()
    )
    if not result.data:
        return

    row = result.data
    confidence = _compute_confidence(
        row.get("log_count") or 0,
        row.get("last_logged_at"),
        row.get("photo_url"),
    )
    status = _status_from_confidence(confidence)

    supabase.from_("canonical_climbs").update(
        {"confidence_score": confidence, "status": status}
    ).eq("id", canonical_climb_id).execute()


def _row_to_canonical(row: dict) -> CanonicalClimbObject:
    return CanonicalClimbObject(
        id=row["id"],
        gym_id=row.get("gym_id"),
        gym_grade_value=row["gym_grade_value"],
        hold_color=row.get("hold_color"),
        canonical_tags=row.get("canonical_tags") or [],
        photo_url=row.get("photo_url"),
        log_count=row.get("log_count") or 0,
        send_count=row.get("send_count") or 0,
        flash_count=row.get("flash_count") or 0,
        takedown_votes=row.get("takedown_votes") or 0,
        is_active=row.get("is_active", True),
        status=row.get("status") or "pending",
        confidence_score=row.get("confidence_score"),
        last_logged_at=row.get("last_logged_at"),
        expires_at=row.get("expires_at"),
        seeded_by=row.get("seeded_by"),
        created_at=row["created_at"],
    )


@router.get("", response_model=list[CanonicalClimbObject])
def get_canonical_climbs(
    gym_id: str = Query(...),
    gym_grade_value: int = Query(...),
    hold_color: Optional[str] = Query(default=None),
    _user_id: str = Depends(get_current_user),
):
    supabase = get_supabase()
    query = (
        supabase.from_("canonical_climbs")
        .select("*")
        .eq("gym_id", gym_id)
        .eq("gym_grade_value", gym_grade_value)
        .eq("is_active", True)
        .in_("status", ["pending", "verified"])
        .order("last_logged_at", desc=True)
        .limit(4)
    )
    if hold_color:
        query = query.eq("hold_color", hold_color)

    result = query.execute()
    return [_row_to_canonical(row) for row in (result.data or [])]


@router.post("", response_model=CanonicalClimbObject, status_code=201)
def post_canonical_climb(
    body: PostCanonicalRequest,
    background_tasks: BackgroundTasks,
    _user_id: str = Depends(get_current_user),
):
    supabase = get_supabase()
    result = (
        supabase.from_("canonical_climbs")
        .insert({
            "gym_id": body.gym_id,
            "gym_grade_value": body.gym_grade_value,
            "hold_color": body.hold_color,
            "seeded_by": body.seeded_by,
            "photo_url": body.photo_url,
            "status": "pending",
            "is_active": True,
            "canonical_tags": [],
            "send_count": 0,
            "flash_count": 0,
            "log_count": 1,
        })
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create canonical climb")

    canonical = result.data[0]
    if body.photo_url:
        background_tasks.add_task(run_duplicate_check, canonical["id"])

    return _row_to_canonical(canonical)


@router.patch("/{canonical_id}/photo", response_model=CanonicalClimbObject)
def patch_canonical_photo(
    canonical_id: str,
    body: PatchCanonicalPhotoRequest,
    background_tasks: BackgroundTasks,
    _user_id: str = Depends(get_current_user),
):
    supabase = get_supabase()
    (
        supabase.from_("canonical_climbs")
        .update({"photo_url": body.photo_url})
        .eq("id", canonical_id)
        .execute()
    )

    result = (
        supabase.from_("canonical_climbs")
        .select("*")
        .eq("id", canonical_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Canonical climb not found")

    recompute_canonical_confidence(supabase, canonical_id)
    background_tasks.add_task(run_duplicate_check, canonical_id)
    return _row_to_canonical(result.data[0])
