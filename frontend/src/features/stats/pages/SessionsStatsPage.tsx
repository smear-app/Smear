import { useMemo, useState } from "react"
import BackButton from "../../../components/BackButton"
import BottomNav from "../../../components/BottomNav"
import SessionsTrendChart from "../components/sessions/SessionsTrendChart"
import SessionTrendMetrics from "../components/sessions/SessionTrendMetrics"
import SessionSelector from "../components/sessions/SessionSelector"
import SessionSummary from "../components/sessions/SessionSummary"
import SessionDetailBreakdown from "../components/sessions/SessionDetailBreakdown"
import SessionInsight from "../components/sessions/SessionInsight"
import { sessionsMockData } from "../domain/sessions/mockSessionsData"

export default function SessionsStatsPage() {
  const [selectedSessionIndex, setSelectedSessionIndex] = useState(0)
  const selectedSession = useMemo(
    () => sessionsMockData.sessions[selectedSessionIndex],
    [selectedSessionIndex],
  )

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
          />
        </div>

        <div className="mt-4">
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
