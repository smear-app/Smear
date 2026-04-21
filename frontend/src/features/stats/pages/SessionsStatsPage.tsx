import { useEffect, useMemo, useState } from "react"
import { useLocation } from "react-router-dom"
import BottomNav from "../../../components/BottomNav"
import DetailPageHeader from "../../../components/DetailPageHeader"
import { useAuth } from "../../../context/AuthContext"
import SessionsTrendChart from "../components/sessions/SessionsTrendChart"
import SessionTrendMetrics from "../components/sessions/SessionTrendMetrics"
import SessionSelector from "../components/sessions/SessionSelector"
import SessionSummary from "../components/sessions/SessionSummary"
import SessionDetailBreakdown from "../components/sessions/SessionDetailBreakdown"
import SessionInsight from "../components/sessions/SessionInsight"
import SessionIdentityLine from "../components/sessions/SessionIdentityLine"
import { fetchStatsBase, prepareEnrichedClimbs } from "../domain/base"
import { calculateSessionMetrics } from "../domain/calculators"
import type { EnrichedClimb } from "../domain/primitives"
import { sessionsMockData } from "../domain/sessions/mockSessionsData"
import { selectSessionsViewModel } from "../domain/sessions/selectSessionsViewModel"
import type { SessionDetail } from "../domain/sessions/types"

type SessionsStatsLocationState = {
  selectedSessionIndex?: number
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

export default function SessionsStatsPage() {
  const location = useLocation()
  const locationState = (location.state ?? {}) as SessionsStatsLocationState
  const { user } = useAuth()
  const [statsClimbs, setStatsClimbs] = useState<EnrichedClimb[]>([])
  const [selectedSessionIndex, setSelectedSessionIndex] = useState(() => {
    const restoredIndex = locationState.selectedSessionIndex

    return typeof restoredIndex === "number"
      ? Math.max(restoredIndex, 0)
      : 0
  })
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

  useEffect(() => {
    let cancelled = false

    if (!user?.id) {
      queueMicrotask(() => {
        if (!cancelled) {
          setStatsClimbs([])
        }
      })

      return () => {
        cancelled = true
      }
    }

    void fetchStatsBase(user.id)
      .then((statsBase) => {
        if (!cancelled) {
          setStatsClimbs(prepareEnrichedClimbs(statsBase))
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatsClimbs([])
        }
      })

    return () => {
      cancelled = true
    }
  }, [user?.id])

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
