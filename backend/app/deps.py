import logging
import os
from fastapi import Header, HTTPException
from app.gyms import get_supabase

logger = logging.getLogger(__name__)

_SERVICE_KEY = os.environ.get("SALESFORCE_SERVICE_KEY", "")
SERVICE_USER_ID = "salesforce-agent"


async def get_current_user(
    authorization: str = Header(None),
) -> str:
    """Validate Bearer JWT and return the authenticated user_id."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")
    token = authorization[len("Bearer "):]

    # Service-to-service path: Salesforce Agentforce sends service key as Bearer token
    if _SERVICE_KEY and token == _SERVICE_KEY:
        return SERVICE_USER_ID

    supabase = get_supabase()
    try:
        result = supabase.auth.get_user(token)
        if result.user is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return result.user.id
    except HTTPException:
        raise
    except Exception as exc:
        logger.warning("Token validation error: %s", exc)
        raise HTTPException(status_code=401, detail="Invalid token")
