import logging
from fastapi import Header, HTTPException
from app.gyms import get_supabase

logger = logging.getLogger(__name__)
# trying to cause merge coinflict


async def get_current_user(authorization: str = Header(...)) -> str:
    """Validate Bearer JWT and return the authenticated user_id."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")
    token = authorization[len("Bearer "):]
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
