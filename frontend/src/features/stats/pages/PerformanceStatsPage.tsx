import { useMemo, useState } from "react"
import BackButton from "../../../components/BackButton"
import BottomNav from "../../../components/BottomNav"
import GradePyramid from "../components/performance/GradePyramid"
import GradeBandPerformance from "../components/performance/GradeBandPerformance"
import OutcomeBreakdown from "../components/performance/OutcomeBreakdown"
import PerformanceInsight from "../components/performance/PerformanceInsight"
import PerformanceMetricGrid from "../components/performance/PerformanceMetricGrid"
import PerformanceRangeControl from "../components/performance/PerformanceRangeControl"
import { performanceMockData, performanceRangeOptions } from "../domain/performance/mockPerformanceData"
import type { PerformanceRange } from "../domain/performance/types"

export default function PerformanceStatsPage() {
  const [selectedRange, setSelectedRange] = useState<PerformanceRange>("10-weeks")
  const performanceView = useMemo(() => performanceMockData[selectedRange], [selectedRange])

  return (
    <div className="app-safe-shell min-h-screen bg-stone-bg">
      <main className="app-safe-shell__main mx-auto flex min-h-screen max-w-[420px] flex-col px-5 pb-32 pt-6">
        <div className="flex items-center gap-3">
          <BackButton to="/stats" label="Back to Stats" ariaLabel="Back to Stats" size="sm" />
          <h1 className="text-xl font-bold text-stone-text">Performance</h1>
        </div>

        <div className="mt-4">
          <PerformanceRangeControl
            options={performanceRangeOptions}
            value={selectedRange}
            onChange={setSelectedRange}
          />
        </div>

        <div className="mt-5">
          <GradePyramid bands={performanceView.pyramid} periodLabel={performanceView.periodLabel} />
        </div>

        <div className="mt-4">
          <OutcomeBreakdown items={performanceView.outcomes} periodLabel={performanceView.periodLabel} />
        </div>

        <div className="mt-4">
          <PerformanceMetricGrid metrics={performanceView.metrics} periodLabel={performanceView.periodLabel} />
        </div>

        <div className="mt-4">
          <GradeBandPerformance bands={performanceView.gradeBands} periodLabel={performanceView.periodLabel} />
        </div>

        <div className="mt-4">
          <PerformanceInsight insight={performanceView.insight} />
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
