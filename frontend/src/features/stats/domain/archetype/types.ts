export type ArchetypeSegment = "terrain" | "movement" | "holds"

export type ArchetypeRadarAxis = {
  label: string
  performance: number
  volume: number
}

export type ArchetypePerformanceScaleTick = {
  level: number
  label: string
}

export type ArchetypePerformanceScale = {
  ticks: ArchetypePerformanceScaleTick[]
}

export type ArchetypeTrendItem = {
  label: string
  change: string
}

export type ArchetypeSegmentOption = {
  value: ArchetypeSegment
  label: string
}

export type ArchetypeSegmentModel = {
  archetypeLabel: string
  description: string
  axes: ArchetypeRadarAxis[]
  performanceScale: ArchetypePerformanceScale
  trends: ArchetypeTrendItem[]
}

export type ArchetypeFacetBreakdownItem = {
  label: string
  value: number
  percentageLabel: string
}

export type ArchetypeViewModel = {
  archetypeLabel: string
  description: string
  radarAxes: ArchetypeRadarAxis[]
  performanceScale: ArchetypePerformanceScale
  strengths: ArchetypeFacetBreakdownItem[]
  growthAreas: ArchetypeFacetBreakdownItem[]
  breakdown: ArchetypeFacetBreakdownItem[]
  trends: ArchetypeTrendItem[]
}
