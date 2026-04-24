from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Optional


CLASSIFIER_VERSION = "session-insight-v1"
VALID_SESSION_MIN_CLIMBS = 3
BASELINE_LOOKBACK_DAYS = 90
BASELINE_MIN_SESSIONS = 5
BASELINE_TARGET_SESSIONS = 10
PERFORMANCE_WORKING_GRADE_THRESHOLD = 0.65
PERFORMANCE_NEW_MAX_BONUS_THRESHOLD = 0.5
PERFORMANCE_NEW_MAX_BONUS = 0.25
VOLUME_RATIO_THRESHOLD = 0.2
PROJECTING_ATTEMPTS_PER_SEND_THRESHOLD = 0.55
EFFICIENCY_COMPLETION_RATE_THRESHOLD = 0.15
EXPLORATION_STYLE_DELTA_THRESHOLD = 3
EXPLORATION_STYLE_FLOOR = 5


def _parse_datetime(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        normalized = value.replace("Z", "+00:00")
        parsed = datetime.fromisoformat(normalized)
        return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)
    except ValueError:
        return None


def _safe_divide(numerator: float, denominator: float) -> float:
    return 0 if denominator == 0 else numerator / denominator


def _average(values: list[float]) -> Optional[float]:
    return None if not values else sum(values) / len(values)


def _working_grade(sent_grades: list[float]) -> Optional[float]:
    if not sent_grades:
        return None
    top_grades = sorted(sent_grades, reverse=True)[: max(1, int(len(sent_grades) * 0.4 + 0.999999))]
    top_grades = sorted(top_grades)
    midpoint = len(top_grades) // 2
    if len(top_grades) % 2 == 1:
        return top_grades[midpoint]
    return (top_grades[midpoint - 1] + top_grades[midpoint]) / 2


def _format_decimal(value: float, suffix: str) -> str:
    sign = "+" if value >= 0 else ""
    return f"{sign}{value:.1f} {suffix}"


def _format_percent(value: float, suffix: str) -> str:
    sign = "+" if value >= 0 else ""
    return f"{sign}{round(value * 100)}% {suffix}"


def _format_integer(value: float, suffix: str) -> str:
    sign = "+" if value >= 0 else ""
    return f"{sign}{round(value)} {suffix}"


def compute_session_metric_snapshot(session: dict, climbs: list[dict]) -> dict:
    total_climbs = len(climbs)
    sent_climbs = [climb for climb in climbs if climb.get("send_type") in ("flash", "send")]
    sent_grades = [
        climb.get("gym_grade_value")
        for climb in sent_climbs
        if isinstance(climb.get("gym_grade_value"), (int, float))
    ]
    tags = set()
    for climb in climbs:
        tags.update(climb.get("tags") or [])

    return {
        "session_id": session["id"],
        "start_at": session.get("started_at") or session.get("created_at") or "",
        "total_climbs": total_climbs,
        "working_grade": _working_grade(sent_grades),
        "highest_grade": max(sent_grades) if sent_grades else None,
        "attempts_per_send": _safe_divide(total_climbs, len(sent_climbs)),
        "completion_rate": _safe_divide(len(sent_climbs), total_climbs),
        "distinct_style_count": len(tags),
    }


def _is_valid_session(metrics: dict) -> bool:
    return metrics["total_climbs"] >= VALID_SESSION_MIN_CLIMBS


def _baseline_metrics(prior_sessions: list[dict]) -> Optional[dict]:
    if len(prior_sessions) < BASELINE_MIN_SESSIONS:
        return None

    working_grades = [
        session["working_grade"]
        for session in prior_sessions
        if isinstance(session.get("working_grade"), (int, float))
    ]
    highest_grades = [
        session["highest_grade"]
        for session in prior_sessions
        if isinstance(session.get("highest_grade"), (int, float))
    ]

    return {
        "average_total_climbs": _average([session["total_climbs"] for session in prior_sessions]) or 0,
        "average_working_grade": _average(working_grades),
        "highest_grade": max(highest_grades) if highest_grades else None,
        "average_attempts_per_send": _average([session["attempts_per_send"] for session in prior_sessions]) or 0,
        "average_completion_rate": _average([session["completion_rate"] for session in prior_sessions]) or 0,
        "average_distinct_style_count": _average([session["distinct_style_count"] for session in prior_sessions]) or 0,
    }


