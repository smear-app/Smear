import { useEffect, useMemo, useState } from "react"
import { useLocation } from "react-router-dom"
import BottomNav from "../../../components/BottomNav"
import DetailPageHeader from "../../../components/DetailPageHeader"
import ArchetypeBreakdownList from "../components/archetype/ArchetypeBreakdownList"
import ArchetypeRadarLegend from "../components/archetype/ArchetypeRadarLegend"
import ArchetypeRadarChart from "../components/archetype/ArchetypeRadarChart"
import ArchetypeSegmentControl from "../components/archetype/ArchetypeSegmentControl"
import ArchetypeTimeframeControl from "../components/archetype/ArchetypeTimeframeControl"
import ArchetypeTrendCard from "../components/archetype/ArchetypeTrendCard"
import Insight from "../components/Insight"
import ProgressionSurface from "../components/progression/ProgressionSurface"
import type { StatsBaseData } from "../domain/base"
import { calculateArchetypeMetrics } from "../domain/calculators"
import { selectArchetypeViewModel } from "../domain/archetype/selectArchetypeViewModel"
import { getArchetypeSegmentOptions } from "../domain/archetype/tagTaxonomy"
import {
  archetypeTimeframeOptions,
  defaultArchetypeTimeframe,
  filterClimbsForArchetypeTimeframe,
  type ArchetypeTimeframe,
} from "../domain/archetype/timeframes"
import type { EnrichedClimb } from "../domain/primitives"
import { useSharedStatsBase } from "../hooks/useSharedStatsBase"
import type { ArchetypeSegment } from "../domain/archetype/types"

const archetypeSegmentOptions = getArchetypeSegmentOptions()

function summarizeStatsBase(statsBase: StatsBaseData) {
  return {
    climbCount: statsBase.climbs.length,
    sampleClimbs: statsBase.climbs.slice(0, 5).map((climb) => ({
      id: climb.id,
      send_type: climb.send_type,
      gym_grade: climb.gym_grade,
      gym_grade_value: climb.gym_grade_value,
      tags: climb.tags,
      canonical_tags: climb.canonical_tags,
    })),
  }
}

function summarizeEnrichedClimbs(climbs: readonly EnrichedClimb[]) {
  return {
    climbCount: climbs.length,
    tagCounts: climbs.reduce<Record<string, number>>((counts, climb) => {
      for (const tag of climb.tags) {
        counts[tag.id] = (counts[tag.id] ?? 0) + 1
      }
      return counts
    }, {}),
    canonicalTagCounts: climbs.reduce<Record<string, number>>((counts, climb) => {
      for (const tag of Object.values(climb.canonicalTags).flat()) {
        counts[tag.id] = (counts[tag.id] ?? 0) + 1
      }
      return counts
    }, {}),
    outcomeCounts: climbs.reduce<Record<string, number>>((counts, climb) => {
      counts[climb.outcome] = (counts[climb.outcome] ?? 0) + 1
      return counts
    }, {}),
    sampleClimbs: climbs.slice(0, 5).map((climb) => ({
      id: climb.id,
      outcome: climb.outcome,
      isSend: climb.isSend,
      isFlash: climb.isFlash,
      isAttempt: climb.isAttempt,
      gradeIndex: climb.gradeIndex,
      tags: climb.tags,
      canonicalTags: climb.canonicalTags,
    })),
  }
}

export default function ArchetypeStatsPage() {
  const location = useLocation()
  const [selectedSegment, setSelectedSegment] = useState<ArchetypeSegment>("terrain")
  const [selectedTimeframe, setSelectedTimeframe] = useState<ArchetypeTimeframe>(defaultArchetypeTimeframe)
  const { statsBase, enrichedClimbs: statsClimbs } = useSharedStatsBase()
  const shouldShowDebug = import.meta.env.DEV && new URLSearchParams(location.search).has("debugArchetype")
  const selectedClimbs = useMemo(
    () => filterClimbsForArchetypeTimeframe(statsClimbs, selectedTimeframe, new Date()),
    [selectedTimeframe, statsClimbs],
  )
  const archetypeMetrics = useMemo(() => calculateArchetypeMetrics(selectedClimbs), [selectedClimbs])
  const viewModel = useMemo(
    () => selectArchetypeViewModel(archetypeMetrics, selectedSegment),
    [archetypeMetrics, selectedSegment],
  )

  useEffect(() => {
    if (!shouldShowDebug) {
      return
    }

    if (statsBase) {
      console.info("[ArchetypeStatsPage] shared stats base", summarizeStatsBase(statsBase))
    }
    console.info("[ArchetypeStatsPage] normalized shared inputs", summarizeEnrichedClimbs(statsClimbs))
    console.info("[ArchetypeStatsPage] selected timeframe inputs", {
      selectedTimeframe,
      ...summarizeEnrichedClimbs(selectedClimbs),
    })
    console.info("[ArchetypeStatsPage] raw archetype metrics", archetypeMetrics)
    console.info("[ArchetypeStatsPage] selected segment view model", {
      selectedSegment,
      selectedTimeframe,
      categories: viewModel.categories,
      radarAxes: viewModel.radarAxes,
      breakdown: viewModel.breakdown,
    })
    console.info("[ArchetypeStatsPage] radar chart props", viewModel.radarAxes)
  }, [archetypeMetrics, selectedClimbs, selectedSegment, selectedTimeframe, shouldShowDebug, statsBase, statsClimbs, viewModel])

  return (
    <div className="app-safe-shell min-h-screen bg-stone-bg">
      <main className="app-safe-shell__main mx-auto flex min-h-screen max-w-[420px] flex-col px-5 pb-32 pt-6">
        <DetailPageHeader backTo="/stats" backLabel="Back to Stats" backAriaLabel="Back to Stats">
          <h1 className="text-xl font-bold text-stone-text">Archetype</h1>
        </DetailPageHeader>

        <div className="mt-4">
          <ArchetypeTimeframeControl
            options={archetypeTimeframeOptions}
            value={selectedTimeframe}
            onChange={setSelectedTimeframe}
          />
        </div>

        <div className="mt-3">
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

        {shouldShowDebug ? (
          <pre className="mt-4 max-h-80 overflow-auto rounded-lg border border-stone-border bg-stone-surface p-3 text-[10px] text-stone-text">
            {JSON.stringify(
              {
                selectedTimeframe,
                selectedSegment,
                categories: viewModel.categories,
                radarAxes: viewModel.radarAxes,
              },
              null,
              2,
            )}
          </pre>
        ) : null}

        <div className="mt-4">
          <ArchetypeTrendCard />
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
