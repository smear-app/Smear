import logging
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from app.deps import get_current_user
from app.gyms import get_supabase
from app.models import (
    ClimbObject,
    PaginatedClimbsResponse,
    PatchClimbRequest,
    PatchClimbPhotoRequest,
    PostClimbRequest,
    ClimbsMetaResponse,
    LoggedGymOption,
    LoggedGradeOption,
)

from app.routers.canonical_climbs import recompute_canonical_confidence

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/climbs", tags=["climbs"])

SESSION_THRESHOLD_HOURS = 3


def _row_to_climb_object(row: dict) -> ClimbObject:
    """Map a DB row (possibly with canonical_climbs join) to ClimbObject."""
    canonical = row.get("canonical_climbs") or {}
    photo_url = row.get("photo_url") or (canonical.get("photo_url") if isinstance(canonical, dict) else None)
    return ClimbObject(
        id=row["id"],
        user_id=row["user_id"],
        gym_id=row.get("gym_id"),
        gym_name=row.get("gym_name"),
        gym_grade=row["gym_grade"],
        gym_grade_value=row["gym_grade_value"],
        personal_grade=row.get("personal_grade"),
        personal_grade_value=row.get("personal_grade_value"),
        send_type=row["send_type"],
        tags=row.get("tags") or [],
        photo_url=photo_url,
        hold_color=row.get("hold_color"),
        notes=row.get("notes"),
        canonical_climb_id=row.get("canonical_climb_id"),
        session_id=row.get("session_id"),
        created_at=row["created_at"],
    )


def _find_active_session(supabase, user_id: str, gym_id: Optional[str], threshold: str) -> Optional[str]:
    query = (
        supabase.from_("sessions")
        .select("id")
        .eq("user_id", user_id)
        .gt("ended_at", threshold)
        .order("ended_at", desc=True)
        .limit(1)
    )
    query = query.eq("gym_id", gym_id) if gym_id else query.is_("gym_id", "null")
    result = query.execute()
    return result.data[0]["id"] if result.data else None


def _get_or_create_session(supabase, user_id: str, gym_id: Optional[str], gym_name: Optional[str]) -> str:
    threshold = (datetime.now(timezone.utc) - timedelta(hours=SESSION_THRESHOLD_HOURS)).isoformat()
    existing = _find_active_session(supabase, user_id, gym_id, threshold)
    if existing:
        return existing
    result = (
        supabase.from_("sessions")
        .insert({"user_id": user_id, "gym_id": gym_id, "gym_name": gym_name})
        .execute()
    )
    return result.data[0]["id"]


def _touch_session(supabase, session_id: str) -> None:
    supabase.from_("sessions").update(
        {"ended_at": datetime.now(timezone.utc).isoformat()}
    ).eq("id", session_id).execute()


def _soft_delete_canonical_if_unused(supabase, canonical_climb_id: Optional[str]) -> None:
    if not canonical_climb_id:
        return

    remaining = (
        supabase.from_("climbs")
        .select("id", count="exact")
        .eq("canonical_climb_id", canonical_climb_id)
        .limit(1)
        .execute()
    )
    if (remaining.count or 0) > 0:
        return

    supabase.from_("canonical_climbs").update(
        {"status": "deleted", "is_active": False}
    ).eq("id", canonical_climb_id).execute()


@router.get("", response_model=PaginatedClimbsResponse)
def get_climbs(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    sort: str = Query(default="newest"),
    gym_id: Optional[str] = None,
    send_types: Optional[List[str]] = Query(default=None),
    wall_types: Optional[List[str]] = Query(default=None),
    hold_types: Optional[List[str]] = Query(default=None),
    movement_types: Optional[List[str]] = Query(default=None),
    mechanic_types: Optional[List[str]] = Query(default=None),
    grades: Optional[List[str]] = Query(default=None),
    user_id: str = Depends(get_current_user),
):
    supabase = get_supabase()
    query = (
        supabase.from_("climbs")
        .select("*, canonical_climbs(photo_url)", count="exact")
        .eq("user_id", user_id)
    )

    if gym_id and gym_id != "all":
        query = query.eq("gym_id", gym_id)
    if send_types:
        query = query.in_("send_type", send_types)
    if wall_types:
        query = query.overlaps("tags", [t.lower() for t in wall_types])
    if hold_types:
        query = query.overlaps("tags", [t.lower() for t in hold_types])
    if movement_types:
        query = query.overlaps("tags", [t.lower() for t in movement_types])
    if mechanic_types:
        query = query.overlaps("tags", [t.lower() for t in mechanic_types])
    if grades:
        query = query.in_("gym_grade", grades)

    if sort == "hardest":
        query = query.order("gym_grade_value", desc=True).order("created_at", desc=True)
    elif sort == "easiest":
        query = query.order("gym_grade_value", desc=False).order("created_at", desc=True)
    elif sort == "oldest":
        query = query.order("created_at", desc=False)
    else:
        query = query.order("created_at", desc=True)

    result = query.range(offset, offset + limit - 1).execute()
    return PaginatedClimbsResponse(
        climbs=[_row_to_climb_object(row) for row in (result.data or [])],
        total_count=result.count or 0,
    )


