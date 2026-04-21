import { CLIMB_TAG_CATEGORIES, normalizeClimbTag, type ClimbTagCategoryId } from "../../../../lib/climbTags"
import {
  filterSentClimbs,
  getAverageGrade,
  getMedianGrade,
  type EnrichedClimb,
  type EnrichedTag,
} from "../primitives"
import { calculateTopFortyPercentMedianWorkingGrade, safeDivide } from "./shared"

export type ArchetypeGroupKey = "holdType" | "movement" | "terrain" | "mechanics"

export type ArchetypeTagMetric = {
  tagKey: string
  tagLabel: string
  group: ArchetypeGroupKey
  climbCount: number
  climbShare: number
  sentCount: number
  averageSentGrade: number | null
  medianSentGrade: number | null
  workingGrade: number | null
}

export type ArchetypeMetrics = Record<ArchetypeGroupKey, ArchetypeTagMetric[]>

type ArchetypeTagDefinition = {
  tagKey: string
  tagLabel: string
  group: ArchetypeGroupKey
}

type ArchetypeTagAccumulator = ArchetypeTagDefinition & {
  climbs: EnrichedClimb[]
}

const ARCHETYPE_GROUP_ORDER = ["holdType", "movement", "terrain", "mechanics"] as const

function toArchetypeGroup(categoryId: ClimbTagCategoryId): ArchetypeGroupKey {
  switch (categoryId) {
    case "hold":
      return "holdType"
    case "movement":
      return "movement"
    case "wall":
      return "terrain"
    case "mechanic":
      return "mechanics"
  }
}

function getTagDefinitions(): ArchetypeTagDefinition[] {
  return CLIMB_TAG_CATEGORIES.flatMap((category) =>
    category.options.map((tagLabel) => ({
      tagKey: normalizeClimbTag(tagLabel),
      tagLabel,
      group: toArchetypeGroup(category.id),
    })),
  )
}

function createEmptyMetrics(): ArchetypeMetrics {
  return {
    holdType: [],
    movement: [],
    terrain: [],
    mechanics: [],
  }
}

function createAccumulatorsByTagKey(): Map<string, ArchetypeTagAccumulator> {
  return new Map(
    getTagDefinitions().map((definition) => [
      definition.tagKey,
      {
        ...definition,
        climbs: [],
      },
    ]),
  )
}

function getKnownAttributionTags(climb: EnrichedClimb, accumulatorsByTagKey: ReadonlyMap<string, ArchetypeTagAccumulator>) {
  const tagsByKey = new Map<string, EnrichedTag>()

  for (const tag of Object.values(climb.canonicalTags).flat()) {
    if (accumulatorsByTagKey.has(tag.id)) {
      tagsByKey.set(tag.id, tag)
    }
  }

  return [...tagsByKey.values()]
}

function buildTagMetric(
  accumulator: ArchetypeTagAccumulator,
  groupAttributionCount: number,
): ArchetypeTagMetric {
  const sentClimbs = filterSentClimbs(accumulator.climbs)

  return {
    tagKey: accumulator.tagKey,
    tagLabel: accumulator.tagLabel,
    group: accumulator.group,
    climbCount: accumulator.climbs.length,
    climbShare: safeDivide(accumulator.climbs.length, groupAttributionCount),
    sentCount: sentClimbs.length,
    averageSentGrade: getAverageGrade(sentClimbs),
    medianSentGrade: getMedianGrade(sentClimbs),
    workingGrade: calculateTopFortyPercentMedianWorkingGrade(sentClimbs),
  }
}

export function calculateArchetypeMetrics(climbs: readonly EnrichedClimb[]): ArchetypeMetrics {
  const accumulatorsByTagKey = createAccumulatorsByTagKey()
  const groupAttributionCounts: Record<ArchetypeGroupKey, number> = {
    holdType: 0,
    movement: 0,
    terrain: 0,
    mechanics: 0,
  }

  for (const climb of climbs) {
    for (const tag of getKnownAttributionTags(climb, accumulatorsByTagKey)) {
      const accumulator = accumulatorsByTagKey.get(tag.id)

      if (!accumulator) {
        continue
      }

      accumulator.climbs.push(climb)
      groupAttributionCounts[accumulator.group] += 1
    }
  }

  const metrics = createEmptyMetrics()

  for (const group of ARCHETYPE_GROUP_ORDER) {
    metrics[group] = [...accumulatorsByTagKey.values()]
      .filter((accumulator) => accumulator.group === group)
      .map((accumulator) => buildTagMetric(accumulator, groupAttributionCounts[group]))
  }

  return metrics
}
