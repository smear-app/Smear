import logging
import re

from fastapi import APIRouter, HTTPException

from app.gyms import get_supabase
from app.models import RegisterRequest, RegisterResponse

router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger(__name__)

EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def _normalize_email(email: str) -> str:
    return email.strip().lower()


@router.post("/register", response_model=RegisterResponse, status_code=201)
def register(body: RegisterRequest):
    email = _normalize_email(body.email)
    if not EMAIL_PATTERN.match(email):
        raise HTTPException(status_code=400, detail="Enter a valid email.")

    supabase = get_supabase()

    access_request_result = (
        supabase.from_("access_requests")
        .select("email, status")
        .eq("email", email)
        .limit(1)
        .execute()
    )
    access_request = (access_request_result.data or [None])[0]
    if not access_request or access_request.get("status") != "invited":
        raise HTTPException(status_code=403, detail="This email has not been invited yet.")

    referred_by = None
    if body.referral_code:
        referral_result = (
            supabase.from_("profiles")
            .select("id")
            .eq("referral_code", body.referral_code.strip().upper())
            .limit(1)
            .execute()
        )
        referral_row = (referral_result.data or [None])[0]
        referred_by = referral_row.get("id") if referral_row else None

    try:
        auth_response = supabase.auth.admin.create_user({
            "email": email,
            "password": body.password,
            "email_confirm": True,
        })
    except Exception as exc:
        logger.warning("Registration failed while creating auth user for %s: %s", email, exc)
        raise HTTPException(status_code=400, detail="Registration failed.")

    user = getattr(auth_response, "user", None)
    user_id = getattr(user, "id", None)
    if not user_id:
        raise HTTPException(status_code=500, detail="Registration failed.")

    try:
        supabase.from_("profiles").insert({
            "id": user_id,
            "username": body.username,
            "referral_code": body.username.strip().upper(),
            "avatar_url": None,
            "display_name": body.display_name,
            "referred_by": referred_by,
        }).execute()
    except Exception as exc:
        logger.error("Profile creation failed during registration for %s: %s", email, exc)
        try:
            supabase.auth.admin.delete_user(user_id)
        except Exception as delete_exc:
            logger.error("Rollback failed for auth user %s: %s", user_id, delete_exc)
        raise HTTPException(status_code=500, detail="Registration failed.")

    return RegisterResponse(email=email, user_id=user_id)
