import { useMemo, useState } from "react"
import BackButton from "../../../components/BackButton"
import BottomNav from "../../../components/BottomNav"
import ArchetypeBreakdownList from "../components/archetype/ArchetypeBreakdownList"
import ArchetypeRadarLegend from "../components/archetype/ArchetypeRadarLegend"
import ArchetypeRadarChart from "../components/archetype/ArchetypeRadarChart"
import ArchetypeSegmentControl from "../components/archetype/ArchetypeSegmentControl"
import ArchetypeTrendCard from "../components/archetype/ArchetypeTrendCard"
import Insight from "../components/Insight"
import ProgressionSurface from "../components/progression/ProgressionSurface"
import { buildArchetypeViewModel, archetypeSegmentOptions } from "../domain/archetype/mockArchetypeData"
import type { ArchetypeSegment } from "../domain/archetype/types"

export default function ArchetypeStatsPage() {
  const [selectedSegment, setSelectedSegment] = useState<ArchetypeSegment>("terrain")
  const viewModel = useMemo(() => buildArchetypeViewModel(selectedSegment), [selectedSegment])

  return (
    <div className="app-safe-shell min-h-screen bg-stone-bg">
      <main className="app-safe-shell__main mx-auto flex min-h-screen max-w-[420px] flex-col px-5 pb-32 pt-6">
        <div className="flex items-center gap-3">
          <BackButton to="/stats" label="Back to Stats" ariaLabel="Back to Stats" size="sm" />
          <h1 className="text-xl font-bold text-stone-text">Archetype</h1>
        </div>

        <div className="mt-4">
          <ArchetypeSegmentControl
            options={archetypeSegmentOptions}
            value={selectedSegment}
            onChange={setSelectedSegment}
          />
        </div>

        <div className="mt-5">
          <ProgressionSurface className="relative px-4 pb-4 pt-3">
            <div className="pointer-events-none absolute right-4 top-3 z-10">
              <ArchetypeRadarLegend />
            </div>
            <ArchetypeRadarChart axes={viewModel.radarAxes} />
          </ProgressionSurface>
        </div>

        <div className="mt-3">
          <Insight title={viewModel.archetypeLabel} body={viewModel.description} />
        </div>

        <div className="mt-4">
          <ArchetypeBreakdownList items={viewModel.breakdown} />
        </div>

        <div className="mt-4">
          <ArchetypeTrendCard items={viewModel.trends} />
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
