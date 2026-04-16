import type { ArchetypeAxisValue } from "../../domain/archetype/types"

type ArchetypeRadarChartProps = {
  axes: ArchetypeAxisValue[]
}

const SIZE = 284
const CENTER = SIZE / 2
const MAX_RADIUS = 90
const RING_COUNT = 4
const GRID_COLOR = "color-mix(in srgb, var(--stone-border) 84%, transparent)"
const AXIS_COLOR = "color-mix(in srgb, var(--stone-border) 72%, transparent)"
const LABEL_COLOR = "var(--stone-secondary)"
const FILL_COLOR = "color-mix(in srgb, var(--ember) 26%, transparent)"
const STROKE_COLOR = "var(--ember)"
const DOT_FILL = "color-mix(in srgb, var(--ember) 92%, white 8%)"
const DOT_STROKE = "var(--stone-surface)"

function polarToCartesian(angleRadians: number, radius: number) {
  return {
    x: CENTER + Math.cos(angleRadians) * radius,
    y: CENTER + Math.sin(angleRadians) * radius,
  }
}

function toPolygonPath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) {
    return ""
  }

  return `${points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ")} Z`
}

export default function ArchetypeRadarChart({ axes }: ArchetypeRadarChartProps) {
  const angleStep = (Math.PI * 2) / axes.length
  const startAngle = -Math.PI / 2
  const ringLevels = Array.from({ length: RING_COUNT }, (_, index) => (index + 1) / RING_COUNT)
  const plottedPoints = axes.map((axis, index) => {
    const angle = startAngle + angleStep * index
    const radius = (axis.value / 100) * MAX_RADIUS
    const axisEnd = polarToCartesian(angle, MAX_RADIUS)
    const point = polarToCartesian(angle, radius)
    const labelPosition = polarToCartesian(angle, MAX_RADIUS + 26)

    return {
      ...axis,
      axisEnd,
      point,
      labelPosition,
    }
  })

  return (
    <div className="mx-auto w-full max-w-[320px]">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="h-auto w-full overflow-visible"
        role="img"
        aria-label="Archetype radar chart"
      >
        {ringLevels.map((level) => {
          const points = plottedPoints.map((_, index) => {
            const angle = startAngle + angleStep * index
            return polarToCartesian(angle, MAX_RADIUS * level)
          })

          return (
            <path
              key={level}
              d={toPolygonPath(points)}
              fill="none"
              stroke={GRID_COLOR}
              strokeWidth={level === ringLevels.length ? 1.25 : 1}
            />
          )
        })}

        {plottedPoints.map((axis) => (
          <line
            key={`${axis.label}-axis`}
            x1={CENTER}
            y1={CENTER}
            x2={axis.axisEnd.x}
            y2={axis.axisEnd.y}
            stroke={AXIS_COLOR}
            strokeWidth="1"
          />
        ))}

        <path d={toPolygonPath(plottedPoints.map((axis) => axis.point))} fill={FILL_COLOR} stroke={STROKE_COLOR} strokeWidth="2.5" />

        {plottedPoints.map((axis) => (
          <circle
            key={`${axis.label}-point`}
            cx={axis.point.x}
            cy={axis.point.y}
            r="4.5"
            fill={DOT_FILL}
            stroke={DOT_STROKE}
            strokeWidth="2"
          />
        ))}

        {plottedPoints.map((axis) => (
          <text
            key={`${axis.label}-label`}
            x={axis.labelPosition.x}
            y={axis.labelPosition.y}
            textAnchor={
              axis.labelPosition.x < CENTER - 8 ? "end" : axis.labelPosition.x > CENTER + 8 ? "start" : "middle"
            }
            dominantBaseline="middle"
            fill={LABEL_COLOR}
            className="text-[11px] font-medium"
          >
            {axis.label}
          </text>
        ))}
      </svg>
    </div>
  )
}
