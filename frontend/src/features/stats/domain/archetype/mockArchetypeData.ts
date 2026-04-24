import type {
  ArchetypeCategoryOutcomeBreakdownItem,
  ArchetypeCategoryOutcomeCounts,
  ArchetypeOutcomeCount,
  ArchetypeOutcomeBreakdownSegment,
  ArchetypeOutcomeTone,
  ArchetypePerformanceScale,
  ArchetypeRadarAxis,
  ArchetypeRadarAxisDisplay,
  ArchetypeRadarAxisMetrics,
  ArchetypeSegment,
  ArchetypeSegmentModel,
  ArchetypeSegmentOption,
  ArchetypeViewModel,
} from "./types"
import { getArchetypeAxisLabels, getArchetypeSegmentOptions } from "./tagTaxonomy"

export const archetypeSegmentOptions: ArchetypeSegmentOption[] = getArchetypeSegmentOptions()

const archetypeSegmentData: Record<ArchetypeSegment, ArchetypeSegmentModel> = {
  terrain: {
    archetypeLabel: "Overhang-focused",
    description: "You spend most of your time on steep terrain and tend to thrive when movement gets powerful.",
    performanceScale: {
      ticks: [
        { level: 25, label: "V3" },
        { level: 50, label: "V5" },
        { level: 75, label: "V7" },
        { level: 100, label: "V9" },
      ],
    },
    axisMetricsByTag: {
      Slab: { performance: 28, volume: 22 },
      Vertical: { performance: 56, volume: 49 },
      Overhang: { performance: 82, volume: 74 },
      Cave: { performance: 67, volume: 58 },
    },
    categoryOutcomes: [
      {
        label: "Slab",
        outcomes: [
          { tone: "flash", count: 2 },
          { tone: "send", count: 5 },
          { tone: "attempted", count: 5 },
        ],
      },
      {
        label: "Vertical",
        outcomes: [
          { tone: "flash", count: 3 },
          { tone: "send", count: 6 },
          { tone: "attempted", count: 4 },
        ],
      },
      {
        label: "Overhang",
        outcomes: [
          { tone: "flash", count: 4 },
          { tone: "send", count: 5 },
          { tone: "attempted", count: 3 },
        ],
      },
      {
        label: "Cave",
        outcomes: [
          { tone: "flash", count: 2 },
          { tone: "send", count: 2 },
          { tone: "attempted", count: 3 },
        ],
      },
    ],
  },
  movement: {
    archetypeLabel: "Dynamic / Coordination",
    description: "You favor explosive movement and coordination-heavy sequences more than slow static tension climbing.",
    performanceScale: {
      ticks: [
        { level: 25, label: "V2" },
        { level: 50, label: "V4" },
        { level: 75, label: "V6" },
        { level: 100, label: "V8" },
      ],
    },
    axisMetricsByTag: {
      Dynamic: { performance: 79, volume: 70 },
      Static: { performance: 38, volume: 31 },
      Coordination: { performance: 72, volume: 61 },
    },
    categoryOutcomes: [
      {
        label: "Static",
        outcomes: [
          { tone: "flash", count: 1 },
          { tone: "send", count: 4 },
          { tone: "attempted", count: 5 },
        ],
      },
      {
        label: "Dynamic",
        outcomes: [
          { tone: "flash", count: 2 },
          { tone: "send", count: 5 },
          { tone: "attempted", count: 2 },
        ],
      },
      {
        label: "Coordination",
        outcomes: [
          { tone: "flash", count: 2 },
          { tone: "send", count: 4 },
          { tone: "attempted", count: 2 },
        ],
      },
    ],
  },
  holds: {
    archetypeLabel: "Crimp dominant",
    description: "You look most comfortable on precise, finger-driven grips and less natural on open-handed terrain.",
    performanceScale: {
      ticks: [
        { level: 25, label: "V2" },
        { level: 50, label: "V4" },
        { level: 75, label: "V5" },
        { level: 100, label: "V7" },
      ],
    },
    axisMetricsByTag: {
      Crimp: { performance: 84, volume: 76 },
      Sloper: { performance: 36, volume: 29 },
      Pinch: { performance: 62, volume: 57 },
      Pocket: { performance: 48, volume: 42 },
      Jug: { performance: 58, volume: 51 },
      Volume: { performance: 41, volume: 46 },
      Undercling: { performance: 54, volume: 37 },
    },
    categoryOutcomes: [
      {
        label: "Crimp",
        outcomes: [
          { tone: "flash", count: 4 },
          { tone: "send", count: 5 },
          { tone: "attempted", count: 2 },
        ],
      },
      {
        label: "Sloper",
        outcomes: [
          { tone: "flash", count: 1 },
          { tone: "send", count: 3 },
          { tone: "attempted", count: 4 },
        ],
      },
      {
        label: "Pinch",
        outcomes: [
          { tone: "flash", count: 3 },
          { tone: "send", count: 4 },
          { tone: "attempted", count: 1 },
        ],
      },
      {
        label: "Pocket",
        outcomes: [
          { tone: "flash", count: 2 },
          { tone: "send", count: 3 },
          { tone: "attempted", count: 1 },
        ],
      },
      {
        label: "Jug",
        outcomes: [
          { tone: "flash", count: 2 },
          { tone: "send", count: 4 },
          { tone: "attempted", count: 1 },
        ],
      },
      {
        label: "Volume",
        outcomes: [
          { tone: "flash", count: 2 },
          { tone: "send", count: 2 },
          { tone: "attempted", count: 1 },
        ],
      },
      {
        label: "Undercling",
        outcomes: [
          { tone: "flash", count: 1 },
          { tone: "send", count: 3 },
          { tone: "attempted", count: 2 },
        ],
      },
    ],
  },
  mechanics: {
    archetypeLabel: "Balance / Power",
    description: "Your mechanics profile compares balance, power, and dyno-style movement.",
    performanceScale: {
      ticks: [
        { level: 25, label: "V2" },
        { level: 50, label: "V4" },
        { level: 75, label: "V6" },
        { level: 100, label: "V8" },
      ],
    },
    axisMetricsByTag: {
      Balance: { performance: 64, volume: 58 },
      Power: { performance: 72, volume: 66 },
      Dyno: { performance: 48, volume: 39 },
    },
    categoryOutcomes: [
      {
        label: "Balance",
        outcomes: [
          { tone: "flash", count: 2 },
          { tone: "send", count: 4 },
          { tone: "attempted", count: 2 },
        ],
      },
      {
        label: "Power",
        outcomes: [
          { tone: "flash", count: 3 },
          { tone: "send", count: 5 },
          { tone: "attempted", count: 3 },
        ],
      },
      {
        label: "Dyno",
        outcomes: [
          { tone: "flash", count: 1 },
          { tone: "send", count: 2 },
          { tone: "attempted", count: 3 },
        ],
      },
    ],
  },
}

