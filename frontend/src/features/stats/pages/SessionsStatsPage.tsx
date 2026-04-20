import { useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import BackButton from "../../../components/BackButton"
import BottomNav from "../../../components/BottomNav"
import { useAuth } from "../../../context/AuthContext"
import { useLogbookHistory } from "../../../hooks/useLogbookHistory"
import { DEFAULT_LOGBOOK_FILTERS } from "../../../lib/logbook"
import SessionClimbActions from "../components/sessions/SessionClimbActions"
import SessionsTrendChart from "../components/sessions/SessionsTrendChart"
import SessionTrendMetrics from "../components/sessions/SessionTrendMetrics"
import SessionSelector from "../components/sessions/SessionSelector"
import SessionSummary from "../components/sessions/SessionSummary"
import SessionDetailBreakdown from "../components/sessions/SessionDetailBreakdown"
import SessionInsight from "../components/sessions/SessionInsight"
import SessionIdentityLine from "../components/sessions/SessionIdentityLine"
import { sessionsMockData } from "../domain/sessions/mockSessionsData"

type SessionsStatsLocationState = {
  selectedSessionIndex?: number
  climbsExpanded?: boolean
}

export default function SessionsStatsPage() {
  const location = useLocation()
  const locationState = (location.state ?? {}) as SessionsStatsLocationState
  const navigate = useNavigate()
  const { user } = useAuth()
  const [selectedSessionIndex, setSelectedSessionIndex] = useState(() => {
    const restoredIndex = locationState.selectedSessionIndex

    return typeof restoredIndex === "number"
      ? Math.min(Math.max(restoredIndex, 0), sessionsMockData.sessions.length - 1)
      : 0
  })
  const [climbsExpanded, setClimbsExpanded] = useState(() => Boolean(locationState.climbsExpanded))
  const selectedSession = useMemo(
    () => sessionsMockData.sessions[selectedSessionIndex],
    [selectedSessionIndex],
  )
  const {
    sessions: logbookSessions,
    isLoading: sessionClimbsLoading,
    error: sessionClimbsError,
  } = useLogbookHistory({
    userId: user?.id,
    filters: DEFAULT_LOGBOOK_FILTERS,
    sort: "newest",
  })
  const selectedLogbookSession = logbookSessions[selectedSessionIndex] ?? null
  const selectedSessionClimbs = selectedLogbookSession?.climbs ?? []
  const focusedLogbookHref = selectedLogbookSession
    ? `/home/logbook?view=list&sort=newest&sessionId=${encodeURIComponent(selectedLogbookSession.id)}`
    : "/home/logbook?view=list&sort=newest"
  const detailReturnPath = `${location.pathname}${location.search}`
  const openSelectedSessionInLogbook = () => {
    navigate(focusedLogbookHref, {
      state: selectedLogbookSession
        ? {
            focusSessionId: selectedLogbookSession.id,
            fromStatsSessionDetail: true,
          }
        : undefined,
    })
  }

  return (
    <div className="app-safe-shell min-h-screen bg-stone-bg">
      <main className="app-safe-shell__main mx-auto flex min-h-screen max-w-[420px] flex-col px-5 pb-32 pt-6">
        <div className="flex items-center gap-3">
          <BackButton to="/stats" label="Back to Stats" ariaLabel="Back to Stats" size="sm" />
          <h1 className="text-xl font-bold text-stone-text">Sessions</h1>
        </div>

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
            currentIndex={selectedSessionIndex}
            total={sessionsMockData.sessions.length}
            onPrevious={() =>
              setSelectedSessionIndex((currentIndex) => Math.min(currentIndex + 1, sessionsMockData.sessions.length - 1))
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
                logbookSessionId={selectedLogbookSession?.id ?? null}
                detailReturnPath={detailReturnPath}
                detailReturnState={{ selectedSessionIndex, climbsExpanded }}
                onToggleExpanded={() => setClimbsExpanded((current) => !current)}
                onOpenLogbook={openSelectedSessionInLogbook}
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
