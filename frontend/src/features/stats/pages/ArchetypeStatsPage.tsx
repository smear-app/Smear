import { useEffect, useMemo, useState } from "react"
import BottomNav from "../../../components/BottomNav"
import DetailPageHeader from "../../../components/DetailPageHeader"
import { useAuth } from "../../../context/AuthContext"
import ArchetypeBreakdownList from "../components/archetype/ArchetypeBreakdownList"
import ArchetypeRadarLegend from "../components/archetype/ArchetypeRadarLegend"
import ArchetypeRadarChart from "../components/archetype/ArchetypeRadarChart"
import ArchetypeSegmentControl from "../components/archetype/ArchetypeSegmentControl"
import ArchetypeTrendCard from "../components/archetype/ArchetypeTrendCard"
import Insight from "../components/Insight"
import ProgressionSurface from "../components/progression/ProgressionSurface"
import { fetchStatsBase, prepareEnrichedClimbs } from "../domain/base"
import { calculateArchetypeMetrics } from "../domain/calculators"
import { selectArchetypeViewModel } from "../domain/archetype/selectArchetypeViewModel"
import { getArchetypeSegmentOptions } from "../domain/archetype/tagTaxonomy"
import type { EnrichedClimb } from "../domain/primitives"
import type { ArchetypeSegment } from "../domain/archetype/types"

const archetypeSegmentOptions = getArchetypeSegmentOptions()

export default function ArchetypeStatsPage() {
  const { user } = useAuth()
  const [selectedSegment, setSelectedSegment] = useState<ArchetypeSegment>("terrain")
  const [statsClimbs, setStatsClimbs] = useState<EnrichedClimb[]>([])
  const archetypeMetrics = useMemo(() => calculateArchetypeMetrics(statsClimbs), [statsClimbs])
  const viewModel = useMemo(
    () => selectArchetypeViewModel(archetypeMetrics, selectedSegment),
    [archetypeMetrics, selectedSegment],
  )

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
          <h1 className="text-xl font-bold text-stone-text">Archetype</h1>
        </DetailPageHeader>

        <div className="mt-4">
          <ArchetypeSegmentControl
            options={archetypeSegmentOptions}
            value={selectedSegment}
            onChange={setSelectedSegment}
          />
        </div>

        <div className="mt-5">
          <ProgressionSurface className="relative px-4 py-4">
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
          <ArchetypeTrendCard />
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
