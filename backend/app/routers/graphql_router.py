from __future__ import annotations

from datetime import datetime
from typing import Optional

import strawberry
from fastapi import Depends
from strawberry.fastapi import GraphQLRouter

from app.climber_profile import get_climber_profile, _parse_dt
from app.deps import get_current_user
from app.gyms import get_supabase


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
        p = get_climber_profile(user_id)
        return ClimberProfile(
            working_grade=p["working_grade"],
            send_rate=p["send_rate"],
            flash_rate=p["flash_rate"],
            archetype=p["archetype"],
            style_breakdown=[StyleCount(tag=s["tag"], count=s["count"]) for s in p["style_breakdown"]],
            archetype_gaps=[StyleGap(tag=g["tag"], deficit=g["deficit"]) for g in p["archetype_gaps"]],
            grade_pyramid=[GradePoint(grade=g["grade"], sends=g["sends"]) for g in p["grade_pyramid"]],
            sessions_per_week=p["sessions_per_week"],
            avg_climbs_per_session=p["avg_climbs_per_session"],
            trend_direction=p["trend_direction"],
            plateau_weeks=p["plateau_weeks"],
            days_since_last_session=p["days_since_last_session"],
            gym_name=p["gym_name"],
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