def classify_session_insight(session: dict, prior_sessions: list[dict]) -> dict:
    baseline = _baseline_metrics(prior_sessions)
    if not baseline or not _is_valid_session(session):
        return {
            "label": "Building baseline",
            "reason": "More sessions needed",
            "classifier_version": CLASSIFIER_VERSION,
        }

    candidates: list[dict] = []
    working_grade = session.get("working_grade")
    baseline_working_grade = baseline.get("average_working_grade")
    if isinstance(working_grade, (int, float)) and isinstance(baseline_working_grade, (int, float)):
        working_grade_delta = working_grade - baseline_working_grade
        highest_grade = session.get("highest_grade")
        baseline_highest_grade = baseline.get("highest_grade")
        new_max_bonus = (
            PERFORMANCE_NEW_MAX_BONUS
            if isinstance(highest_grade, (int, float))
            and isinstance(baseline_highest_grade, (int, float))
            and highest_grade - baseline_highest_grade >= PERFORMANCE_NEW_MAX_BONUS_THRESHOLD
            else 0
        )
        score = working_grade_delta + new_max_bonus
        if score >= PERFORMANCE_WORKING_GRADE_THRESHOLD:
            candidates.append({
                "label": "Performance session",
                "reason": _format_decimal(working_grade_delta, "V working grade"),
                "score": score / PERFORMANCE_WORKING_GRADE_THRESHOLD,
            })

    average_total = baseline["average_total_climbs"]
    if average_total > 0:
        climb_ratio_delta = session["total_climbs"] / average_total - 1
        if climb_ratio_delta >= VOLUME_RATIO_THRESHOLD:
            candidates.append({
                "label": "Volume session",
                "reason": _format_percent(climb_ratio_delta, "climbs"),
                "score": climb_ratio_delta / VOLUME_RATIO_THRESHOLD,
            })

    attempts_delta = session["attempts_per_send"] - baseline["average_attempts_per_send"]
    if attempts_delta >= PROJECTING_ATTEMPTS_PER_SEND_THRESHOLD:
        candidates.append({
            "label": "Projecting session",
            "reason": _format_decimal(attempts_delta, "attempts/send"),
            "score": attempts_delta / PROJECTING_ATTEMPTS_PER_SEND_THRESHOLD,
        })

    completion_delta = session["completion_rate"] - baseline["average_completion_rate"]
    if completion_delta >= EFFICIENCY_COMPLETION_RATE_THRESHOLD:
        candidates.append({
            "label": "Efficiency session",
            "reason": _format_percent(completion_delta, "completion rate"),
            "score": completion_delta / EFFICIENCY_COMPLETION_RATE_THRESHOLD,
        })

    style_delta = session["distinct_style_count"] - baseline["average_distinct_style_count"]
    if session["distinct_style_count"] >= EXPLORATION_STYLE_FLOOR and style_delta >= EXPLORATION_STYLE_DELTA_THRESHOLD:
        candidates.append({
            "label": "Exploration session",
            "reason": _format_integer(style_delta, "styles"),
            "score": style_delta / EXPLORATION_STYLE_DELTA_THRESHOLD,
        })

    if candidates:
        selected = max(candidates, key=lambda candidate: candidate["score"])
        return {
            "label": selected["label"],
            "reason": selected["reason"],
            "classifier_version": CLASSIFIER_VERSION,
        }

    reason = "Near baseline"
    if average_total > 0 and abs(session["total_climbs"] / average_total - 1) >= 0.1:
        reason = _format_percent(session["total_climbs"] / average_total - 1, "climbs")
    return {
        "label": "Consistent session",
        "reason": reason,
        "classifier_version": CLASSIFIER_VERSION,
    }


def get_prior_session_metric_snapshots(supabase, user_id: str, session_start_at: str) -> list[dict]:
    session_start = _parse_datetime(session_start_at)
    if not session_start:
        return []

    lookback_start = (session_start - timedelta(days=BASELINE_LOOKBACK_DAYS)).isoformat()
    sessions_result = (
        supabase.from_("sessions")
        .select("id, started_at, created_at, total_climbs")
        .eq("user_id", user_id)
        .lt("started_at", session_start.isoformat())
        .gte("started_at", lookback_start)
        .gte("total_climbs", VALID_SESSION_MIN_CLIMBS)
        .order("started_at", desc=True)
        .limit(BASELINE_TARGET_SESSIONS)
        .execute()
    )
    prior_sessions = sessions_result.data or []
    if not prior_sessions:
        return []

    session_ids = [session["id"] for session in prior_sessions]
    climbs_result = (
        supabase.from_("climbs")
        .select("session_id, send_type, gym_grade_value, tags")
        .in_("session_id", session_ids)
        .execute()
    )
    climbs_by_session_id: dict[str, list[dict]] = {}
    for climb in climbs_result.data or []:
        climbs_by_session_id.setdefault(climb["session_id"], []).append(climb)

    return [
        compute_session_metric_snapshot(session, climbs_by_session_id.get(session["id"], []))
        for session in prior_sessions
        if len(climbs_by_session_id.get(session["id"], [])) >= VALID_SESSION_MIN_CLIMBS
    ]
