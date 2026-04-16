import type {
  ArchetypeFacetBreakdownItem,
  ArchetypeSegment,
  ArchetypeSegmentModel,
  ArchetypeSegmentOption,
  ArchetypeViewModel,
} from "./types"

export const archetypeSegmentOptions: ArchetypeSegmentOption[] = [
  { value: "terrain", label: "Terrain" },
  { value: "movement", label: "Movement" },
  { value: "holds", label: "Holds" },
]

const archetypeSegmentData: Record<ArchetypeSegment, ArchetypeSegmentModel> = {
  terrain: {
    archetypeLabel: "Overhang-focused",
    description: "You spend most of your time on steep terrain and tend to thrive when movement gets powerful.",
    axes: [
      { label: "Slab", value: 28 },
      { label: "Vertical", value: 56 },
      { label: "Overhang", value: 82 },
      { label: "Cave", value: 67 },
    ],
    trends: [
      { label: "More overhang", change: "+12%" },
      { label: "Less slab", change: "-8%" },
    ],
  },
  movement: {
    archetypeLabel: "Dynamic / Coordination",
    description: "You favor explosive movement and coordination-heavy sequences more than slow static tension climbing.",
    axes: [
      { label: "Static", value: 38 },
      { label: "Dynamic", value: 79 },
      { label: "Coordination", value: 72 },
      { label: "Balance", value: 44 },
      { label: "Power", value: 68 },
    ],
    trends: [
      { label: "More dynamic", change: "+12%" },
      { label: "More power", change: "+6%" },
    ],
  },
  holds: {
    archetypeLabel: "Crimp dominant",
    description: "You look most comfortable on precise, finger-driven grips and less natural on open-handed terrain.",
    axes: [
      { label: "Crimp", value: 84 },
      { label: "Sloper", value: 36 },
      { label: "Pinch", value: 62 },
      { label: "Pocket", value: 48 },
      { label: "Jug", value: 58 },
      { label: "Volume", value: 41 },
    ],
    trends: [
      { label: "More pinch", change: "+9%" },
      { label: "Less sloper", change: "-7%" },
    ],
  },
}

function toBreakdownItem(label: string, value: number): ArchetypeFacetBreakdownItem {
  return {
    label,
    value,
    percentageLabel: `${value}%`,
  }
}

export function buildArchetypeViewModel(segment: ArchetypeSegment): ArchetypeViewModel {
  const model = archetypeSegmentData[segment]
  const sorted = [...model.axes].sort((left, right) => right.value - left.value)

  return {
    archetypeLabel: model.archetypeLabel,
    description: model.description,
    radarAxes: model.axes,
    strengths: sorted.slice(0, 3).map((item) => toBreakdownItem(item.label, item.value)),
    growthAreas: sorted.slice(-2).reverse().map((item) => toBreakdownItem(item.label, item.value)),
    breakdown: model.axes.map((item) => toBreakdownItem(item.label, item.value)),
    trends: model.trends,
  }
}
