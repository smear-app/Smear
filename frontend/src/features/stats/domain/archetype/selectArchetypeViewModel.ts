import type { ArchetypeGroupKey, ArchetypeMetrics, ArchetypeTagMetric } from "../calculators/archetype"
import type {
  ArchetypeCategoryEntry,
  ArchetypeCategoryOutcomeBreakdownItem,
  ArchetypeOutcomeBreakdownSegment,
  ArchetypeOutcomeCount,
  ArchetypeOutcomeTone,
  ArchetypeRadarAxis,
  ArchetypeRadarAxisDisplay,
  ArchetypeSegment,
  ArchetypeViewModel,
} from "./types"
import { getArchetypeAxisLabels } from "./tagTaxonomy"

const OUTCOME_LABELS: Record<ArchetypeOutcomeTone, string> = {
  flash: "Flash",
  send: "Send",
  attempted: "Attempted",
}

const OUTCOME_ORDER: ArchetypeOutcomeTone[] = ["flash", "send", "attempted"]
const RADAR_METADATA_SEPARATOR = "•"
// Ratio compression keeps balanced profiles full while muting tiny category differences.
const RADAR_NONZERO_FLOOR = 32
const RADAR_COMPRESSION_EXPONENT = 0.45
const PERFORMANCE_VALUE_OFFSET = 1

const SEGMENT_GROUPS = {
  terrain: "terrain",
  movement: "movement",
  holds: "holdType",
  mechanics: "mechanics",
} satisfies Record<ArchetypeSegment, ArchetypeGroupKey>

function formatGrade(grade: number | null): string {
  if (grade === null || !Number.isFinite(grade)) {
    return "-"
  }

  if (Number.isInteger(grade)) {
    return `V${grade}`
  }

  return `V${Math.floor(grade)}–V${Math.ceil(grade)}`
}

function formatVolume(value: number): string {
  return Number.isFinite(value) ? String(value) : "0"
}

function toRoundedPercentages(counts: number[]) {
  const total = counts.reduce((sum, count) => sum + count, 0)

  if (total === 0) {
    return counts.map(() => 0)
  }

  const rawPercentages = counts.map((count) => (count / total) * 100)
  const roundedDown = rawPercentages.map((percentage) => Math.floor(percentage))
  let remaining = 100 - roundedDown.reduce((sum, percentage) => sum + percentage, 0)

  const byRemainder = rawPercentages
    .map((percentage, index) => ({
      index,
      remainder: percentage - roundedDown[index],
    }))
    .sort((left, right) => right.remainder - left.remainder)

  for (let index = 0; index < byRemainder.length && remaining > 0; index += 1) {
    roundedDown[byRemainder[index].index] += 1
    remaining -= 1
  }

  return roundedDown
}

function toOutcomeBreakdownSegments(outcomeCounts: ArchetypeOutcomeCount[]): ArchetypeOutcomeBreakdownSegment[] {
  const countsByTone = new Map(outcomeCounts.map((item) => [item.tone, item.count]))
  const orderedCounts = OUTCOME_ORDER.map((tone) => ({
    tone,
    count: countsByTone.get(tone) ?? 0,
  }))
  const percentages = toRoundedPercentages(orderedCounts.map((item) => item.count))

  return orderedCounts.map((item, index) => ({
    tone: item.tone,
    label: OUTCOME_LABELS[item.tone],
    count: item.count,
    percentage: percentages[index],
    percentageLabel: `${percentages[index]}%`,
  }))
}

function toRadarAxisDisplay(entry: ArchetypeCategoryEntry): ArchetypeRadarAxisDisplay {
  return {
    performanceLabel: entry.workingGradeDisplayValue,
    volumeLabel: entry.volumeDisplayValue,
    metadataSeparator: RADAR_METADATA_SEPARATOR,
  }
}

export function normalizeSoftRadarValues(
  values: readonly (number | null)[],
  options: { valueOffset?: number } = {},
): number[] {
  const valueOffset = options.valueOffset ?? 0
  const transformedValues = values.map((value) =>
    value === null || !Number.isFinite(value) ? null : Math.max(value + valueOffset, 0),
  )
  const presentValues = transformedValues.flatMap((value) => (value === null ? [] : [value]))

  if (presentValues.length === 0) {
    return values.map(() => 0)
  }

  const maximum = Math.max(...presentValues)

  if (maximum <= 0) {
    return transformedValues.map((value) => (value === null ? 0 : 100))
  }

  return transformedValues.map((value) => {
    if (value === null) {
      return 0
    }

    const compressedRatio = Math.pow(value / maximum, RADAR_COMPRESSION_EXPONENT)
    return Math.round(RADAR_NONZERO_FLOOR + (100 - RADAR_NONZERO_FLOOR) * compressedRatio)
  })
}

