import ProgressionSurface from "./ProgressionSurface"
import type { ProgressionChartPoint } from "../../domain/progression/types"

type ProgressionChartCardProps = {
  points: ProgressionChartPoint[]
}

const CHART_WIDTH = 320
const CHART_HEIGHT = 188
const CHART_PADDING = {
  top: 18,
  right: 30,
  bottom: 28,
  left: 30,
}

function buildLinePath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) {
    return ""
  }

  return points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ")
}

function formatGradeLabel(value: number) {
  return `V${Math.round(value)}`
}

export default function ProgressionChartCard({
  points,
}: ProgressionChartCardProps) {
  const innerWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right
  const innerHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom
  const maxClimbs = Math.max(...points.map((point) => point.climbs))
  const paddedMaxClimbs = Math.max(1, Math.ceil(maxClimbs / 5) * 5)
  const minGrade = Math.min(...points.map((point) => point.avgGrade))
  const maxGrade = Math.max(...points.map((point) => point.avgGrade))
  const gradeFloor = Math.max(0, Math.floor(minGrade))
  const gradeCeiling = Math.max(gradeFloor + 1, Math.ceil(maxGrade))
  const gradeRange = Math.max(0.5, gradeCeiling - gradeFloor)
  const stepWidth = innerWidth / points.length
  const barWidth = Math.min(18, stepWidth * 0.56)
  const chartPoints = points.map((point, index) => {
    const x = CHART_PADDING.left + index * stepWidth + stepWidth / 2
    const barHeight = (point.climbs / paddedMaxClimbs) * innerHeight
    const y =
      CHART_PADDING.top + innerHeight - ((point.avgGrade - gradeFloor) / gradeRange) * innerHeight

    return {
      ...point,
      x,
      y,
      barX: x - barWidth / 2,
      barY: CHART_PADDING.top + innerHeight - barHeight,
      barHeight,
    }
  })
  const linePath = buildLinePath(chartPoints.map(({ x, y }) => ({ x, y })))
  const gridLines = [0.25, 0.5, 0.75].map((ratio) => ({
    y: CHART_PADDING.top + innerHeight * ratio,
  }))

  return (
    <ProgressionSurface>
      <div className="flex flex-wrap items-center gap-3 text-xs text-stone-secondary">
        <LegendSwatch label="Climbs" variant="bars" />
        <LegendSwatch label="Avg Grade" variant="line" />
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-[11px] font-semibold text-stone-muted">
          <span>Climbs</span>
          <span>Avg V-Grade</span>
        </div>

        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="h-auto w-full overflow-visible"
          role="img"
          aria-label="Progression chart showing climbs as bars and average grade as a line"
        >
          {gridLines.map((line) => (
            <line
              key={line.y}
              x1={CHART_PADDING.left}
              x2={CHART_WIDTH - CHART_PADDING.right}
              y1={line.y}
              y2={line.y}
              stroke="currentColor"
              className="text-stone-border"
              strokeDasharray="3 6"
              strokeWidth="1"
            />
          ))}

          <text
            x={0}
            y={CHART_PADDING.top + 4}
            textAnchor="start"
            className="fill-stone-muted text-[11px]"
          >
            {paddedMaxClimbs}
          </text>

          <text
            x={0}
            y={CHART_PADDING.top + innerHeight}
            textAnchor="start"
            className="fill-stone-muted text-[11px]"
          >
            0
          </text>

          <text
            x={CHART_WIDTH}
            y={CHART_PADDING.top + 4}
            textAnchor="end"
            className="fill-stone-muted text-[11px]"
          >
            {formatGradeLabel(gradeCeiling)}
          </text>

          <text
            x={CHART_WIDTH}
            y={CHART_PADDING.top + innerHeight}
            textAnchor="end"
            className="fill-stone-muted text-[11px]"
          >
            {formatGradeLabel(gradeFloor)}
          </text>

          {chartPoints.map((point) => (
            <rect
              key={point.label}
              x={point.barX}
              y={point.barY}
              width={barWidth}
              height={point.barHeight}
              rx="7"
              className="fill-lichen/45 dark:fill-lichen/35"
            />
          ))}

          <path
            d={linePath}
            fill="none"
            className="stroke-ember"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {chartPoints.map((point) => (
            <g key={`${point.label}-dot`}>
              <circle cx={point.x} cy={point.y} r="4.5" className="fill-stone-surface" />
              <circle cx={point.x} cy={point.y} r="3" className="fill-ember" />
            </g>
          ))}

          {chartPoints.map((point) => (
            <text
              key={`${point.label}-tick`}
              x={point.x}
              y={CHART_HEIGHT - 6}
              textAnchor="middle"
              className="fill-stone-muted text-[11px]"
            >
              {point.tickLabel}
            </text>
          ))}
        </svg>
      </div>
    </ProgressionSurface>
  )
}

function LegendSwatch({ label, variant }: { label: string; variant: "bars" | "line" }) {
  return (
    <div className="flex items-center gap-2">
      <span
        aria-hidden="true"
        className={`block rounded-full ${
          variant === "bars" ? "h-2.5 w-5 bg-lichen/45 dark:bg-lichen/35" : "h-0.5 w-5 bg-ember"
        }`}
      />
      <span>{label}</span>
    </div>
  )
}
