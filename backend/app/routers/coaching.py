from __future__ import annotations

import logging
import os
from datetime import datetime, timedelta, timezone
from typing import List, Optional

import anthropic
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.climber_profile import get_climber_profile
from app.deps import get_current_user
from app.gyms import get_supabase

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/coach", tags=["coach"])

if not os.environ.get("ANTHROPIC_API_KEY"):
    logger.warning("ANTHROPIC_API_KEY is not set — coaching endpoints will return 503")

_anthropic_client = anthropic.Anthropic()

SYSTEM_PROMPT = """You are a concise, data-driven climbing coach embedded in the Smear training app.

Rules:
- Every insight must reference at least one real number from the user's data.
- Be direct. No filler. No "Great job!" No generic advice.
- 2-3 sentences max for cards; for chat, answer fully but stay tight.
- Speak in second person ("you", "your").
- Grade references use V-scale (e.g. V5, V6). Grade values are numeric: VB=-1, V0=0, V1=1, up to V10+=11.
- If data is sparse, acknowledge it briefly and give a conservative recommendation.
- Use markdown sparingly: **bold** for grades and key numbers only. No headers. No bullet lists unless the user explicitly asks for a breakdown.
"""


def _fmt_grade(grade_value: Optional[float]) -> str:
    if grade_value is None:
        return "unknown"
    v = round(grade_value)
    return "VB" if v < 0 else f"V{v}"


def _check_cache(supabase, user_id: str, insight_type: str) -> Optional[dict]:
    result = (
        supabase.from_("coaching_insights")
        .select("insight_text, generated_at")
        .eq("user_id", user_id)
        .eq("insight_type", insight_type)
        .eq("is_valid", True)
        .limit(1)
        .execute()
    )
    return (result.data or [None])[0]


def _write_cache(supabase, user_id: str, insight_type: str, text: str) -> None:
    supabase.from_("coaching_insights").update({"is_valid": False}).eq(
        "user_id", user_id
    ).eq("insight_type", insight_type).execute()
    supabase.from_("coaching_insights").insert(
        {
            "user_id": user_id,
            "insight_type": insight_type,
            "insight_text": text,
            "is_valid": True,
        }
    ).execute()


def _call_haiku(user_content: str) -> str:
    if not _anthropic_client.api_key:
        raise HTTPException(status_code=503, detail="Coaching unavailable: ANTHROPIC_API_KEY not configured")
    response = _anthropic_client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=300,
        system=[
            {
                "type": "text",
                "text": SYSTEM_PROMPT,
                "cache_control": {"type": "ephemeral"},
            }
        ],
        messages=[{"role": "user", "content": user_content}],
    )
    return response.content[0].text


def _profile_summary(p: dict) -> str:
    gaps = ", ".join(g["tag"] for g in (p.get("archetype_gaps") or [])[:3]) or "none"
    return (
        f"Working grade: {_fmt_grade(p.get('working_grade'))} | "
        f"Trend: {p.get('trend_direction', 'flat')} | "
        f"Plateau: {p.get('plateau_weeks', 0)} weeks | "
        f"Days rest: {p.get('days_since_last_session', 0)} | "
        f"Sessions/week: {p.get('sessions_per_week', 0):.1f} | "
        f"Send rate: {p.get('send_rate', 0):.0%} | "
        f"Flash rate: {p.get('flash_rate', 0):.0%} | "
        f"Archetype: {p.get('archetype', 'unknown')} | "
        f"Style gaps: {gaps} | "
        f"Gym: {p.get('gym_name', 'your gym')}"
    )


@router.get("/pre-session")
def pre_session(user_id: str = Depends(get_current_user)):
    supabase = get_supabase()
    cached = _check_cache(supabase, user_id, "pre-session")
    if cached:
        return {"insight": cached["insight_text"], "generated_at": cached["generated_at"]}

    p = get_climber_profile(user_id)
    prompt = (
        f"Pre-session intent for a climber at {p.get('gym_name', 'their gym')}.\n"
        f"Stats: {_profile_summary(p)}\n"
        "Give a 2-3 sentence training intent: what grade to target, what style to focus on, "
        "and one reason why based on the data."
    )
    text = _call_haiku(prompt)
    _write_cache(supabase, user_id, "pre-session", text)
    return {"insight": text, "generated_at": datetime.now(timezone.utc).isoformat()}


