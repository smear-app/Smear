import re

from fastapi import APIRouter, HTTPException

from app.gyms import get_supabase
from app.models import AccessRequestCreate, AccessRequestResponse

router = APIRouter(prefix="/access-requests", tags=["access-requests"])

EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def _normalize_email(email: str) -> str:
    return email.strip().lower()


@router.post("", response_model=AccessRequestResponse, status_code=201)
def create_access_request(body: AccessRequestCreate):
    email = _normalize_email(body.email)
    if not EMAIL_PATTERN.match(email):
        raise HTTPException(status_code=400, detail="Enter a valid email.")

    supabase = get_supabase()
    payload = {
        "email": email,
        "status": "pending",
        "source": body.source or "landing_page",
    }
    result = supabase.from_("access_requests").upsert(payload, on_conflict="email").execute()

    row = result.data[0] if result.data else payload
    return AccessRequestResponse(
        email=row["email"],
        status=row.get("status", "pending"),
    )
