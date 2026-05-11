import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from app.deps import get_current_user
from app.gyms import get_supabase
from app.logging_utils import short_id
from app.models import NotificationObject, NotificationsResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=NotificationsResponse)
def get_notifications(user_id: str = Depends(get_current_user)):
    supabase = get_supabase()

    # Fetch profile for read watermark
    profile_res = (
        supabase.from_("profiles")
        .select("inbox_last_read_at")
        .eq("id", user_id)
        .maybe_single()
        .execute()
    )
    last_read_at = (profile_res.data or {}).get("inbox_last_read_at")

    # Direct events (reactions + comments targeting this user)
    direct_res = (
        supabase.from_("feed_events")
        .select("*, profiles!feed_events_actor_id_fkey(display_name, username, avatar_url), sessions(gym_name, cover_photo_url), session_comments(body)")
        .eq("target_user_id", user_id)
        .order("created_at", desc=True)
        .limit(30)
        .execute()
    )

    # New-post events from followed users (fan-out on read)
    following_res = (
        supabase.from_("follows")
        .select("following_id")
        .eq("follower_id", user_id)
        .execute()
    )
    following_ids = [r["following_id"] for r in following_res.data or []]

    new_post_events: list[dict] = []
    if following_ids:
        np_res = (
            supabase.from_("feed_events")
            .select("*, profiles!feed_events_actor_id_fkey(display_name, username, avatar_url), sessions(gym_name, cover_photo_url)")
            .eq("type", "new_post")
            .in_("actor_id", following_ids)
            .order("created_at", desc=True)
            .limit(30)
            .execute()
        )
        new_post_events = np_res.data or []

    all_events = (direct_res.data or []) + new_post_events
    all_events.sort(key=lambda e: e["created_at"], reverse=True)
    all_events = all_events[:30]

    def _to_notification(row: dict) -> NotificationObject:
        actor = row.get("profiles") or {}
        session = row.get("sessions") or {}
        comment = row.get("session_comments") or {}
        return NotificationObject(
            id=row["id"],
            type=row["type"],
            actor_id=row["actor_id"],
            actor_display_name=actor.get("display_name"),
            actor_username=actor.get("username"),
            actor_avatar_url=actor.get("avatar_url"),
            session_id=row.get("session_id"),
            session_gym_name=session.get("gym_name"),
            session_cover_photo_url=session.get("cover_photo_url"),
            comment_body=comment.get("body"),
            created_at=row["created_at"],
        )

    notifications = [_to_notification(e) for e in all_events]

    unread_count = 0
    if last_read_at:
        unread_count = sum(1 for n in notifications if n.created_at > last_read_at)
    else:
        unread_count = len(notifications)

    logger.info("Notifications user=%s total=%d unread=%d", short_id(user_id), len(notifications), unread_count)
    return NotificationsResponse(notifications=notifications, unread_count=unread_count)


@router.post("/mark-read", status_code=204)
def mark_notifications_read(user_id: str = Depends(get_current_user)):
    supabase = get_supabase()
    now = datetime.now(timezone.utc).isoformat()
    supabase.from_("profiles").update({"inbox_last_read_at": now}).eq("id", user_id).execute()