@router.get("/meta", response_model=ClimbsMetaResponse)
def get_climbs_meta(user_id: str = Depends(get_current_user)):
    supabase = get_supabase()

    gyms_result = (
        supabase.from_("climbs")
        .select("gym_id, gym_name")
        .eq("user_id", user_id)
        .not_.is_("gym_id", "null")
        .execute()
    )
    seen_gym_ids: set[str] = set()
    gyms: list[LoggedGymOption] = []
    for row in gyms_result.data or []:
        gid = row.get("gym_id")
        if gid and gid not in seen_gym_ids and row.get("gym_name"):
            seen_gym_ids.add(gid)
            gyms.append(LoggedGymOption(id=gid, name=row["gym_name"]))

    grades_result = (
        supabase.from_("climbs")
        .select("gym_grade, gym_grade_value")
        .eq("user_id", user_id)
        .not_.is_("gym_grade", "null")
        .execute()
    )
    seen_grades: set[str] = set()
    grades: list[LoggedGradeOption] = []
    for row in grades_result.data or []:
        grade = row.get("gym_grade")
        if grade and grade not in seen_grades:
            seen_grades.add(grade)
            grades.append(LoggedGradeOption(grade=grade, value=row.get("gym_grade_value") or 0))
    grades.sort(key=lambda g: g.value)

    return ClimbsMetaResponse(gyms=gyms, grades=grades)


@router.get("/recent", response_model=list[ClimbObject])
def get_recent_climbs(user_id: str = Depends(get_current_user)):
    supabase = get_supabase()
    result = (
        supabase.from_("climbs")
        .select("*, canonical_climbs(photo_url)")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(5)
        .execute()
    )
    return [_row_to_climb_object(row) for row in (result.data or [])]


@router.get("/{climb_id}", response_model=ClimbObject)
def get_climb_by_id(climb_id: str, user_id: str = Depends(get_current_user)):
    supabase = get_supabase()
    result = (
        supabase.from_("climbs")
        .select("*, canonical_climbs(photo_url)")
        .eq("user_id", user_id)
        .eq("id", climb_id)
        .maybe_single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Climb not found")
    return _row_to_climb_object(result.data)


@router.post("", response_model=ClimbObject, status_code=201)
def post_climb(body: PostClimbRequest, user_id: str = Depends(get_current_user)):
    supabase = get_supabase()

    session_id = _get_or_create_session(supabase, user_id, body.gym_id, body.gym_name)

    payload: dict = {
        "user_id": user_id,
        "gym_id": body.gym_id,
        "gym_name": body.gym_name,
        "gym_grade": body.gym_grade,
        "gym_grade_value": body.gym_grade_value,
        "personal_grade": body.personal_grade,
        "personal_grade_value": body.personal_grade_value,
        "send_type": body.send_type.lower(),
        "tags": [t.lower() for t in body.tags],
        "photo_url": body.photo_url,
        "hold_color": body.hold_color,
        "notes": body.notes,
        "session_id": session_id,
    }
    if body.canonical_climb_id is not None:
        payload["canonical_climb_id"] = body.canonical_climb_id
    if body.confidence_score is not None:
        payload["confidence_score"] = body.confidence_score
    if body.override_signal:
        payload["override_signal"] = body.override_signal

    result = supabase.from_("climbs").insert(payload).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to insert climb")

    _touch_session(supabase, session_id)
    if body.canonical_climb_id:
        recompute_canonical_confidence(supabase, body.canonical_climb_id)
    return _row_to_climb_object(result.data[0])


@router.patch("/{climb_id}", response_model=ClimbObject)
def patch_climb(climb_id: str, body: PatchClimbRequest, user_id: str = Depends(get_current_user)):
    supabase = get_supabase()

    updates = body.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = (
        supabase.from_("climbs")
        .update(updates)
        .eq("id", climb_id)
        .eq("user_id", user_id)
        .select("*")
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Climb not found")
    return _row_to_climb_object(result.data[0])


@router.patch("/{climb_id}/photo", response_model=ClimbObject)
def patch_climb_photo(climb_id: str, body: PatchClimbPhotoRequest, user_id: str = Depends(get_current_user)):
    supabase = get_supabase()
    result = (
        supabase.from_("climbs")
        .update({"photo_url": body.photo_url})
        .eq("id", climb_id)
        .eq("user_id", user_id)
        .select("*")
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Climb not found")
    return _row_to_climb_object(result.data[0])


@router.delete("/{climb_id}", status_code=204)
def delete_climb(climb_id: str, user_id: str = Depends(get_current_user)):
    supabase = get_supabase()
    climb = (
        supabase.from_("climbs")
        .select("id, canonical_climb_id")
        .eq("id", climb_id)
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )
    if not climb or not climb.data:
        raise HTTPException(status_code=404, detail="Climb not found")

    canonical_climb_id = climb.data.get("canonical_climb_id")

    supabase.from_("climbs").delete().eq("id", climb_id).eq("user_id", user_id).execute()
    _soft_delete_canonical_if_unused(supabase, canonical_climb_id)
