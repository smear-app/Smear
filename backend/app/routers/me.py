import logging
from fastapi import APIRouter, Depends, HTTPException
from app.deps import get_current_user
from app.gyms import get_supabase
from app.logging_utils import short_id
from app.models import (
    MeResponse,
    PatchMeRequest,
    PatchPasswordRequest,
    PatchGymPrefsRequest,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/me", tags=["me"])


def _build_me_response(user_id: str, supabase) -> MeResponse:
    profile_result = (
        supabase.from_("profiles")
        .select("display_name, username, avatar_url, is_admin, bookmarked_gym_ids, recent_gym_ids, created_at")
        .eq("id", user_id)
        .single()
        .execute()
    )
    profile = profile_result.data or {}

    try:
        auth_user = supabase.auth.admin.get_user_by_id(user_id)
        email = auth_user.user.email or ""
    except Exception as exc:
        logger.warning("Could not fetch email for user %s: %s", user_id, exc)
        email = ""

    return MeResponse(
        id=user_id,
        email=email,
        display_name=profile.get("display_name"),
        username=profile.get("username"),
        avatar_url=profile.get("avatar_url"),
        is_admin=profile.get("is_admin") or False,
        bookmarked_gym_ids=profile.get("bookmarked_gym_ids") or [],
        recent_gym_ids=profile.get("recent_gym_ids") or [],
        created_at=profile.get("created_at"),
    )


@router.get("", response_model=MeResponse)
def get_me(user_id: str = Depends(get_current_user)):
    supabase = get_supabase()
    return _build_me_response(user_id, supabase)


@router.patch("", response_model=MeResponse)
def patch_me(body: PatchMeRequest, user_id: str = Depends(get_current_user)):
    supabase = get_supabase()
    updates = body.model_dump(exclude_unset=True)
    if updates:
        supabase.from_("profiles").update(updates).eq("id", user_id).execute()
    return _build_me_response(user_id, supabase)


@router.patch("/password", status_code=204)
def patch_password(body: PatchPasswordRequest, user_id: str = Depends(get_current_user)):
    supabase = get_supabase()

    # Get user email for password verification
    try:
        auth_user = supabase.auth.admin.get_user_by_id(user_id)
        email = auth_user.user.email
    except Exception as exc:
        logger.error("Could not fetch user email for password change: %s", exc)
        raise HTTPException(status_code=500, detail="Could not verify identity")

    # Verify old password by attempting sign-in
    try:
        result = supabase.auth.sign_in_with_password({"email": email, "password": body.old_password})
        if result.user is None:
            raise HTTPException(status_code=401, detail="Current password is incorrect")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Current password is incorrect")

    # Update password via admin API
    try:
        supabase.auth.admin.update_user_by_id(user_id, {"password": body.new_password})
    except Exception as exc:
        logger.error("Password update failed for user %s: %s", user_id, exc)
        raise HTTPException(status_code=500, detail="Failed to update password")


@router.patch("/gym-preferences", status_code=204)
def patch_gym_preferences(body: PatchGymPrefsRequest, user_id: str = Depends(get_current_user)):
    supabase = get_supabase()
    supabase.from_("profiles").update({
        "bookmarked_gym_ids": body.bookmarked_gym_ids,
        "recent_gym_ids": body.recent_gym_ids,
    }).eq("id", user_id).execute()
    logger.info(
        "Updated gym preferences user=%s bookmarked=%d recent=%d",
        short_id(user_id),
        len(body.bookmarked_gym_ids),
        len(body.recent_gym_ids),
    )
