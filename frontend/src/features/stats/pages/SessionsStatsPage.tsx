import { useEffect, useMemo, useState } from "react"
import { useLocation } from "react-router-dom"
import BottomNav from "../../../components/BottomNav"
import DetailPageHeader from "../../../components/DetailPageHeader"
import { useAuth } from "../../../context/AuthContext"
import type { Climb } from "../../../lib/climbs"
import { buildImplicitSessions as buildLogbookSessions, type LogbookSession } from "../../../lib/logbook"
import SessionClimbActions from "../components/sessions/SessionClimbActions"
import SessionsTrendChart from "../components/sessions/SessionsTrendChart"
import SessionTrendMetrics from "../components/sessions/SessionTrendMetrics"
import SessionSelector from "../components/sessions/SessionSelector"
import SessionSummary from "../components/sessions/SessionSummary"
import SessionDetailBreakdown from "../components/sessions/SessionDetailBreakdown"
import SessionInsight from "../components/sessions/SessionInsight"
import SessionIdentityLine from "../components/sessions/SessionIdentityLine"
import { fetchStatsBase, prepareEnrichedClimbs, type RawStatsClimb } from "../domain/base"
import { calculateSessionMetrics } from "../domain/calculators"
import type { EnrichedClimb } from "../domain/primitives"
import { sessionsMockData } from "../domain/sessions/mockSessionsData"
import { selectSessionsViewModel } from "../domain/sessions/selectSessionsViewModel"
import type { SessionDetail } from "../domain/sessions/types"

type SessionsStatsLocationState = {
  selectedSessionIndex?: number
  climbsExpanded?: boolean
}

const EMPTY_SELECTED_SESSION: SessionDetail = {
  id: "empty-session",
  selectorLabel: "-",
  selectorMeta: "No sessions yet",
  identity: { label: "-", reason: "-" },
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
  refreshKey = 0,
}: SessionsStatsPageProps) {
  const location = useLocation()
  const locationState = (location.state ?? {}) as SessionsStatsLocationState
  const { user } = useAuth()
  const [statsClimbs, setStatsClimbs] = useState<EnrichedClimb[]>([])
  const [logbookSessions, setLogbookSessions] = useState<LogbookSession[]>([])
  const [sessionClimbsError, setSessionClimbsError] = useState<string | null>(null)
  const [sessionClimbsLoading, setSessionClimbsLoading] = useState(false)
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
  const realSessionCount = sessionsView.sessions.length
  const selectedRealSessionIndex = realSessionCount === 0
    ? 0
    : Math.min(selectedSessionIndex, realSessionCount - 1)
  const selectedSession = sessionsView.sessions[selectedRealSessionIndex] ?? EMPTY_SELECTED_SESSION
  const selectedMockSession = sessionsMockData.sessions[selectedRealSessionIndex] ?? sessionsMockData.sessions[0]
  const logbookSessionsById = useMemo(
    () => new Map(logbookSessions.map((session) => [session.id, session])),
    [logbookSessions],
  )
  const selectedLogbookSession = logbookSessionsById.get(selectedSession.id) ?? null
  const selectedSessionClimbs = selectedLogbookSession?.climbs ?? []
  const detailReturnPath = `${location.pathname}${location.search}`
  const handleDeleteClimb = async (climbId: string) => {
    await onDeleteClimb(climbId)
    setStatsClimbs((currentClimbs) => currentClimbs.filter((climb) => climb.id !== climbId))
    setLogbookSessions((currentSessions) =>
      currentSessions
        .map((session) => ({
          ...session,
          climbs: session.climbs.filter((climb) => climb.id !== climbId),
        }))
        .filter((session) => session.climbs.length > 0),
    )
  }

  useEffect(() => {
    let cancelled = false

    if (!user?.id) {
      queueMicrotask(() => {
        if (!cancelled) {
          setStatsClimbs([])
          setLogbookSessions([])
          setSessionClimbsError(null)
          setSessionClimbsLoading(false)
        }
      })

      return () => {
        cancelled = true
      }
    }

    queueMicrotask(() => {
      if (!cancelled) {
        setSessionClimbsLoading(true)
        setSessionClimbsError(null)
      }
    })

    void fetchStatsBase(user.id)
      .then((statsBase) => {
        if (!cancelled) {
          setStatsClimbs(prepareEnrichedClimbs(statsBase))
          setLogbookSessions(buildLogbookSessions(statsBase.climbs.map(toLogbookClimb)))
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setStatsClimbs([])
          setLogbookSessions([])
          setSessionClimbsError(loadError instanceof Error ? loadError.message : "Failed to load session climbs")
        }
      })
      .finally(() => {
        if (!cancelled) {
          setSessionClimbsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [refreshKey, user?.id])

  return (
    <div className="app-safe-shell min-h-screen bg-stone-bg">
      <main className="app-safe-shell__main mx-auto flex min-h-screen max-w-[420px] flex-col px-5 pb-32 pt-6">
        <DetailPageHeader backTo="/stats" backLabel="Back to Stats" backAriaLabel="Back to Stats">
          <h1 className="text-xl font-bold text-stone-text">Sessions</h1>
        </DetailPageHeader>

        <div className="mt-5">
          <SessionsTrendChart points={sessionsMockData.trendPoints} />
        </div>

        <div className="mt-4">
          <SessionTrendMetrics metrics={sessionsMockData.trendMetrics} />
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
          <SessionIdentityLine identity={selectedMockSession.identity} />
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
          <SessionInsight insight={selectedMockSession.insight} />
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
