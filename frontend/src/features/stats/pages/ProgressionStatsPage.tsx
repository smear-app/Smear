import { useMemo, useState } from "react"
import BackButton from "../../../components/BackButton"
import BottomNav from "../../../components/BottomNav"
import ProgressionChartCard from "../components/progression/ProgressionChartCard"
import ProgressionInsightCard from "../components/progression/ProgressionInsightCard"
import ProgressionMetricsGrid from "../components/progression/ProgressionMetricsGrid"
import ProgressionMilestonesList from "../components/progression/ProgressionMilestonesList"
import ProgressionRangeControl from "../components/progression/ProgressionRangeControl"
import { progressionMockData, progressionRangeOptions } from "../domain/progression/mockProgressionData"
import type { ProgressionRange } from "../domain/progression/types"

export default function ProgressionStatsPage() {
  const [selectedRange, setSelectedRange] = useState<ProgressionRange>("10-weeks")
  const progressionView = useMemo(() => progressionMockData[selectedRange], [selectedRange])

  return (
    <div className="app-safe-shell min-h-screen bg-stone-bg">
      <main className="app-safe-shell__main mx-auto flex min-h-screen max-w-[420px] flex-col px-5 pb-32 pt-6">
        <div className="flex items-center gap-3">
          <BackButton to="/stats" label="Back to Stats" ariaLabel="Back to Stats" size="sm" />
          <h1 className="text-xl font-bold text-stone-text">Progression</h1>
        </div>

        <div className="mt-4">
          <ProgressionRangeControl
            options={progressionRangeOptions}
            value={selectedRange}
            onChange={setSelectedRange}
          />
        </div>

        <div className="mt-5">
          <ProgressionChartCard
            points={progressionView.chartPoints}
          />
        </div>

        <div className="mt-4">
          <ProgressionInsightCard insight={progressionView.insight} />
        </div>

        <div className="mt-4">
          <ProgressionMetricsGrid metrics={progressionView.metrics} />
        </div>

        <div className="mt-4">
          <ProgressionMilestonesList milestones={progressionView.milestones} />
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
