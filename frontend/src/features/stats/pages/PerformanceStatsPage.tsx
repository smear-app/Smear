import BackButton from "../../../components/BackButton"
import BottomNav from "../../../components/BottomNav"
import GradeBandPerformance from "../components/performance/GradeBandPerformance"
import OutcomeBreakdown from "../components/performance/OutcomeBreakdown"
import PerformanceHero from "../components/performance/PerformanceHero"
import PerformanceInsight from "../components/performance/PerformanceInsight"
import PerformanceMetricGrid from "../components/performance/PerformanceMetricGrid"
import { performanceMockData } from "../domain/performance/mockPerformanceData"

export default function PerformanceStatsPage() {
  return (
    <div className="app-safe-shell min-h-screen bg-stone-bg">
      <main className="app-safe-shell__main mx-auto flex min-h-screen max-w-[420px] flex-col px-5 pb-32 pt-6">
        <div className="flex items-center gap-3">
          <BackButton to="/stats" label="Back to Stats" ariaLabel="Back to Stats" size="sm" />
          <h1 className="text-xl font-bold text-stone-text">Performance</h1>
        </div>

        <div className="mt-5">
          <PerformanceHero hero={performanceMockData.hero} />
        </div>

        <div className="mt-4">
          <OutcomeBreakdown items={performanceMockData.outcomes} />
        </div>

        <div className="mt-4">
          <PerformanceMetricGrid metrics={performanceMockData.metrics} />
        </div>

        <div className="mt-4">
          <GradeBandPerformance bands={performanceMockData.gradeBands} />
        </div>

        <div className="mt-4">
          <PerformanceInsight insight={performanceMockData.insight} />
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
