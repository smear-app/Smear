import ProgressionSurface from "./ProgressionSurface"
import { buildWorkingGradeAxis } from "../../domain/charts/workingGradeAxis"
import type { ProgressionChartPoint } from "../../domain/progression/types"

type ProgressionChartCardProps = {
  points: ProgressionChartPoint[]
}

const CHART_WIDTH = 320
const CHART_HEIGHT = 216
const CHART_PADDING = {
  top: 8,
  right: 24,
  bottom: 18,
  left: 24,
}

const BAR_FILL = "color-mix(in srgb, var(--ember) 48%, var(--stone-surface) 52%)"
const BAR_OPACITY = 0.58
const LINE_COLOR = "color-mix(in srgb, var(--ember) 92%, white 8%)"
const BRIDGE_LINE_COLOR = "color-mix(in srgb, var(--ember) 74%, var(--stone-muted) 26%)"
const MAJOR_GRID_COLOR = "color-mix(in srgb, var(--stone-border) 86%, transparent)"
const MINOR_GRID_COLOR = "color-mix(in srgb, var(--stone-border) 68%, transparent)"
const TICK_COLOR = "var(--stone-muted)"
const AXIS_LABEL_COLOR = "var(--stone-secondary)"
const MARKER_OUTLINE_COLOR = "var(--stone-surface)"

function buildLinePath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) {
    return ""
  }

  return points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ")
}

function buildLineSegments(points: Array<{ x: number; y: number | null }>) {
  return points.reduce<Array<Array<{ x: number; y: number }>>>((segments, point) => {
    if (point.y === null) {
      return [...segments, []]
    }

    const nextSegments = segments.length === 0 ? [[]] : segments
    nextSegments[nextSegments.length - 1].push({ x: point.x, y: point.y })
    return nextSegments
  }, []).filter((segment) => segment.length > 0)
}

function buildGapBridgeSegments(points: Array<{ x: number; y: number | null }>) {
  const bridges: Array<Array<{ x: number; y: number }>> = []
  let previousObserved: { point: { x: number; y: number }; index: number } | null = null

  points.forEach((point, index) => {
    if (point.y === null) {
      return
    }

    if (previousObserved && index - previousObserved.index > 1) {
      bridges.push([
        previousObserved.point,
        { x: point.x, y: point.y },
      ])
    }

    previousObserved = {
      point: { x: point.x, y: point.y },
      index,
    }
  })

  return bridges
}

function buildLeftAxisTicks(maxValue: number) {
  const intervalCount = 4
  const rawStep = Math.max(1, Math.ceil(maxValue / intervalCount))
  const paddedMax = rawStep * intervalCount
  const ticks = Array.from({ length: intervalCount + 1 }, (_, index) => rawStep * index)

  return {
    paddedMax,
    ticks,
  }
}

