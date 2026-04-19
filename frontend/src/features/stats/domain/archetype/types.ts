export type ArchetypeSegment = "terrain" | "movement" | "holds"

export type ArchetypeRadarAxisMetrics = {
  label: string
  performance: number
  volume: number
}

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

export type ArchetypeSegmentOption = {
  value: ArchetypeSegment
  label: string
}

export type ArchetypeSegmentModel = {
  archetypeLabel: string
  description: string
  axes: ArchetypeRadarAxisMetrics[]
  performanceScale: ArchetypePerformanceScale
  categoryOutcomes: ArchetypeCategoryOutcomeCounts[]
}

export type ArchetypeViewModel = {
  archetypeLabel: string
  description: string
  radarAxes: ArchetypeRadarAxis[]
  performanceScale: ArchetypePerformanceScale
  breakdown: ArchetypeCategoryOutcomeBreakdownItem[]
}
