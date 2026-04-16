export type ArchetypeSegment = "terrain" | "movement" | "holds"

export type ArchetypeAxisValue = {
  label: string
  value: number
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
  axes: ArchetypeAxisValue[]
  trends: ArchetypeTrendItem[]
}

export type ArchetypeFacetBreakdownItem = ArchetypeAxisValue & {
  percentageLabel: string
}

export type ArchetypeViewModel = {
  archetypeLabel: string
  description: string
  radarAxes: ArchetypeAxisValue[]
  strengths: ArchetypeFacetBreakdownItem[]
  growthAreas: ArchetypeFacetBreakdownItem[]
  breakdown: ArchetypeFacetBreakdownItem[]
  trends: ArchetypeTrendItem[]
}