export default function ProgressionChartCard({
  points,
}: ProgressionChartCardProps) {
  const innerWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right
  const innerHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom
  const maxClimbs = Math.max(0, ...points.map((point) => point.barClimbs ?? point.climbs))
  const { paddedMax: paddedMaxClimbs, ticks: climbAxisTicks } = buildLeftAxisTicks(Math.ceil(maxClimbs * 1.05))
  const gradeValues = points.flatMap((point) =>
    point.avgGrade !== null && Number.isFinite(point.avgGrade) ? [point.avgGrade] : [],
  )
  const gradeAxis = buildWorkingGradeAxis(gradeValues)
  const stepWidth = points.length === 0 ? innerWidth : innerWidth / points.length
  const barWidth = Math.min(18, stepWidth * 0.56)
  const chartPoints = points.map((point, index) => {
    const barClimbs = point.barClimbs ?? point.climbs
    const x = CHART_PADDING.left + index * stepWidth + stepWidth / 2
    const barHeight = (barClimbs / paddedMaxClimbs) * innerHeight
    const y = point.avgGrade === null
      ? null
      : CHART_PADDING.top + innerHeight - ((point.avgGrade - gradeAxis.domainMin) / gradeAxis.domainRange) * innerHeight

    return {
      ...point,
      barClimbs,
      x,
      y,
      barX: x - barWidth / 2,
      barY: CHART_PADDING.top + innerHeight - barHeight,
      barHeight,
    }
  })
  const lineSegments = buildLineSegments(chartPoints.map(({ x, y }) => ({ x, y })))
  const bridgeSegments = buildGapBridgeSegments(chartPoints.map(({ x, y }) => ({ x, y })))
  const majorGridLines = gradeAxis.ticks.map((tick) => ({
    tick,
    y: CHART_PADDING.top + innerHeight - ((tick - gradeAxis.domainMin) / gradeAxis.domainRange) * innerHeight,
  }))
  const minorGridLines = gradeAxis.ticks.slice(0, -1).map((tick) => ({
    key: `${tick}-mid`,
    y: CHART_PADDING.top + innerHeight - ((tick + 0.5 - gradeAxis.domainMin) / gradeAxis.domainRange) * innerHeight,
  }))
  const leftAxisLabelPositions = climbAxisTicks.map((tick) => ({
    tick,
    y: CHART_PADDING.top + innerHeight - (tick / paddedMaxClimbs) * innerHeight,
  }))

  return (
    <ProgressionSurface>
      <div className="flex items-center justify-between gap-4">
        <AxisLegendLabel label="Climbs" color={BAR_FILL} align="left" />
        <AxisLegendLabel label="Working Grade" color={LINE_COLOR} align="right" />
      </div>

      <div className="mt-3">
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="h-auto w-full overflow-visible"
          role="img"
          aria-label="Progression chart showing climbs as bars and working grade as a line"
        >
          {minorGridLines.map((line) => (
            <line
              key={line.key}
              x1={CHART_PADDING.left}
              x2={CHART_WIDTH - CHART_PADDING.right}
              y1={line.y}
              y2={line.y}
              stroke={MINOR_GRID_COLOR}
              strokeWidth="1"
              opacity="0.82"
            />
          ))}

          {majorGridLines.map((line) => (
            <line
              key={line.tick}
              x1={CHART_PADDING.left}
              x2={CHART_WIDTH - CHART_PADDING.right}
              y1={line.y}
              y2={line.y}
              stroke={MAJOR_GRID_COLOR}
              strokeWidth="1"
              opacity="1"
            />
          ))}

          {leftAxisLabelPositions.map((line) => (
            <text
              key={`climbs-${line.tick}`}
              x={0}
              y={line.y}
              textAnchor="start"
              dominantBaseline={line.tick === 0 ? "ideographic" : line.tick === paddedMaxClimbs ? "hanging" : "middle"}
              fill={TICK_COLOR}
              className="text-[11px]"
            >
              {line.tick}
            </text>
          ))}

          {majorGridLines.map((line) => (
            <text
              key={`${line.tick}-label`}
              x={CHART_WIDTH}
              y={line.y}
              textAnchor="end"
              dominantBaseline="middle"
              fill={TICK_COLOR}
              className="text-[11px]"
            >
              {gradeAxis.formatTick(line.tick)}
            </text>
          ))}

          {chartPoints.map((point) => (
            point.barClimbs <= 0 ? null : (
              <rect
                key={point.label}
                x={point.barX}
                y={point.barY}
                width={barWidth}
                height={point.barHeight}
                rx="7"
                fill={BAR_FILL}
                opacity={BAR_OPACITY}
              />
            )
          ))}

          {lineSegments.map((segment, index) => (
            <path
              key={`line-${index}`}
              d={buildLinePath(segment)}
              fill="none"
              stroke={LINE_COLOR}
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {bridgeSegments.map((segment, index) => (
            <path
              key={`bridge-${index}`}
              d={buildLinePath(segment)}
              fill="none"
              stroke={BRIDGE_LINE_COLOR}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="2 8"
            />
          ))}

          {chartPoints.map((point) => (
            point.y === null ? null : (
              <g key={`${point.label}-dot`}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="5.5"
                  fill={LINE_COLOR}
                  stroke={MARKER_OUTLINE_COLOR}
                  strokeWidth="2.5"
                />
              </g>
            )
          ))}

          {chartPoints.map((point) => (
            <text
              key={`${point.label}-tick`}
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

function AxisLegendLabel({
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
      <span
        aria-hidden="true"
        className="block h-2.5 w-2.5 rounded-[3px]"
        style={{ backgroundColor: color }}
      />
      <span>{label}</span>
    </div>
  )
}
