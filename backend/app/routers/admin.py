import logging
from fastapi import APIRouter, Depends, HTTPException
from app.deps import get_current_user
from app.gyms import get_supabase
from app.models import DuplicateFlagObject, CanonicalSummary
from app.routers.canonical_climbs import recompute_canonical_confidence

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin", tags=["admin"])


def _require_admin(user_id: str, supabase) -> None:
    result = (
        supabase.from_("profiles")
        .select("is_admin")
        .eq("id", user_id)
        .single()
        .execute()
    )
    if not result.data or not result.data.get("is_admin"):
        raise HTTPException(status_code=403, detail="Forbidden")


@router.get("/duplicate-flags", response_model=list[DuplicateFlagObject])
def get_duplicate_flags(user_id: str = Depends(get_current_user)):
    supabase = get_supabase()
    _require_admin(user_id, supabase)

    flags_result = (
        supabase.from_("duplicate_flags")
        .select("id, canonical_id_a, canonical_id_b, similarity_score, status, created_at")
        .eq("status", "pending")
        .order("similarity_score", desc=True)
        .execute()
    )
    flag_rows = flags_result.data or []
    if not flag_rows:
        return []

    canonical_ids = list({
        cid
        for row in flag_rows
        for cid in (row["canonical_id_a"], row["canonical_id_b"])
    })
    canonicals_result = (
        supabase.from_("canonical_climbs")
        .select("id, gym_id, gym_grade_value, hold_color, canonical_tags, photo_url, log_count")
        .in_("id", canonical_ids)
        .execute()
    )
    by_id = {c["id"]: c for c in (canonicals_result.data or [])}

    output: list[DuplicateFlagObject] = []
    for row in flag_rows:
        ca = by_id.get(row["canonical_id_a"])
        cb = by_id.get(row["canonical_id_b"])
        if not ca or not cb:
            continue
        output.append(DuplicateFlagObject(
            id=row["id"],
            similarity_score=row["similarity_score"],
            status=row["status"],
            created_at=row["created_at"],
            canonical_a=CanonicalSummary(
                id=ca["id"],
                gym_id=ca["gym_id"],
                gym_grade_value=ca["gym_grade_value"],
                hold_color=ca.get("hold_color"),
                canonical_tags=ca.get("canonical_tags") or [],
                photo_url=ca.get("photo_url"),
                log_count=ca.get("log_count") or 0,
            ),
            canonical_b=CanonicalSummary(
                id=cb["id"],
                gym_id=cb["gym_id"],
                gym_grade_value=cb["gym_grade_value"],
                hold_color=cb.get("hold_color"),
                canonical_tags=cb.get("canonical_tags") or [],
                photo_url=cb.get("photo_url"),
                log_count=cb.get("log_count") or 0,
            ),
        ))

    return output


@router.post("/recompute-confidence", status_code=200)
def recompute_all_confidence(user_id: str = Depends(get_current_user)):
    """Recompute confidence_score and status for all active canonical climbs.

    Run manually to apply recency decay. Hook up to a daily Render cron job
    once the score distribution has been validated in prod.
    """
    supabase = get_supabase()
    _require_admin(user_id, supabase)

    result = (
        supabase.from_("canonical_climbs")
        .select("id")
        .in_("status", ["pending", "verified"])
        .eq("is_active", True)
        .execute()
    )
    ids = [row["id"] for row in (result.data or [])]
    for canonical_id in ids:
        recompute_canonical_confidence(supabase, canonical_id)

    return {"recomputed": len(ids)}
