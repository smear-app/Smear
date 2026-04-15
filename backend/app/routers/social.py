import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from app.deps import get_current_user
from app.gyms import get_supabase
from app.models import (
    CommentObject,
    FollowObject,
    FollowsResponse,
    PostCommentRequest,
    SessionCardObject,
    UserSearchResult,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/social", tags=["social"])


def _short_id(value: str | None) -> str:
    return value[:8] if value else "-"


def _row_to_session_card(row: dict, viewer_id: str, reaction_counts: dict, comment_counts: dict, viewer_reactions: set) -> SessionCardObject:
    profile = row.get("profiles") or {}
    sid = row["id"]
    return SessionCardObject(
        id=sid,
        user_id=row["user_id"],
        gym_id=row.get("gym_id"),
        gym_name=row.get("gym_name"),
        started_at=row.get("started_at") or row.get("created_at"),
        ended_at=row.get("ended_at"),
        visibility=row.get("visibility", "followers"),
        total_climbs=row.get("total_climbs"),
        sends=row.get("sends"),
        flashes=row.get("flashes"),
        attempts=row.get("attempts"),
        hardest_grade=row.get("hardest_grade"),
        hardest_grade_value=row.get("hardest_grade_value"),
        hardest_flash=row.get("hardest_flash"),
        hardest_flash_value=row.get("hardest_flash_value"),
        top_tags=row.get("top_tags") or [],
        cover_photo_url=row.get("cover_photo_url"),
        created_at=row.get("started_at"),
        author_display_name=profile.get("display_name"),
        author_username=profile.get("username"),
        author_avatar_url=profile.get("avatar_url"),
        reaction_count=reaction_counts.get(sid, 0),
        comment_count=comment_counts.get(sid, 0),
        viewer_has_reacted=sid in viewer_reactions,
    )


def _enrich_sessions(supabase, sessions: list[dict], viewer_id: str) -> list[SessionCardObject]:
    if not sessions:
        return []

    session_ids = [s["id"] for s in sessions]

    reactions = supabase.from_("session_reactions").select("session_id, user_id").in_("session_id", session_ids).execute()
    reaction_counts: dict[str, int] = {}
    viewer_reactions: set[str] = set()
    for r in reactions.data or []:
        sid = r["session_id"]
        reaction_counts[sid] = reaction_counts.get(sid, 0) + 1
        if r["user_id"] == viewer_id:
            viewer_reactions.add(sid)

    comments = supabase.from_("session_comments").select("session_id").in_("session_id", session_ids).execute()
    comment_counts: dict[str, int] = {}
    for c in comments.data or []:
        sid = c["session_id"]
        comment_counts[sid] = comment_counts.get(sid, 0) + 1

    return [_row_to_session_card(s, viewer_id, reaction_counts, comment_counts, viewer_reactions) for s in sessions]


# ── Feed ──────────────────────────────────────────────────────────────────────

@router.get("/feed", response_model=list[SessionCardObject])
def get_feed(
    limit: int = Query(default=20, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
    user_id: str = Depends(get_current_user),
):
    """Sessions from users the viewer follows, visibility followers|public."""
    supabase = get_supabase()

    following = supabase.from_("follows").select("following_id").eq("follower_id", user_id).execute()
    following_ids = [r["following_id"] for r in following.data or []]

    if not following_ids:
        logger.info("Social feed user=%s following=0 sessions=0", _short_id(user_id))
        return []

    result = (
        supabase.from_("sessions")
        .select("*, profiles!sessions_user_id_fkey(display_name, username, avatar_url)")
        .in_("user_id", following_ids)
        .eq("is_published", True)
        .in_("visibility", ["followers", "public"])
        .order("ended_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )
    sessions = result.data or []
    logger.info(
        "Social feed user=%s following=%d sessions=%d offset=%d limit=%d",
        _short_id(user_id),
        len(following_ids),
        len(sessions),
        offset,
        limit,
    )
    return _enrich_sessions(supabase, sessions, user_id)


@router.get("/explore", response_model=list[SessionCardObject])
def get_explore(
    limit: int = Query(default=20, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
    gym_id: Optional[str] = None,
    user_id: str = Depends(get_current_user),
):
    """Public sessions, optionally scoped to a gym."""
    supabase = get_supabase()

    query = (
        supabase.from_("sessions")
        .select("*, profiles!sessions_user_id_fkey(display_name, username, avatar_url)")
        .eq("is_published", True)
        .eq("visibility", "public")
        .order("ended_at", desc=True)
        .range(offset, offset + limit - 1)
    )
    if gym_id:
        query = query.eq("gym_id", gym_id)

    result = query.execute()
    sessions = result.data or []
    logger.info(
        "Social explore user=%s gym=%s sessions=%d offset=%d limit=%d",
        _short_id(user_id),
        _short_id(gym_id),
        len(sessions),
        offset,
        limit,
    )
    return _enrich_sessions(supabase, sessions, user_id)


# ── Follows ───────────────────────────────────────────────────────────────────

@router.get("/follows", response_model=FollowsResponse)
def get_follows(user_id: str = Depends(get_current_user)):
    supabase = get_supabase()

    following_res = (
        supabase.from_("follows")
        .select("following_id, created_at, profiles!follows_following_id_fkey(display_name, username, avatar_url)")
        .eq("follower_id", user_id)
        .execute()
    )
    followers_res = (
        supabase.from_("follows")
        .select("follower_id, created_at, profiles!follows_follower_id_fkey(display_name, username, avatar_url)")
        .eq("following_id", user_id)
        .execute()
    )

    def _to_follow_object(row: dict, id_key: str) -> FollowObject:
        profile = row.get("profiles") or {}
        return FollowObject(
            user_id=row[id_key],
            display_name=profile.get("display_name"),
            username=profile.get("username"),
            avatar_url=profile.get("avatar_url"),
            followed_at=row["created_at"],
        )

    return FollowsResponse(
        following=[_to_follow_object(r, "following_id") for r in following_res.data or []],
        followers=[_to_follow_object(r, "follower_id") for r in followers_res.data or []],
    )


@router.post("/follows/{target_user_id}", status_code=201)
def follow_user(target_user_id: str, user_id: str = Depends(get_current_user)):
    if target_user_id == user_id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    supabase = get_supabase()
    supabase.from_("follows").upsert(
        {"follower_id": user_id, "following_id": target_user_id},
        on_conflict="follower_id,following_id",
    ).execute()
    return {"following": target_user_id}


@router.delete("/follows/{target_user_id}", status_code=204)
def unfollow_user(target_user_id: str, user_id: str = Depends(get_current_user)):
    supabase = get_supabase()
    supabase.from_("follows").delete().eq("follower_id", user_id).eq("following_id", target_user_id).execute()


# ── User search ───────────────────────────────────────────────────────────────

@router.get("/users/search", response_model=list[UserSearchResult])
def search_users(
    q: str = Query(default="", min_length=1),
    user_id: str = Depends(get_current_user),
):
    supabase = get_supabase()
    result = (
        supabase.from_("profiles")
        .select("id, display_name, username, avatar_url")
        .or_(f"username.ilike.%{q}%,display_name.ilike.%{q}%")
        .neq("id", user_id)
        .limit(20)
        .execute()
    )

    if not result.data:
        return []

    target_ids = [r["id"] for r in result.data]
    following_res = (
        supabase.from_("follows")
        .select("following_id")
        .eq("follower_id", user_id)
        .in_("following_id", target_ids)
        .execute()
    )
    following_set = {r["following_id"] for r in following_res.data or []}

    return [
        UserSearchResult(
            user_id=r["id"],
            display_name=r.get("display_name"),
            username=r.get("username"),
            avatar_url=r.get("avatar_url"),
            is_following=r["id"] in following_set,
        )
        for r in result.data
    ]


# ── Reactions ─────────────────────────────────────────────────────────────────

@router.post("/sessions/{session_id}/reactions", status_code=201)
def add_reaction(session_id: str, user_id: str = Depends(get_current_user)):
    supabase = get_supabase()
    supabase.from_("session_reactions").upsert(
        {"session_id": session_id, "user_id": user_id},
        on_conflict="session_id,user_id",
    ).execute()
    return {"reacted": True}


@router.delete("/sessions/{session_id}/reactions", status_code=204)
def remove_reaction(session_id: str, user_id: str = Depends(get_current_user)):
    supabase = get_supabase()
    supabase.from_("session_reactions").delete().eq("session_id", session_id).eq("user_id", user_id).execute()


# ── Comments ──────────────────────────────────────────────────────────────────

@router.get("/sessions/{session_id}/comments", response_model=list[CommentObject])
def get_comments(session_id: str, user_id: str = Depends(get_current_user)):
    supabase = get_supabase()
    result = (
        supabase.from_("session_comments")
        .select("*, profiles(display_name, username, avatar_url)")
        .eq("session_id", session_id)
        .order("created_at", desc=False)
        .execute()
    )
    out = []
    for row in result.data or []:
        profile = row.get("profiles") or {}
        out.append(CommentObject(
            id=row["id"],
            session_id=row["session_id"],
            user_id=row["user_id"],
            body=row["body"],
            created_at=row["created_at"],
            author_display_name=profile.get("display_name"),
            author_username=profile.get("username"),
            author_avatar_url=profile.get("avatar_url"),
        ))
    return out


@router.post("/sessions/{session_id}/comments", response_model=CommentObject, status_code=201)
def post_comment(session_id: str, body: PostCommentRequest, user_id: str = Depends(get_current_user)):
    if not body.body.strip():
        raise HTTPException(status_code=400, detail="Comment body cannot be empty")
    supabase = get_supabase()
    result = (
        supabase.from_("session_comments")
        .insert({"session_id": session_id, "user_id": user_id, "body": body.body.strip()})
        .select("*, profiles(display_name, username, avatar_url)")
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to post comment")
    row = result.data[0]
    profile = row.get("profiles") or {}
    return CommentObject(
        id=row["id"],
        session_id=row["session_id"],
        user_id=row["user_id"],
        body=row["body"],
        created_at=row["created_at"],
        author_display_name=profile.get("display_name"),
        author_username=profile.get("username"),
        author_avatar_url=profile.get("avatar_url"),
    )
