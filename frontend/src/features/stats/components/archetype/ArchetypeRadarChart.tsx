import type { ArchetypePerformanceScale, ArchetypeRadarAxis } from "../../domain/archetype/types"

type ArchetypeRadarChartProps = {
  axes: ArchetypeRadarAxis[]
  performanceScale: ArchetypePerformanceScale
}

const WIDTH = 320
const HEIGHT = 286
const CENTER_X = WIDTH / 2
const CENTER_Y = 136
const MAX_RADIUS = 106
const LABEL_OFFSET = 14
const RING_COUNT = 4
const GRID_COLOR = "color-mix(in srgb, var(--stone-border) 84%, transparent)"
const AXIS_COLOR = "color-mix(in srgb, var(--stone-border) 72%, transparent)"
const LABEL_COLOR = "var(--stone-text)"
const SCALE_LABEL_COLOR = "var(--stone-muted)"
const PERFORMANCE_SCALE_COLOR = "color-mix(in srgb, var(--ember) 76%, var(--stone-text) 24%)"
const LABEL_HALO = "var(--stone-surface)"
const PERFORMANCE_FILL = "color-mix(in srgb, var(--ember) 26%, transparent)"
const PERFORMANCE_STROKE = "var(--ember)"
const PERFORMANCE_DOT_FILL = "color-mix(in srgb, var(--ember) 92%, white 8%)"
const VOLUME_STROKE = "color-mix(in srgb, var(--stone-secondary) 78%, var(--stone-border) 22%)"
const VOLUME_FILL = "var(--stone-secondary)"
const DOT_STROKE = "var(--stone-surface)"
const SCALE_LEVELS = Array.from({ length: RING_COUNT }, (_, index) => ((index + 1) / RING_COUNT) * 100)
const SHARED_SCALE_X = CENTER_X - 8
const PERFORMANCE_SCALE_X = CENTER_X + 8

function textHaloProps(fill: string) {
  return {
    fill,
    stroke: LABEL_HALO,
    strokeWidth: 3.25,
    paintOrder: "stroke fill" as const,
    strokeLinejoin: "round" as const,
    strokeLinecap: "round" as const,
  }
}

function polarToCartesian(angleRadians: number, radius: number) {
  return {
    x: CENTER_X + Math.cos(angleRadians) * radius,
    y: CENTER_Y + Math.sin(angleRadians) * radius,
  }
}

function toPolygonPath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) {
    return ""
  }

  return `${points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ")} Z`
}

export default function ArchetypeRadarChart({ axes, performanceScale }: ArchetypeRadarChartProps) {
  const angleStep = (Math.PI * 2) / axes.length
  const startAngle = -Math.PI / 2
  const ringLevels = Array.from({ length: RING_COUNT }, (_, index) => (index + 1) / RING_COUNT)
  const plottedPoints = axes.map((axis, index) => {
    const angle = startAngle + angleStep * index
    const axisEnd = polarToCartesian(angle, MAX_RADIUS)
    const performancePoint = polarToCartesian(angle, (axis.performance / 100) * MAX_RADIUS)
    const volumePoint = polarToCartesian(angle, (axis.volume / 100) * MAX_RADIUS)
    const labelPosition = polarToCartesian(angle, MAX_RADIUS + LABEL_OFFSET)

    return {
      ...axis,
      axisEnd,
      performancePoint,
      volumePoint,
      labelPosition,
    }
  })

  return (
    <div className="mx-auto w-full max-w-[348px]">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
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
              strokeWidth={level === ringLevels.length ? 1.35 : level >= 0.75 ? 1.1 : 1}
            />
          )
        })}

        {plottedPoints.map((axis) => (
          <line
            key={`${axis.label}-axis`}
            x1={CENTER_X}
            y1={CENTER_Y}
            x2={axis.axisEnd.x}
            y2={axis.axisEnd.y}
            stroke={AXIS_COLOR}
            strokeWidth="1"
          />
        ))}

        <path
          d={toPolygonPath(plottedPoints.map((axis) => axis.volumePoint))}
          fill={VOLUME_FILL}
          fillOpacity="0.08"
          stroke="none"
        />

        <path
          d={toPolygonPath(plottedPoints.map((axis) => axis.volumePoint))}
          fill="none"
          stroke={VOLUME_STROKE}
          strokeWidth="1.75"
          strokeLinejoin="round"
        />

        <path
          d={toPolygonPath(plottedPoints.map((axis) => axis.performancePoint))}
          fill={PERFORMANCE_FILL}
          stroke="none"
        />

        <path
          d={toPolygonPath(plottedPoints.map((axis) => axis.performancePoint))}
          fill="none"
          stroke={PERFORMANCE_STROKE}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {plottedPoints.map((axis) => (
          <circle
            key={`${axis.label}-point`}
            cx={axis.performancePoint.x}
            cy={axis.performancePoint.y}
            r="4.5"
            fill={PERFORMANCE_DOT_FILL}
            stroke={DOT_STROKE}
            strokeWidth="2"
          />
        ))}

        <g aria-hidden="true" pointerEvents="none">
          {SCALE_LEVELS.map((scaleValue) => {
            const radius = (scaleValue / 100) * MAX_RADIUS
            const position = polarToCartesian(startAngle, radius)

            return (
              <text
                key={`shared-scale-${scaleValue}`}
                x={SHARED_SCALE_X}
                y={position.y}
                textAnchor="end"
                dominantBaseline="middle"
                className="text-[9.5px] font-semibold"
                {...textHaloProps(SCALE_LABEL_COLOR)}
              >
                {scaleValue}
              </text>
            )
          })}

          {performanceScale.ticks.map((tick) => {
            const position = polarToCartesian(startAngle, (tick.level / 100) * MAX_RADIUS)

            return (
              <text
                key={`performance-scale-${tick.level}`}
                x={PERFORMANCE_SCALE_X}
                y={position.y}
                textAnchor="start"
                dominantBaseline="middle"
                className="text-[9.5px] font-semibold"
                {...textHaloProps(PERFORMANCE_SCALE_COLOR)}
              >
                {tick.label}
              </text>
            )
          })}
        </g>

        {plottedPoints.map((axis) => (
          <text
            key={`${axis.label}-label`}
            x={axis.labelPosition.x}
            y={axis.labelPosition.y}
            textAnchor={
              axis.labelPosition.x < CENTER_X - 8 ? "end" : axis.labelPosition.x > CENTER_X + 8 ? "start" : "middle"
            }
            dominantBaseline="middle"
            fill={LABEL_COLOR}
            className="text-[12px] font-semibold"
          >
            {axis.label}
          </text>
        ))}
      </svg>
    </div>
  )
}
