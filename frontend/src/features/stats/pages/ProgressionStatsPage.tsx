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
import { bucketClimbsByWeek, type EnrichedClimb } from "../domain/primitives"
import type { ProgressionMetrics } from "../domain/calculators"
import type { ProgressionRange } from "../domain/progression/types"

const TEN_WEEKS_MS = 10 * 7 * 24 * 60 * 60 * 1000
const DEBUG_PROGRESSION_BINS_STORAGE_KEY = "smear:debug-progression-bins"

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

function getProgressionBinDebugRows(climbs: readonly EnrichedClimb[], metrics: ProgressionMetrics) {
  const metricsByKey = new Map(metrics.weekly.map((bucket) => [bucket.key, bucket]))

  return bucketClimbsByWeek(climbs).map((bucket, index) => {
    const metric = metricsByKey.get(bucket.key)

    return {
      index,
      key: bucket.key,
      startAt: bucket.startAt,
      endAt: bucket.endAt,
      totalClimbs: metric?.totalClimbs ?? bucket.climbs.length,
      totalSentClimbs: metric?.totalSentClimbs ?? bucket.climbs.filter((climb) => climb.isSend).length,
      workingGrade: metric?.workingGrade ?? null,
      climbs: bucket.climbs.map((climb) => ({
        id: climb.id,
        loggedAt: climb.loggedAt,
        gradeLabel: climb.gradeLabel,
        gradeIndex: climb.gradeIndex,
        outcome: climb.outcome,
        isSend: climb.isSend,
        isFlash: climb.isFlash,
        gymName: climb.gymName,
      })),
    }
  })
}

export default function ProgressionStatsPage() {
  const { user } = useAuth()
  const [selectedRange, setSelectedRange] = useState<ProgressionRange>(defaultProgressionRange)
  const [statsClimbs, setStatsClimbs] = useState<EnrichedClimb[]>([])
  const progressionView = useMemo(() => progressionMockData[selectedRange], [selectedRange])
  const selectedChartData = useMemo(() => {
    const now = new Date()
    const rangeStart = getRangeStart(selectedRange, now)
    const metrics = calculateProgressionMetrics(statsClimbs)
    const firstHistoryStartAt = metrics.weekly[0]?.startAt ?? null

    return {
      metrics,
      selectedClimbs: statsClimbs,
      view: selectProgressionViewModel(metrics, {
        range: selectedRange,
        visibleStartAt: rangeStart,
        visibleEndAt: now,
        firstHistoryStartAt,
      }),
    }
  }, [selectedRange, statsClimbs])
  const selectedChartView = selectedChartData.view
  const milestones = useMemo(() => selectProgressionMilestones(progressionView), [progressionView])

  useEffect(() => {
    if (window.localStorage.getItem(DEBUG_PROGRESSION_BINS_STORAGE_KEY) !== "1") {
      return
    }

    const bins = getProgressionBinDebugRows(selectedChartData.selectedClimbs, selectedChartData.metrics)

    console.groupCollapsed(`[Progression bins] range=${selectedRange}`)
    console.table(
      bins.map((bin) => ({
        index: bin.index,
        key: bin.key,
        startAt: bin.startAt,
        endAt: bin.endAt,
        totalClimbs: bin.totalClimbs,
        totalSentClimbs: bin.totalSentClimbs,
        workingGrade: bin.workingGrade,
        climbIds: bin.climbs.map((climb) => climb.id).join(", "),
      })),
    )
    console.log("Progression bin details", bins)
    console.groupEnd()
  }, [selectedChartData, selectedRange])

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
          <ProgressionMetricsGrid metrics={selectedChartView.metrics} />
        </div>

        <div className="mt-4">
          <ProgressionMilestonesList milestones={milestones} />
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
