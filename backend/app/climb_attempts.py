from __future__ import annotations

from dataclasses import dataclass
from typing import Optional


FLASH_SEND_TYPE = "flash"
SEND_SEND_TYPE = "send"
ATTEMPT_SEND_TYPE = "attempt"
COMPLETED_SEND_TYPES = {FLASH_SEND_TYPE, SEND_SEND_TYPE}

FLASH_ATTEMPTS = 1
MIN_LOG_ATTEMPTS = 1
MIN_WORKED_ATTEMPTS = 2
MAX_LOG_ATTEMPTS = 99


@dataclass(frozen=True)
class CanonicalAttemptProgress:
    pre_send_attempt_count: int
    first_send_attempt_count: Optional[int]
    first_sent_at: Optional[str]


def normalize_send_type(send_type: str) -> str:
    return send_type.strip().lower()


def resolve_attempts_for_send_type(send_type: str, attempts: Optional[int]) -> int:
    normalized_send_type = normalize_send_type(send_type)

    if normalized_send_type == FLASH_SEND_TYPE:
        return FLASH_ATTEMPTS

    if normalized_send_type not in {SEND_SEND_TYPE, ATTEMPT_SEND_TYPE}:
        raise ValueError("Unsupported send type")

    if attempts is None:
        raise ValueError("Attempts are required")
    if attempts < MIN_WORKED_ATTEMPTS or attempts > MAX_LOG_ATTEMPTS:
        raise ValueError(f"Attempts must be between {MIN_WORKED_ATTEMPTS} and {MAX_LOG_ATTEMPTS}")

    return attempts


def derive_stored_attempts(send_type: str, attempts: Optional[int]) -> Optional[int]:
    normalized_send_type = normalize_send_type(send_type)

    if normalized_send_type == FLASH_SEND_TYPE:
        return FLASH_ATTEMPTS

    if attempts is None:
        return None

    if attempts < MIN_LOG_ATTEMPTS:
        return None

    return attempts


def compute_canonical_attempt_progress(climbs: list[dict]) -> Optional[CanonicalAttemptProgress]:
    if not climbs:
        return None

    ordered_climbs = sorted(
        climbs,
        key=lambda climb: (
            climb.get("created_at") or "",
            climb.get("id") or "",
        ),
    )

    pre_send_attempt_count = 0
    first_send_attempt_count: Optional[int] = None
    first_sent_at: Optional[str] = None

    for climb in ordered_climbs:
        send_type = normalize_send_type(climb.get("send_type") or ATTEMPT_SEND_TYPE)
        attempts = derive_stored_attempts(send_type, climb.get("attempts"))

        if first_sent_at is not None:
            continue

        if send_type == ATTEMPT_SEND_TYPE:
            if attempts is not None:
                pre_send_attempt_count += attempts
            continue

        if send_type in COMPLETED_SEND_TYPES:
            first_sent_at = climb.get("created_at")
            if attempts is not None:
                first_send_attempt_count = pre_send_attempt_count + attempts

    return CanonicalAttemptProgress(
        pre_send_attempt_count=pre_send_attempt_count,
        first_send_attempt_count=first_send_attempt_count,
        first_sent_at=first_sent_at,
    )


def recompute_user_canonical_attempt_progress(supabase, user_id: str, canonical_climb_id: Optional[str]) -> None:
    if not canonical_climb_id:
        return

    climbs_result = (
        supabase.from_("climbs")
        .select("id, send_type, attempts, created_at")
        .eq("user_id", user_id)
        .eq("canonical_climb_id", canonical_climb_id)
        .order("created_at", desc=False)
        .execute()
    )
    progress = compute_canonical_attempt_progress(climbs_result.data or [])

    progress_table = supabase.from_("user_canonical_climb_progress")

    if progress is None:
        progress_table.delete().eq("user_id", user_id).eq("canonical_climb_id", canonical_climb_id).execute()
        return

    progress_table.upsert(
        {
            "user_id": user_id,
            "canonical_climb_id": canonical_climb_id,
            "pre_send_attempt_count": progress.pre_send_attempt_count,
            "first_send_attempt_count": progress.first_send_attempt_count,
            "first_sent_at": progress.first_sent_at,
        },
        on_conflict="user_id,canonical_climb_id",
    ).execute()
