import ProgressionSurface from "../progression/ProgressionSurface"
import type { SessionTrendPoint } from "../../domain/sessions/types"

type SessionsTrendChartProps = {
  points: SessionTrendPoint[]
}

const CHART_WIDTH = 320
const CHART_HEIGHT = 204
const CHART_PADDING = {
  top: 10,
  right: 26,
  bottom: 26,
  left: 26,
}

const BAR_FILL = "color-mix(in srgb, var(--ember) 42%, var(--stone-surface) 58%)"
const LINE_COLOR = "color-mix(in srgb, var(--ember) 92%, white 8%)"
const MAJOR_GRID_COLOR = "color-mix(in srgb, var(--stone-border) 84%, transparent)"
const MINOR_GRID_COLOR = "color-mix(in srgb, var(--stone-border) 66%, transparent)"
const TICK_COLOR = "var(--stone-muted)"
const AXIS_LABEL_COLOR = "var(--stone-secondary)"
const MARKER_OUTLINE_COLOR = "var(--stone-surface)"

function buildLinePath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) {
    return ""
  }

  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ")
}

function formatGradeLabel(value: number) {
  return `V${Math.round(value)}`
}

export default function SessionsTrendChart({ points }: SessionsTrendChartProps) {
  const innerWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right
  const innerHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom
  const maxClimbs = Math.max(...points.map((point) => point.climbs))
  const climbsMax = Math.max(1, Math.ceil(maxClimbs / 4) * 4)
  const gradeFloor = Math.max(0, Math.floor(Math.min(...points.map((point) => point.avgGrade))))
  const gradeCeiling = Math.max(gradeFloor + 1, Math.ceil(Math.max(...points.map((point) => point.avgGrade))))
  const gradeRange = gradeCeiling - gradeFloor
  const gradeTicks = Array.from({ length: gradeCeiling - gradeFloor + 1 }, (_, index) => gradeFloor + index)
  const minorLines = gradeTicks.slice(0, -1).map((tick) => ({
    key: `${tick}-mid`,
    y: CHART_PADDING.top + innerHeight - ((tick + 0.5 - gradeFloor) / gradeRange) * innerHeight,
  }))
  const majorLines = gradeTicks.map((tick) => ({
    tick,
    y: CHART_PADDING.top + innerHeight - ((tick - gradeFloor) / gradeRange) * innerHeight,
  }))
  const climbTicks = [0, climbsMax / 2, climbsMax].map((tick) => ({
    tick,
    y: CHART_PADDING.top + innerHeight - (tick / climbsMax) * innerHeight,
  }))
  const stepWidth = innerWidth / points.length
  const barWidth = Math.min(18, stepWidth * 0.52)
  const chartPoints = points.map((point, index) => {
    const x = CHART_PADDING.left + index * stepWidth + stepWidth / 2
    const barHeight = (point.climbs / climbsMax) * innerHeight
    const y = CHART_PADDING.top + innerHeight - ((point.avgGrade - gradeFloor) / gradeRange) * innerHeight

    return {
      ...point,
      x,
      y,
      barX: x - barWidth / 2,
      barY: CHART_PADDING.top + innerHeight - barHeight,
      barHeight,
    }
  })

  return (
    <ProgressionSurface>
      <div className="flex items-center justify-between gap-4">
        <AxisLegend label="Climbs" color={BAR_FILL} align="left" />
        <AxisLegend label="Avg V-Grade" color={LINE_COLOR} align="right" />
      </div>

      <div className="mt-3">
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="h-auto w-full overflow-visible"
          role="img"
          aria-label="Session trends chart showing climbs and average grade by session"
        >
          {minorLines.map((line) => (
            <line
              key={line.key}
              x1={CHART_PADDING.left}
              x2={CHART_WIDTH - CHART_PADDING.right}
              y1={line.y}
              y2={line.y}
              stroke={MINOR_GRID_COLOR}
              strokeWidth="1"
            />
          ))}

          {majorLines.map((line) => (
            <line
              key={line.tick}
              x1={CHART_PADDING.left}
              x2={CHART_WIDTH - CHART_PADDING.right}
              y1={line.y}
              y2={line.y}
              stroke={MAJOR_GRID_COLOR}
              strokeWidth="1"
            />
          ))}

          {climbTicks.map((line, index) => (
            <text
              key={`climbs-${line.tick}`}
              x={0}
              y={line.y}
              textAnchor="start"
              dominantBaseline={index === 0 ? "ideographic" : index === climbTicks.length - 1 ? "hanging" : "middle"}
              fill={TICK_COLOR}
              className="text-[11px]"
            >
              {line.tick}
            </text>
          ))}

          {majorLines.map((line) => (
            <text
              key={`grade-${line.tick}`}
              x={CHART_WIDTH}
              y={line.y}
              textAnchor="end"
              dominantBaseline="middle"
              fill={TICK_COLOR}
              className="text-[11px]"
            >
              {formatGradeLabel(line.tick)}
            </text>
          ))}

          {chartPoints.map((point) => (
            <rect
              key={point.sessionId}
              x={point.barX}
              y={point.barY}
              width={barWidth}
              height={point.barHeight}
              rx="7"
              fill={BAR_FILL}
              opacity="0.58"
            />
          ))}

          <path
            d={buildLinePath(chartPoints.map(({ x, y }) => ({ x, y })))}
            fill="none"
            stroke={LINE_COLOR}
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {chartPoints.map((point) => (
            <circle
              key={`${point.sessionId}-point`}
              cx={point.x}
              cy={point.y}
              r="5"
              fill={LINE_COLOR}
              stroke={MARKER_OUTLINE_COLOR}
              strokeWidth="2.5"
            />
          ))}

          {chartPoints.map((point) => (
            <text
              key={`${point.sessionId}-tick`}
              x={point.x}
              y={CHART_HEIGHT - 4}
              textAnchor="middle"
              fill={TICK_COLOR}
              className="text-[11px]"
            >
              {point.tickLabel}
            </text>
          ))}
        </svg>
      </div>
    </ProgressionSurface>
  )
}

function AxisLegend({
  label,
  color,
  align,
}: {
  label: string
  color: string
  align: "left" | "right"
}) {
  return (
    <div
      className={`flex items-center gap-2 text-xs font-semibold ${
        align === "right" ? "justify-end text-right" : "text-left"
      }`}
      style={{ color: AXIS_LABEL_COLOR }}
    >
      <span aria-hidden="true" className="block h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: color }} />
      <span>{label}</span>
    </div>
  )
}