const OUTCOME_LABELS: Record<ArchetypeOutcomeTone, string> = {
  flash: "Flash",
  send: "Send",
  attempted: "Attempted",
}

const OUTCOME_ORDER: ArchetypeOutcomeTone[] = ["flash", "send", "attempted"]
const RADAR_METADATA_SEPARATOR = "•"

function toVGradeNumber(label: string) {
  const match = /^V(\d+)$/.exec(label)

  return match ? Number(match[1]) : null
}

function formatPerformanceGrade(value: number, performanceScale: ArchetypePerformanceScale) {
  const ticks = [...performanceScale.ticks].sort((left, right) => left.level - right.level)

  if (ticks.length === 0) {
    return `V${Math.round(value)}`
  }

  const fallbackTick = ticks.reduce((closest, tick) => {
    return Math.abs(tick.level - value) < Math.abs(closest.level - value) ? tick : closest
  }, ticks[0])

  if (value <= ticks[0].level) {
    return ticks[0].label
  }

  const lastTick = ticks[ticks.length - 1]

  if (value >= lastTick.level) {
    return lastTick.label
  }

  for (let index = 1; index < ticks.length; index += 1) {
    const lowerTick = ticks[index - 1]
    const upperTick = ticks[index]

    if (value <= upperTick.level) {
      const lowerGrade = toVGradeNumber(lowerTick.label)
      const upperGrade = toVGradeNumber(upperTick.label)

      if (lowerGrade === null || upperGrade === null) {
        return fallbackTick.label
      }

      const progress = (value - lowerTick.level) / (upperTick.level - lowerTick.level)
      const grade = Math.round(lowerGrade + (upperGrade - lowerGrade) * progress)

      return `V${grade}`
    }
  }

  return fallbackTick.label
}

