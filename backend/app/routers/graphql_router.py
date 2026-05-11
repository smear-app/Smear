from __future__ import annotations

from collections import Counter
from datetime import datetime, timedelta, timezone
from typing import Optional

import strawberry
from fastapi import Depends
from strawberry.fastapi import GraphQLRouter

from app.deps import get_current_user
from app.gyms import get_supabase
from app.session_insights import _working_grade


def _safe_divide(numerator: float, denominator: float) -> float:
    return 0.0 if denominator == 0 else numerator / denominator


def _parse_dt(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


@strawberry.type
class StyleCount:
    tag: str
    count: int


@strawberry.type
class StyleGap:
    tag: str
    deficit: float


@strawberry.type
class GradePoint:
    grade: float
    sends: int


@strawberry.type
class ClimberProfile:
    working_grade: Optional[float]
    send_rate: float
    flash_rate: float
    archetype: str
    style_breakdown: list[StyleCount]
    archetype_gaps: list[StyleGap]
    grade_pyramid: list[GradePoint]
    sessions_per_week: float
    avg_climbs_per_session: float
    trend_direction: str
    plateau_weeks: int
    days_since_last_session: int
    gym_name: str


@strawberry.type
class RecentSession:
    id: str
    started_at: str
    gym_name: str
    total_climbs: int
    duration_minutes: Optional[int]
    working_grade: Optional[float]
    insight_label: Optional[str]


@strawberry.type
class Query:
    @strawberry.field
    def climber_profile(self, user_id: str, info: strawberry.types.Info) -> ClimberProfile:
        supabase = get_supabase()
        now = datetime.now(timezone.utc)
        cutoff_90 = (now - timedelta(days=90)).isoformat()

        # Query 1: sessions
        sessions_result = (
            supabase.from_("sessions")
            .select("sends, flashes, total_climbs, top_tags, started_at, gym_name")
            .eq("user_id", user_id)
            .eq("is_published", True)
            .gte("started_at", cutoff_90)
            .execute()
        )
        sessions = sessions_result.data or []

        total_sends = sum(s.get("sends") or 0 for s in sessions)
        total_flashes = sum(s.get("flashes") or 0 for s in sessions)
        total_climbs_all = sum(s.get("total_climbs") or 0 for s in sessions)
        session_count = len(sessions)

        send_rate = _safe_divide(total_sends, total_climbs_all)
        flash_rate = _safe_divide(total_flashes, total_sends)
        avg_climbs_per_session = _safe_divide(total_climbs_all, session_count)
        sessions_per_week = session_count / 13.0

        tag_counter: Counter = Counter()
        for s in sessions:
            for tag in s.get("top_tags") or []:
                tag_counter[tag] += 1

        style_breakdown = [
            StyleCount(tag=tag, count=count)
            for tag, count in tag_counter.most_common()
        ]
        archetype = style_breakdown[0].tag if style_breakdown else ""

        dominant_count = style_breakdown[0].count if style_breakdown else 0
        archetype_gaps = [
            StyleGap(tag=sc.tag, deficit=round(1.0 - sc.count / dominant_count, 3))
            for sc in style_breakdown
            if dominant_count > 0 and sc.count < 0.3 * dominant_count
        ]

        days_since_last_session = 0
        latest_session = None
        if sessions:
            latest_session = max(sessions, key=lambda s: s.get("started_at") or "")
            latest_dt = _parse_dt(latest_session.get("started_at"))
            if latest_dt:
                days_since_last_session = (now - latest_dt).days

        # Query 2: climbs
        cutoff_30 = (now - timedelta(days=30)).isoformat()

        climbs_result = (
            supabase.from_("climbs")
            .select("gym_grade_value, created_at")
            .eq("user_id", user_id)
            .in_("send_type", ["send", "flash"])
            .gte("created_at", cutoff_90)
            .execute()
        )
        climbs = climbs_result.data or []

        all_grades = [
            c["gym_grade_value"]
            for c in climbs
            if isinstance(c.get("gym_grade_value"), (int, float))
        ]
        working_grade = _working_grade(all_grades)

        grade_counter: Counter = Counter()
        for g in all_grades:
            grade_counter[g] += 1
        grade_pyramid = [
            GradePoint(grade=float(g), sends=cnt)
            for g, cnt in sorted(grade_counter.items())
        ]

        recent_grades = [
            c["gym_grade_value"]
            for c in climbs
            if isinstance(c.get("gym_grade_value"), (int, float))
            and (c.get("created_at") or "") >= cutoff_30
        ]
        prior_grades = [
            c["gym_grade_value"]
            for c in climbs
            if isinstance(c.get("gym_grade_value"), (int, float))
            and cutoff_90 <= (c.get("created_at") or "") < cutoff_30
        ]
        wg_recent = _working_grade(recent_grades)
        wg_prior = _working_grade(prior_grades)

        if wg_recent is None or wg_prior is None:
            trend_direction = "flat"
        elif wg_recent > wg_prior + 0.25:
            trend_direction = "up"
        elif wg_recent < wg_prior - 0.25:
            trend_direction = "down"
        else:
            trend_direction = "flat"

        # plateau_weeks: consecutive trailing weeks within ±0.5 of working_grade
        plateau_weeks = 0
        if working_grade is not None and climbs:
            by_week: dict[tuple, list[float]] = {}
            for c in climbs:
                dt = _parse_dt(c.get("created_at"))
                grade = c.get("gym_grade_value")
                if dt and isinstance(grade, (int, float)):
                    week_key = dt.isocalendar()[:2]
                    by_week.setdefault(week_key, []).append(grade)

            sorted_weeks = sorted(by_week.keys(), reverse=True)
            for week_key in sorted_weeks:
                wg = _working_grade(by_week[week_key])
                if wg is not None and abs(wg - working_grade) <= 0.5:
                    plateau_weeks += 1
                else:
                    break

        gym_name = (latest_session or {}).get("gym_name") or ""

        return ClimberProfile(
            working_grade=working_grade,
            send_rate=send_rate,
            flash_rate=flash_rate,
            archetype=archetype,
            style_breakdown=style_breakdown,
            archetype_gaps=archetype_gaps,
            grade_pyramid=grade_pyramid,
            sessions_per_week=sessions_per_week,
            avg_climbs_per_session=avg_climbs_per_session,
            trend_direction=trend_direction,
            plateau_weeks=plateau_weeks,
            days_since_last_session=days_since_last_session,
            gym_name=gym_name,
        )

    @strawberry.field
    def recent_sessions(
        self, user_id: str, info: strawberry.types.Info, limit: int = 10
    ) -> list[RecentSession]:
        supabase = get_supabase()
        result = (
            supabase.from_("sessions")
            .select(
                "id, started_at, ended_at, gym_name, total_climbs, insight_label"
            )
            .eq("user_id", user_id)
            .eq("is_published", True)
            .order("started_at", desc=True)
            .limit(limit)
            .execute()
        )
        rows = result.data or []

        out = []
        for row in rows:
            start = _parse_dt(row.get("started_at"))
            end = _parse_dt(row.get("ended_at"))
            duration_minutes: Optional[int] = None
            if start and end:
                duration_minutes = int((end - start).total_seconds() // 60)

            out.append(
                RecentSession(
                    id=row["id"],
                    started_at=row.get("started_at") or "",
                    gym_name=row.get("gym_name") or "",
                    total_climbs=row.get("total_climbs") or 0,
                    duration_minutes=duration_minutes,
                    working_grade=None,
                    insight_label=row.get("insight_label"),
                )
            )
        return out


async def get_context(user_id: str = Depends(get_current_user)) -> dict:
    return {"user_id": user_id}


schema = strawberry.Schema(query=Query)
graphql_router = GraphQLRouter(schema, context_getter=get_context)
