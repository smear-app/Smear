import { useMemo, useState } from "react"
import { useLocation } from "react-router-dom"
import BottomNav from "../../../components/BottomNav"
import DetailPageHeader from "../../../components/DetailPageHeader"
import type { Climb } from "../../../lib/climbs"
import SessionClimbActions from "../components/sessions/SessionClimbActions"
import SessionsTrendChart from "../components/sessions/SessionsTrendChart"
import SessionTrendMetrics from "../components/sessions/SessionTrendMetrics"
import SessionSelector from "../components/sessions/SessionSelector"
import SessionSummary from "../components/sessions/SessionSummary"
import SessionDetailBreakdown from "../components/sessions/SessionDetailBreakdown"
import SessionInsight from "../components/sessions/SessionInsight"
import SessionIdentityLine from "../components/sessions/SessionIdentityLine"
import type { RawStatsClimb } from "../domain/base"
import { calculateSessionMetrics } from "../domain/calculators"
import { buildSessionClimbsByStatsSessionId } from "../domain/sessions/selectSessionClimbs"
import { selectSessionsViewModel } from "../domain/sessions/selectSessionsViewModel"
import { useSharedStatsBase } from "../hooks/useSharedStatsBase"
import type { SessionDetail } from "../domain/sessions/types"

type SessionsStatsLocationState = {
  selectedSessionIndex?: number
  climbsExpanded?: boolean
}

const EMPTY_SELECTED_SESSION: SessionDetail = {
  id: "empty-session",
  selectorLabel: "-",
  selectorMeta: "No sessions yet",
  identity: { label: "-", reason: "-", displayMode: "insight" },
  summary: [
    { label: "Total Climbs", value: "-" },
    { label: "Duration", value: "-" },
    { label: "Max Grade", value: "None" },
    { label: "Working Grade", value: "None" },
  ],
  outcomes: [],
  outcomeTotalCount: 0,
  gradeDistribution: [],
  insight: "",
}

function toLogbookClimb(climb: RawStatsClimb): Climb {
  return {
    id: climb.id,
    user_id: climb.user_id,
    gym_id: climb.gym_id,
    gym_name: climb.gym_name,
    gym_grade: climb.gym_grade,
    gym_grade_value: climb.gym_grade_value,
    personal_grade: climb.personal_grade,
    personal_grade_value: climb.personal_grade_value,
    send_type: climb.send_type,
    tags: climb.tags,
    photo_url: climb.photo_url,
    climbColor: climb.hold_color,
    notes: climb.notes,
    canonical_climb_id: climb.canonical_climb_id,
    canonical_tags: climb.canonical_tags,
    session_id: climb.session_id,
    session_started_at: climb.session_started_at,
    created_at: climb.created_at,
  }
}

type SessionsStatsPageProps = {
  onDeleteClimb: (climbId: string) => Promise<void> | void
  onEditClimb: (climb: Climb) => void
  refreshKey?: number
}

export default function SessionsStatsPage({
  onDeleteClimb,
  onEditClimb,
}: SessionsStatsPageProps) {
  const location = useLocation()
  const locationState = (location.state ?? {}) as SessionsStatsLocationState
  const {
    statsBase,
    enrichedClimbs: statsClimbs,
    status: statsBaseStatus,
    error: statsBaseError,
  } = useSharedStatsBase()
  const [selectedSessionIndex, setSelectedSessionIndex] = useState(() => {
    const restoredIndex = locationState.selectedSessionIndex

    return typeof restoredIndex === "number"
      ? Math.max(restoredIndex, 0)
      : 0
  })
  const [climbsExpanded, setClimbsExpanded] = useState(() => Boolean(locationState.climbsExpanded))
  const sessionsView = useMemo(
    () => selectSessionsViewModel(calculateSessionMetrics(statsClimbs)),
    [statsClimbs],
  )
  const sessionClimbsById = useMemo(
    () => buildSessionClimbsByStatsSessionId(statsBase ? statsBase.climbs.map(toLogbookClimb) : []),
    [statsBase],
  )
  const realSessionCount = sessionsView.sessions.length
  const selectedRealSessionIndex = realSessionCount === 0
    ? 0
    : Math.min(selectedSessionIndex, realSessionCount - 1)
  const selectedSession = sessionsView.sessions[selectedRealSessionIndex] ?? EMPTY_SELECTED_SESSION
  const selectedSessionClimbs = sessionClimbsById.get(selectedSession.id) ?? []
  const sessionClimbsLoading = statsBaseStatus === "loading" && !statsBase
  const sessionClimbsError = statsBaseError?.message ?? null
  const detailReturnPath = `${location.pathname}${location.search}`
  const handleDeleteClimb = async (climbId: string) => {
    await onDeleteClimb(climbId)
  }

  return (
    <div className="app-safe-shell min-h-screen bg-stone-bg">
      <main className="app-safe-shell__main mx-auto flex min-h-screen max-w-[420px] flex-col px-5 pb-32 pt-6">
        <DetailPageHeader backTo="/stats" backLabel="Back to Stats" backAriaLabel="Back to Stats">
          <h1 className="text-xl font-bold text-stone-text">Sessions</h1>
        </DetailPageHeader>

        <div className="mt-5">
          <SessionsTrendChart points={sessionsView.trendPoints} />
        </div>

        <div className="mt-4">
          <SessionTrendMetrics metrics={sessionsView.trendMetrics} />
        </div>

        <div className="mt-6 flex items-center gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-muted">Session detail</span>
          <div className="h-px flex-1 bg-stone-border/80 dark:bg-white/[0.06]" />
        </div>

        <div className="mt-4">
          <SessionSelector
            session={selectedSession}
            currentIndex={selectedRealSessionIndex}
            total={realSessionCount}
            onPrevious={() =>
              setSelectedSessionIndex((currentIndex) => Math.min(currentIndex + 1, Math.max(realSessionCount - 1, 0)))
            }
            onNext={() =>
              setSelectedSessionIndex((currentIndex) => Math.max(currentIndex - 1, 0))
            }
            actions={
              <SessionClimbActions
                climbs={selectedSessionClimbs}
                isExpanded={climbsExpanded}
                isLoading={sessionClimbsLoading}
                error={sessionClimbsError}
                detailReturnPath={detailReturnPath}
                detailReturnState={{ selectedSessionIndex: selectedRealSessionIndex, climbsExpanded }}
                onToggleExpanded={() => setClimbsExpanded((current) => !current)}
                onDeleteClimb={handleDeleteClimb}
                onEditClimb={onEditClimb}
              />
            }
          />
        </div>

        <div className="mt-2 px-1">
          <SessionIdentityLine identity={selectedSession.identity} />
        </div>

        <div className="mt-2">
          <SessionSummary stats={selectedSession.summary} />
        </div>

        <div className="mt-4">
          <SessionDetailBreakdown
            outcomes={selectedSession.outcomes}
            outcomeTotalCount={selectedSession.outcomeTotalCount}
            gradeDistribution={selectedSession.gradeDistribution}
          />
        </div>

        <div className="mt-4">
          <SessionInsight insight={selectedSession.insight} />
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