export function formatArchetypeRadarAxisDisplay(
  axis: ArchetypeRadarAxisMetrics,
  performanceScale: ArchetypePerformanceScale,
  volumeCount: number,
): ArchetypeRadarAxisDisplay {
  return {
    performanceLabel: formatPerformanceGrade(axis.performance, performanceScale),
    volumeLabel: String(volumeCount),
    metadataSeparator: RADAR_METADATA_SEPARATOR,
  }
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

function toCategoryOutcomeBreakdownItems(
  axisLabels: string[],
  categoryOutcomes: ArchetypeCategoryOutcomeCounts[],
): ArchetypeCategoryOutcomeBreakdownItem[] {
  const outcomesByLabel = new Map(categoryOutcomes.map((item) => [item.label, item.outcomes]))

  return axisLabels.map((label) => {
    const outcomes = toOutcomeBreakdownSegments(outcomesByLabel.get(label) ?? [])

    return {
      label,
      totalCount: outcomes.reduce((sum, outcome) => sum + outcome.count, 0),
      outcomes,
    }
  })
}

function toVolumeCountByLabel(categoryOutcomes: ArchetypeCategoryOutcomeCounts[]) {
  return new Map(
    categoryOutcomes.map((item) => [
      item.label,
      item.outcomes.reduce((sum, outcome) => sum + outcome.count, 0),
    ]),
  )
}

function toRadarAxes(segment: ArchetypeSegment, model: ArchetypeSegmentModel): ArchetypeRadarAxis[] {
  const volumeCountByLabel = toVolumeCountByLabel(model.categoryOutcomes)

  return getArchetypeAxisLabels(segment).map((label) => {
    const metrics = model.axisMetricsByTag[label] ?? { performance: 0, volume: 0 }
    const axis = { label, ...metrics }

    return {
      ...axis,
      display: formatArchetypeRadarAxisDisplay(axis, model.performanceScale, volumeCountByLabel.get(axis.label) ?? 0),
    }
  })
}

export function buildArchetypeViewModel(segment: ArchetypeSegment): ArchetypeViewModel {
  const model = archetypeSegmentData[segment]
  const radarAxes = toRadarAxes(segment, model)
  const volumeCountByLabel = toVolumeCountByLabel(model.categoryOutcomes)

  return {
    archetypeLabel: model.archetypeLabel,
    description: model.description,
    categories: radarAxes.map((axis) => ({
      categoryKey: axis.label.toLowerCase(),
      label: axis.label,
      sentCount: 0,
      totalLoggedCount: volumeCountByLabel.get(axis.label) ?? 0,
      workingGradeValue: null,
      workingGradeSourceValues: [],
      workingGradeDisplayValue: axis.display.performanceLabel,
      volumeDisplayValue: axis.display.volumeLabel,
      normalizedPerformanceRadarValue: axis.performance,
      normalizedVolumeRadarValue: axis.volume,
      missingPerformance: false,
      missingVolume: (volumeCountByLabel.get(axis.label) ?? 0) === 0,
    })),
    radarAxes,
    performanceScale: model.performanceScale,
    breakdown: toCategoryOutcomeBreakdownItems(
      radarAxes.map((axis) => axis.label),
      model.categoryOutcomes,
    ),
  }
}
