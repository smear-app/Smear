import logging
from collections import Counter
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from app.deps import get_current_user
from app.gyms import get_supabase
from app.models import EndSessionRequest, SessionObject
from app.session_insights import (
    classify_session_insight,
    compute_session_metric_snapshot,
    get_prior_session_metric_snapshots,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/sessions", tags=["sessions"])

SESSION_THRESHOLD_HOURS = 3


def _first_row(result):
    data = getattr(result, "data", None)
    if isinstance(data, list):
        return data[0] if data else None
    return data


def _compute_and_publish_session(supabase, session_id: str, user_id: str, visibility: Optional[str] = None) -> None:
    """Aggregate climb stats for a session and mark it published."""
    session_result = (
        supabase.from_("sessions")
        .select("id, started_at, insight_label, insight_reason")
        .eq("id", session_id)
        .limit(1)
        .execute()
    )
    session = _first_row(session_result) or {"id": session_id}

    # Resolve visibility from profile default if not overridden
    if visibility is None:
        profile = (
            supabase.from_("profiles")
            .select("default_visibility")
            .eq("id", user_id)
            .limit(1)
            .execute()
        )
        visibility = (_first_row(profile) or {}).get("default_visibility", "followers")

    # Fetch all climbs in this session
    climbs_result = (
        supabase.from_("climbs")
        .select("send_type, gym_grade, gym_grade_value, tags, photo_url")
        .eq("session_id", session_id)
        .execute()
    )
    climbs = climbs_result.data or []

    if not climbs:
        # Empty session — don't publish
        return

    total_climbs = len(climbs)
    sends = sum(1 for c in climbs if c.get("send_type") == "send")
    flashes = sum(1 for c in climbs if c.get("send_type") == "flash")
    attempts = sum(1 for c in climbs if c.get("send_type") == "attempt")

    # Hardest send (flash or send)
    send_climbs = [c for c in climbs if c.get("send_type") in ("send", "flash")]
    hardest = max(send_climbs, key=lambda c: c.get("gym_grade_value") or -99, default=None)
    hardest_grade = hardest["gym_grade"] if hardest else None
    hardest_grade_value = hardest["gym_grade_value"] if hardest else None

    flash_climbs = [c for c in climbs if c.get("send_type") == "flash"]
    hardest_fl = max(flash_climbs, key=lambda c: c.get("gym_grade_value") or -99, default=None)
    hardest_flash = hardest_fl["gym_grade"] if hardest_fl else None
    hardest_flash_value = hardest_fl["gym_grade_value"] if hardest_fl else None

    # Top tags (3 most common across all climbs)
    all_tags: list[str] = []
    for c in climbs:
        all_tags.extend(c.get("tags") or [])
    top_tags = [tag for tag, _ in Counter(all_tags).most_common(3)]

    # Cover photo: first climb with a photo
    cover_photo_url = next((c["photo_url"] for c in climbs if c.get("photo_url")), None)
    insight_payload = {}
    if total_climbs >= 3 and not (session.get("insight_label") and session.get("insight_reason")):
        session_start_at = session.get("started_at") or datetime.now(timezone.utc).isoformat()
        current_metrics = compute_session_metric_snapshot(
            {"id": session_id, "started_at": session_start_at},
            climbs,
        )
        prior_metrics = get_prior_session_metric_snapshots(supabase, user_id, session_start_at)
        insight = classify_session_insight(current_metrics, prior_metrics)
        insight_payload = {
            "insight_label": insight["label"],
            "insight_reason": insight["reason"],
            "insight_classifier_version": insight["classifier_version"],
        }

    supabase.from_("sessions").update(
        {
            "is_published": True,
            "visibility": visibility,
            "total_climbs": total_climbs,
            "sends": sends,
            "flashes": flashes,
            "attempts": attempts,
            "hardest_grade": hardest_grade,
            "hardest_grade_value": hardest_grade_value,
            "hardest_flash": hardest_flash,
            "hardest_flash_value": hardest_flash_value,
            "top_tags": top_tags,
            "cover_photo_url": cover_photo_url,
            **insight_payload,
        },
        returning="representation",
    ).eq("id", session_id).execute()


def publish_stale_sessions(supabase, user_id: str) -> None:
    """Publish sessions that have been idle longer than the threshold. Called as background task."""
    threshold = (datetime.now(timezone.utc) - timedelta(hours=SESSION_THRESHOLD_HOURS)).isoformat()
    result = (
        supabase.from_("sessions")
        .select("id")
        .eq("user_id", user_id)
        .eq("is_published", False)
        .lt("ended_at", threshold)
        .execute()
    )
    for session in result.data or []:
        try:
            _compute_and_publish_session(supabase, session["id"], user_id)
        except Exception:
            logger.exception("Failed to publish stale session %s", session["id"])


def _response_data(result):
    return getattr(result, "data", None) if result is not None else None


@router.get("/active", response_model=Optional[SessionObject])
def get_active_session(user_id: str = Depends(get_current_user)):
    """Returns the current active (unpublished) session if one exists within the threshold."""
    supabase = get_supabase()
    threshold = (datetime.now(timezone.utc) - timedelta(hours=SESSION_THRESHOLD_HOURS)).isoformat()
    result = (
        supabase.from_("sessions")
        .select("*")
        .eq("user_id", user_id)
        .eq("is_published", False)
        .gt("ended_at", threshold)
        .order("ended_at", desc=True)
        .limit(1)
        .execute()
    )
    row = _first_row(result)
    if not row:
        return None
    return SessionObject(
        id=row["id"],
        user_id=row["user_id"],
        gym_id=row.get("gym_id"),
        gym_name=row.get("gym_name"),
        started_at=row.get("started_at"),
        ended_at=row.get("ended_at"),
        visibility=row.get("visibility", "followers"),
        is_published=row.get("is_published", False),
        total_climbs=row.get("total_climbs"),
        sends=row.get("sends"),
        flashes=row.get("flashes"),
        attempts=row.get("attempts"),
        hardest_grade=row.get("hardest_grade"),
        hardest_grade_value=row.get("hardest_grade_value"),
        hardest_flash=row.get("hardest_flash"),
        hardest_flash_value=row.get("hardest_flash_value"),
        insight_label=row.get("insight_label"),
        insight_reason=row.get("insight_reason"),
        insight_classifier_version=row.get("insight_classifier_version"),
        top_tags=row.get("top_tags") or [],
        cover_photo_url=row.get("cover_photo_url"),
        created_at=row.get("started_at"),
    )


@router.post("/{session_id}/end", response_model=SessionObject)
def end_session(
    session_id: str,
    body: EndSessionRequest,
    user_id: str = Depends(get_current_user),
):
    supabase = get_supabase()

    # Verify ownership
    result = (
        supabase.from_("sessions")
        .select("*")
        .eq("id", session_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    session = _first_row(result)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.get("is_published"):
        raise HTTPException(status_code=400, detail="Session already published")

    # Touch ended_at to now if not set
    supabase.from_("sessions").update(
        {"ended_at": datetime.now(timezone.utc).isoformat()},
        returning="representation",
    ).eq("id", session_id).execute()

    _compute_and_publish_session(supabase, session_id, user_id, body.visibility)

    updated = (
        supabase.from_("sessions")
        .select("*")
        .eq("id", session_id)
        .limit(1)
        .execute()
    )
    row = _first_row(updated) or {}
    return SessionObject(
        id=row["id"],
        user_id=row["user_id"],
        gym_id=row.get("gym_id"),
        gym_name=row.get("gym_name"),
        started_at=row.get("started_at"),
        ended_at=row.get("ended_at"),
        visibility=row.get("visibility", "followers"),
        is_published=row.get("is_published", False),
        total_climbs=row.get("total_climbs"),
        sends=row.get("sends"),
        flashes=row.get("flashes"),
        attempts=row.get("attempts"),
        hardest_grade=row.get("hardest_grade"),
        hardest_grade_value=row.get("hardest_grade_value"),
        hardest_flash=row.get("hardest_flash"),
        hardest_flash_value=row.get("hardest_flash_value"),
        insight_label=row.get("insight_label"),
        insight_reason=row.get("insight_reason"),
        insight_classifier_version=row.get("insight_classifier_version"),
        top_tags=row.get("top_tags") or [],
        cover_photo_url=row.get("cover_photo_url"),
        created_at=row.get("started_at"),
    )
