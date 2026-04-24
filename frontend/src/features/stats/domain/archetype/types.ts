export type ArchetypeSegment = "terrain" | "movement" | "holds" | "mechanics"

export type ArchetypeRadarAxisMetrics = {
  label: string
  performance: number
  volume: number
}

export type ArchetypeRadarAxisMetricValues = Omit<ArchetypeRadarAxisMetrics, "label">

export type ArchetypeRadarAxisDisplay = {
  performanceLabel: string
  volumeLabel: string
  metadataSeparator: string
}

export type ArchetypeRadarAxis = ArchetypeRadarAxisMetrics & {
  display: ArchetypeRadarAxisDisplay
}

export type ArchetypePerformanceScaleTick = {
  level: number
  label: string
}

export type ArchetypePerformanceScale = {
  ticks: ArchetypePerformanceScaleTick[]
}

export type ArchetypeOutcomeTone = "flash" | "send" | "attempted"

export type ArchetypeOutcomeCount = {
  tone: ArchetypeOutcomeTone
  count: number
}

export type ArchetypeOutcomeBreakdownSegment = {
  tone: ArchetypeOutcomeTone
  label: string
  count: number
  percentage: number
  percentageLabel: string
}

export type ArchetypeCategoryOutcomeCounts = {
  label: string
  outcomes: ArchetypeOutcomeCount[]
}

export type ArchetypeCategoryOutcomeBreakdownItem = {
  label: string
  totalCount: number
  outcomes: ArchetypeOutcomeBreakdownSegment[]
}

export type ArchetypeCategoryEntry = {
  categoryKey: string
  label: string
  sentCount: number
  totalLoggedCount: number
  workingGradeValue: number | null
  workingGradeSourceValues: number[]
  workingGradeDisplayValue: string
  volumeDisplayValue: string
  normalizedPerformanceRadarValue: number
  normalizedVolumeRadarValue: number
  missingPerformance: boolean
  missingVolume: boolean
}

export type ArchetypeSegmentOption = {
  value: ArchetypeSegment
  label: string
}

export type ArchetypeSegmentModel = {
  archetypeLabel: string
  description: string
  axisMetricsByTag: Record<string, ArchetypeRadarAxisMetricValues>
  performanceScale: ArchetypePerformanceScale
  categoryOutcomes: ArchetypeCategoryOutcomeCounts[]
}

export type ArchetypeViewModel = {
  archetypeLabel: string
  description: string
  categories: ArchetypeCategoryEntry[]
  radarAxes: ArchetypeRadarAxis[]
  performanceScale: ArchetypePerformanceScale
  breakdown: ArchetypeCategoryOutcomeBreakdownItem[]
}
