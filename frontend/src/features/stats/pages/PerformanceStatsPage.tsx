import { useMemo, useState } from "react"
import BottomNav from "../../../components/BottomNav"
import DetailPageHeader from "../../../components/DetailPageHeader"
import GradePyramid from "../components/performance/GradePyramid"
import GradeBandPerformance from "../components/performance/GradeBandPerformance"
import OutcomeBreakdown from "../components/performance/OutcomeBreakdown"
import PerformanceInsight from "../components/performance/PerformanceInsight"
import PerformanceMetricGrid from "../components/performance/PerformanceMetricGrid"
import PerformanceRangeControl from "../components/performance/PerformanceRangeControl"
import { calculatePerformanceMetrics } from "../domain/calculators"
import { performanceMockData, performanceRangeOptions } from "../domain/performance/mockPerformanceData"
import { selectPerformanceViewModel } from "../domain/performance/selectPerformanceViewModel"
import type { EnrichedClimb } from "../domain/primitives"
import { useSharedStatsBase } from "../hooks/useSharedStatsBase"
import type { PerformanceRange, PerformanceTimeframeKey } from "../domain/performance/types"

const PERFORMANCE_TIMEFRAME_BY_RANGE: Record<PerformanceRange, PerformanceTimeframeKey> = {
  "10-weeks": "10w",
  "6-months": "6m",
  "all-time": "all",
}

const TEN_WEEKS_MS = 10 * 7 * 24 * 60 * 60 * 1000

function getRangeStart(range: PerformanceRange, now: Date): Date | null {
  if (range === "all-time") {
    return null
  }

  if (range === "10-weeks") {
    return new Date(now.getTime() - TEN_WEEKS_MS)
  }

  const start = new Date(now)
  start.setMonth(start.getMonth() - 6)
  return start
}

function getClimbsForRange(climbs: readonly EnrichedClimb[], range: PerformanceRange, now: Date): EnrichedClimb[] {
  const start = getRangeStart(range, now)

  if (start === null) {
    return [...climbs]
  }

  const startTime = start.getTime()
  const endTime = now.getTime()

  return climbs.filter((climb) => {
    const loggedAt = new Date(climb.loggedAt).getTime()
    return Number.isFinite(loggedAt) && loggedAt >= startTime && loggedAt <= endTime
  })
}

export default function PerformanceStatsPage() {
  const [selectedRange, setSelectedRange] = useState<PerformanceRange>("10-weeks")
  const { enrichedClimbs: statsClimbs } = useSharedStatsBase()
  const performanceView = useMemo(() => performanceMockData[selectedRange], [selectedRange])
  const selectedMetricsView = useMemo(() => {
    const now = new Date()
    const selectedClimbs = getClimbsForRange(statsClimbs, selectedRange, now)
    const metrics = calculatePerformanceMetrics(selectedClimbs)

    return selectPerformanceViewModel(metrics, PERFORMANCE_TIMEFRAME_BY_RANGE[selectedRange])
  }, [selectedRange, statsClimbs])

  return (
    <div className="app-safe-shell min-h-screen bg-stone-bg">
      <main className="app-safe-shell__main mx-auto flex min-h-screen max-w-[420px] flex-col px-5 pb-32 pt-6">
        <DetailPageHeader backTo="/stats" backLabel="Back to Stats" backAriaLabel="Back to Stats">
          <h1 className="text-xl font-bold text-stone-text">Performance</h1>
        </DetailPageHeader>

        <div className="mt-4">
          <PerformanceRangeControl
            options={performanceRangeOptions}
            value={selectedRange}
            onChange={setSelectedRange}
          />
        </div>

        <div className="mt-5">
          <GradePyramid bands={selectedMetricsView.pyramid} periodLabel={selectedMetricsView.periodLabel} />
        </div>

        <div className="mt-4">
          <OutcomeBreakdown
            items={selectedMetricsView.outcomes}
            totalCount={selectedMetricsView.outcomeTotalCount}
            periodLabel={selectedMetricsView.periodLabel}
          />
        </div>

        <div className="mt-4">
          <PerformanceMetricGrid metrics={selectedMetricsView.metrics} periodLabel={selectedMetricsView.periodLabel} />
        </div>

        <div className="mt-4">
          <GradeBandPerformance bands={selectedMetricsView.gradeBands} periodLabel={selectedMetricsView.periodLabel} />
        </div>

        <div className="mt-4">
          <PerformanceInsight insight={performanceView.insight} />
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
