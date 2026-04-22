import { useEffect, useMemo, useState } from "react"
import { useLocation } from "react-router-dom"
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
import { fetchStatsBase, prepareEnrichedClimbs, type StatsBaseData } from "../domain/base"
import { calculateArchetypeMetrics } from "../domain/calculators"
import { selectArchetypeViewModel } from "../domain/archetype/selectArchetypeViewModel"
import { getArchetypeSegmentOptions } from "../domain/archetype/tagTaxonomy"
import type { EnrichedClimb } from "../domain/primitives"
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
  const { user } = useAuth()
  const [selectedSegment, setSelectedSegment] = useState<ArchetypeSegment>("terrain")
  const [statsClimbs, setStatsClimbs] = useState<EnrichedClimb[]>([])
  const shouldShowDebug = import.meta.env.DEV && new URLSearchParams(location.search).has("debugArchetype")
  const archetypeMetrics = useMemo(() => calculateArchetypeMetrics(statsClimbs), [statsClimbs])
  const viewModel = useMemo(
    () => selectArchetypeViewModel(archetypeMetrics, selectedSegment),
    [archetypeMetrics, selectedSegment],
  )

  useEffect(() => {
    if (!shouldShowDebug) {
      return
    }

    console.info("[ArchetypeStatsPage] normalized climb inputs", summarizeEnrichedClimbs(statsClimbs))
    console.info("[ArchetypeStatsPage] raw archetype metrics", archetypeMetrics)
    console.info("[ArchetypeStatsPage] selected segment view model", {
      selectedSegment,
      categories: viewModel.categories,
      radarAxes: viewModel.radarAxes,
      breakdown: viewModel.breakdown,
    })
    console.info("[ArchetypeStatsPage] radar chart props", viewModel.radarAxes)
  }, [archetypeMetrics, selectedSegment, shouldShowDebug, statsClimbs, viewModel])

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
          const enrichedClimbs = prepareEnrichedClimbs(statsBase)

          if (shouldShowDebug) {
            console.info("[ArchetypeStatsPage] fetched stats base", summarizeStatsBase(statsBase))
            console.info("[ArchetypeStatsPage] prepared archetype inputs", summarizeEnrichedClimbs(enrichedClimbs))
          }

          setStatsClimbs(enrichedClimbs)
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
  }, [shouldShowDebug, user?.id])

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

        {shouldShowDebug ? (
          <pre className="mt-4 max-h-80 overflow-auto rounded-lg border border-stone-border bg-stone-surface p-3 text-[10px] text-stone-text">
            {JSON.stringify(
              {
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
