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
    performanceScale: {
      ticks: [
        { level: 25, label: "V3" },
        { level: 50, label: "V5" },
        { level: 75, label: "V7" },
        { level: 100, label: "V9" },
      ],
    },
    axes: [
      { label: "Slab", performance: 28, volume: 22 },
      { label: "Vertical", performance: 56, volume: 49 },
      { label: "Overhang", performance: 82, volume: 74 },
      { label: "Cave", performance: 67, volume: 58 },
    ],
    trends: [
      { label: "More overhang", change: "+12%" },
      { label: "Less slab", change: "-8%" },
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
    axes: [
      { label: "Static", performance: 38, volume: 31 },
      { label: "Dynamic", performance: 79, volume: 70 },
      { label: "Coordination", performance: 72, volume: 61 },
      { label: "Balance", performance: 44, volume: 39 },
      { label: "Power", performance: 68, volume: 63 },
    ],
    trends: [
      { label: "More dynamic", change: "+12%" },
      { label: "More power", change: "+6%" },
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
    axes: [
      { label: "Crimp", performance: 84, volume: 76 },
      { label: "Sloper", performance: 36, volume: 29 },
      { label: "Pinch", performance: 62, volume: 57 },
      { label: "Pocket", performance: 48, volume: 42 },
      { label: "Jug", performance: 58, volume: 51 },
      { label: "Volume", performance: 41, volume: 46 },
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
  const sorted = [...model.axes].sort((left, right) => right.performance - left.performance)

  return {
    archetypeLabel: model.archetypeLabel,
    description: model.description,
    radarAxes: model.axes,
    performanceScale: model.performanceScale,
    strengths: sorted.slice(0, 3).map((item) => toBreakdownItem(item.label, item.performance)),
    growthAreas: sorted.slice(-2).reverse().map((item) => toBreakdownItem(item.label, item.performance)),
    breakdown: model.axes.map((item) => toBreakdownItem(item.label, item.performance)),
    trends: model.trends,
  }
}
