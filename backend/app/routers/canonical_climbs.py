import logging
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
    result = (
        supabase.from_("canonical_climbs")
        .update({"photo_url": body.photo_url})
        .eq("id", canonical_id)
        .select("*")
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Canonical climb not found")

    background_tasks.add_task(run_duplicate_check, canonical_id)
    return _row_to_canonical(result.data[0])