@router.get("/post-session")
def post_session(user_id: str = Depends(get_current_user)):
    supabase = get_supabase()
    cached = _check_cache(supabase, user_id, "post-session")
    if cached:
        return {"insight": cached["insight_text"], "generated_at": cached["generated_at"]}

    session_result = (
        supabase.from_("sessions")
        .select("sends, flashes, total_climbs, hardest_grade, insight_label, started_at")
        .eq("user_id", user_id)
        .eq("is_published", True)
        .order("started_at", desc=True)
        .limit(1)
        .execute()
    )
    session = (session_result.data or [None])[0]
    if not session:
        raise HTTPException(status_code=404, detail="No completed session found")

    p = get_climber_profile(user_id)
    prompt = (
        f"Post-session reflection.\n"
        f"Session: {session.get('total_climbs', 0)} climbs, {session.get('sends', 0)} sends, "
        f"{session.get('flashes', 0)} flashes, hardest: {session.get('hardest_grade', 'unknown')}. "
        f"Session label: {session.get('insight_label', 'none')}.\n"
        f"Overall stats: {_profile_summary(p)}\n"
        "Give a 2-3 sentence reflection: what happened this session, one key takeaway, one number called out."
    )
    text = _call_haiku(prompt)
    _write_cache(supabase, user_id, "post-session", text)
    return {"insight": text, "generated_at": datetime.now(timezone.utc).isoformat()}


class CheckinBody(BaseModel):
    feeling: str  # "good" | "tired" | "sore"


@router.post("/checkin")
def checkin(body: CheckinBody, user_id: str = Depends(get_current_user)):
    if body.feeling not in ("good", "tired", "sore"):
        raise HTTPException(status_code=422, detail="feeling must be 'good', 'tired', or 'sore'")

    supabase = get_supabase()
    threshold = (datetime.now(timezone.utc) - timedelta(hours=3)).isoformat()
    active_result = (
        supabase.from_("sessions")
        .select("id, started_at")
        .eq("user_id", user_id)
        .eq("is_published", False)
        .gt("ended_at", threshold)
        .order("ended_at", desc=True)
        .limit(1)
        .execute()
    )
    active = (active_result.data or [None])[0]

    climbs_so_far = 0
    duration_str = ""
    if active:
        count_result = (
            supabase.from_("climbs")
            .select("id")
            .eq("session_id", active["id"])
            .execute()
        )
        climbs_so_far = len(count_result.data or [])
        if active.get("started_at"):
            try:
                start = datetime.fromisoformat(active["started_at"].replace("Z", "+00:00"))
                mins = int((datetime.now(timezone.utc) - start).total_seconds() // 60)
                duration_str = f"{mins} min in. "
            except Exception:
                pass

    p = get_climber_profile(user_id)
    gaps = ", ".join(g["tag"] for g in (p.get("archetype_gaps") or [])[:2]) or "none"
    prompt = (
        f"Mid-session check-in. {duration_str}{climbs_so_far} climbs logged. "
        f"Feeling: {body.feeling}. Working grade: {_fmt_grade(p.get('working_grade'))}. "
        f"Archetype: {p.get('archetype', 'unknown')}. Style gaps: {gaps}.\n"
        "Give a 1-2 sentence nudge for the rest of the session based on how they're feeling."
    )
    text = _call_haiku(prompt)
    return {"insight": text, "generated_at": datetime.now(timezone.utc).isoformat()}


@router.get("/training-focus")
def training_focus(user_id: str = Depends(get_current_user)):
    supabase = get_supabase()
    cached = _check_cache(supabase, user_id, "training-focus")
    if cached:
        return {"insight": cached["insight_text"], "generated_at": cached["generated_at"]}

    p = get_climber_profile(user_id)
    prompt = (
        f"2-4 week training plan.\n"
        f"Stats: {_profile_summary(p)}\n"
        "Write a focused 2-4 week training plan: one primary goal, one style to prioritize, "
        "and a weekly session structure. Reference specific numbers from the data."
    )
    text = _call_haiku(prompt)
    _write_cache(supabase, user_id, "training-focus", text)
    return {"insight": text, "generated_at": datetime.now(timezone.utc).isoformat()}


class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatBody(BaseModel):
    messages: List[ChatMessage]


@router.post("/chat")
def chat(body: ChatBody, user_id: str = Depends(get_current_user)):
    if not _anthropic_client.api_key:
        raise HTTPException(status_code=503, detail="Coaching unavailable: ANTHROPIC_API_KEY not configured")

    if not body.messages or body.messages[-1].role != "user":
        raise HTTPException(status_code=422, detail="Last message must be from user")

    p = get_climber_profile(user_id)
    system = [
        {"type": "text", "text": SYSTEM_PROMPT, "cache_control": {"type": "ephemeral"}},
        {"type": "text", "text": f"Climber context: {_profile_summary(p)}"},
    ]
    messages = [{"role": m.role, "content": m.content} for m in body.messages]

    def stream():
        with _anthropic_client.messages.stream(
            model="claude-haiku-4-5-20251001",
            max_tokens=600,
            system=system,
            messages=messages,
        ) as s:
            for text in s.text_stream:
                yield text

    return StreamingResponse(stream(), media_type="text/plain")