function getMetricsForSegment(metrics: ArchetypeMetrics, segment: ArchetypeSegment): ArchetypeTagMetric[] {
  const group = SEGMENT_GROUPS[segment]
  const metricsByKey = new Map(metrics[group].map((metric) => [metric.tagLabel, metric]))

  return getArchetypeAxisLabels(segment).map((label) => {
    const metric = metricsByKey.get(label)

    if (!metric) {
      throw new Error(`Missing archetype metric for ${label}`)
    }

    return metric
  })
}

function selectCategories(metrics: ArchetypeTagMetric[]): ArchetypeCategoryEntry[] {
  const performanceRadarValues = normalizeSoftRadarValues(
    metrics.map((metric) => (metric.workingGrade === null ? null : metric.workingGrade)),
    { valueOffset: PERFORMANCE_VALUE_OFFSET },
  )
  const volumeRadarValues = normalizeSoftRadarValues(
    metrics.map((metric) => (metric.climbCount === 0 ? null : metric.climbCount)),
  )

  return metrics.map((metric, index) => ({
    categoryKey: metric.tagKey,
    label: metric.tagLabel,
    sentCount: metric.sentCount,
    totalLoggedCount: metric.climbCount,
    workingGradeSourceValues: metric.workingGradeSourceValues,
    workingGradeDisplayValue: formatGrade(metric.workingGrade),
    volumeDisplayValue: formatVolume(metric.climbCount),
    normalizedPerformanceRadarValue: performanceRadarValues[index],
    normalizedVolumeRadarValue: volumeRadarValues[index],
    missingPerformance: metric.workingGrade === null,
    missingVolume: metric.climbCount === 0,
  }))
}

function selectRadarAxes(categories: ArchetypeCategoryEntry[]): ArchetypeRadarAxis[] {
  return categories.map((entry) => ({
    label: entry.label,
    performance: entry.normalizedPerformanceRadarValue,
    volume: entry.normalizedVolumeRadarValue,
    display: toRadarAxisDisplay(entry),
  }))
}

function selectBreakdown(metrics: ArchetypeTagMetric[]): ArchetypeCategoryOutcomeBreakdownItem[] {
  return metrics.map((metric) => {
    const outcomes = toOutcomeBreakdownSegments([
      { tone: "flash", count: metric.flashCount },
      { tone: "send", count: metric.sendCount },
      { tone: "attempted", count: metric.attemptCount },
    ])

    return {
      label: metric.tagLabel,
      totalCount: metric.climbCount,
      outcomes,
    }
  })
}

function selectSummary(categories: ArchetypeCategoryEntry[]) {
  const loggedCategories = categories.filter((category) => !category.missingVolume)
  const strongestCategory = [...categories]
    .filter((category) => !category.missingPerformance)
    .sort((left, right) => right.normalizedPerformanceRadarValue - left.normalizedPerformanceRadarValue)[0]
  const highestVolumeCategory = [...loggedCategories].sort((left, right) => right.totalLoggedCount - left.totalLoggedCount)[0]

  if (!highestVolumeCategory && !strongestCategory) {
    return {
      archetypeLabel: "No archetype yet",
      description: "Log climbs with style tags to build your profile.",
    }
  }

  return {
    archetypeLabel: highestVolumeCategory ? `${highestVolumeCategory.label}-leaning` : `${strongestCategory?.label ?? "Style"} profile`,
    description: strongestCategory && highestVolumeCategory
      ? `Most logged: ${highestVolumeCategory.label}. Strongest sent-grade signal: ${strongestCategory.label}.`
      : "Your profile will sharpen as more tagged climbs are logged.",
  }
}

export function selectArchetypeViewModel(metrics: ArchetypeMetrics, segment: ArchetypeSegment): ArchetypeViewModel {
  const segmentMetrics = getMetricsForSegment(metrics, segment)
  const categories = selectCategories(segmentMetrics)
  const summary = selectSummary(categories)

  return {
    ...summary,
    categories,
    radarAxes: selectRadarAxes(categories),
    performanceScale: { ticks: [] },
    breakdown: selectBreakdown(segmentMetrics),
  }
}
