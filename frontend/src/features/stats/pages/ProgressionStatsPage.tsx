import { useEffect, useMemo, useState } from "react"
import BottomNav from "../../../components/BottomNav"
import DetailPageHeader from "../../../components/DetailPageHeader"
import { useAuth } from "../../../context/AuthContext"
import ProgressionChartCard from "../components/progression/ProgressionChartCard"
import ProgressionInsightCard from "../components/progression/ProgressionInsightCard"
import ProgressionMetricsGrid from "../components/progression/ProgressionMetricsGrid"
import ProgressionMilestonesList from "../components/progression/ProgressionMilestonesList"
import ProgressionRangeControl from "../components/progression/ProgressionRangeControl"
import { fetchStatsBase, prepareEnrichedClimbs } from "../domain/base"
import { calculateProgressionMetrics } from "../domain/calculators"
import {
  defaultProgressionRange,
  progressionMockData,
  progressionRangeOptions,
} from "../domain/progression/mockProgressionData"
import { selectProgressionMilestones } from "../domain/progression/selectProgressionMilestones"
import { selectProgressionViewModel } from "../domain/progression/selectProgressionViewModel"
import type { EnrichedClimb } from "../domain/primitives"
import type { ProgressionRange } from "../domain/progression/types"

const TEN_WEEKS_MS = 10 * 7 * 24 * 60 * 60 * 1000

function getRangeStart(range: ProgressionRange, now: Date): Date | null {
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

function getClimbsForRange(climbs: readonly EnrichedClimb[], range: ProgressionRange, now: Date): EnrichedClimb[] {
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

export default function ProgressionStatsPage() {
  const { user } = useAuth()
  const [selectedRange, setSelectedRange] = useState<ProgressionRange>(defaultProgressionRange)
  const [statsClimbs, setStatsClimbs] = useState<EnrichedClimb[]>([])
  const progressionView = useMemo(() => progressionMockData[selectedRange], [selectedRange])
  const selectedChartView = useMemo(() => {
    const now = new Date()
    const selectedClimbs = getClimbsForRange(statsClimbs, selectedRange, now)
    const metrics = calculateProgressionMetrics(selectedClimbs)

    return selectProgressionViewModel(metrics)
  }, [selectedRange, statsClimbs])
  const milestones = useMemo(() => selectProgressionMilestones(progressionView), [progressionView])

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
          <h1 className="text-xl font-bold text-stone-text">Progression</h1>
        </DetailPageHeader>

        <div className="mt-4">
          <ProgressionRangeControl
            options={progressionRangeOptions}
            value={selectedRange}
            onChange={setSelectedRange}
          />
        </div>

        <div className="mt-5">
          <ProgressionChartCard
            points={selectedChartView.chartPoints}
          />
        </div>

        <div className="mt-4">
          <ProgressionInsightCard insight={progressionView.insight} />
        </div>

        <div className="mt-4">
          <ProgressionMetricsGrid metrics={progressionView.metrics} />
        </div>

        <div className="mt-4">
          <ProgressionMilestonesList milestones={milestones} />
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
