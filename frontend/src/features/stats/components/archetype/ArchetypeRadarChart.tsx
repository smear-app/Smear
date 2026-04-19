import type { ArchetypeRadarAxis } from "../../domain/archetype/types"

type ArchetypeRadarChartProps = {
  axes: ArchetypeRadarAxis[]
}

const WIDTH = 320
const HEIGHT = 286
const CENTER_X = WIDTH / 2
const CENTER_Y = 136
const PLOT_RADIUS = 106
const LABEL_SIDE_GAP = 6
const LABEL_VERTICAL_GAP = 8
const LABEL_SAFE_BOUNDS = {
  left: 8,
  right: WIDTH - 8,
  top: 8,
  bottom: HEIGHT - 8,
}
const LABEL_LINE_HEIGHT = 13
const RING_COUNT = 4
const GRID_COLOR = "color-mix(in srgb, var(--stone-border) 84%, transparent)"
const AXIS_COLOR = "color-mix(in srgb, var(--stone-border) 72%, transparent)"
const LABEL_COLOR = "var(--stone-text)"
const PERFORMANCE_METADATA_COLOR = "color-mix(in srgb, var(--ember) 82%, var(--stone-text) 18%)"
const VOLUME_METADATA_COLOR = "var(--stone-muted)"
const PERFORMANCE_FILL = "color-mix(in srgb, var(--ember) 26%, transparent)"
const PERFORMANCE_STROKE = "var(--ember)"
const PERFORMANCE_DOT_FILL = "color-mix(in srgb, var(--ember) 92%, white 8%)"
const VOLUME_STROKE = "color-mix(in srgb, var(--stone-secondary) 78%, var(--stone-border) 22%)"
const VOLUME_FILL = "var(--stone-secondary)"
const DOT_STROKE = "var(--stone-surface)"

type LabelTextAnchor = "start" | "middle" | "end"
type AxisLabelSide = "top" | "right" | "bottom" | "left"
type LabelBlockMetrics = {
  categoryWidth: number
  metadataWidth: number
  blockWidth: number
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

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum)
}

function estimateTextWidth(text: string, fontSize: number) {
  return Array.from(text).reduce((width, character) => {
    if (character === " ") {
      return width + fontSize * 0.28
    }

    if (character === "•") {
      return width + fontSize * 0.35
    }

    if (/[0-9]/.test(character)) {
      return width + fontSize * 0.55
    }

    if (/[A-Z]/.test(character)) {
      return width + fontSize * 0.62
    }

    return width + fontSize * 0.52
  }, 0)
}

function getLabelBlockMetrics(axis: ArchetypeRadarAxis): LabelBlockMetrics {
  const categoryWidth = estimateTextWidth(axis.label, 12)
  const metadataWidth =
    estimateTextWidth(axis.display.performanceLabel, 11) +
    estimateTextWidth(` ${axis.display.metadataSeparator} ${axis.display.volumeLabel}`, 10.5)

  return {
    categoryWidth,
    metadataWidth,
    blockWidth: Math.max(categoryWidth, metadataWidth),
  }
}

function getLineTextLength(lineWidth: number, maxLineWidth: number) {
  return lineWidth > maxLineWidth ? maxLineWidth : undefined
}

function getAvailableLineWidth(x: number, textAnchor: LabelTextAnchor) {
  if (textAnchor === "start") {
    return Math.max(0, LABEL_SAFE_BOUNDS.right - x)
  }

  if (textAnchor === "end") {
    return Math.max(0, x - LABEL_SAFE_BOUNDS.left)
  }

  return Math.max(0, Math.min(x - LABEL_SAFE_BOUNDS.left, LABEL_SAFE_BOUNDS.right - x) * 2)
}

function applyLineWidthGuards(
  layout: { x: number; labelY: number; textAnchor: LabelTextAnchor },
  metrics: LabelBlockMetrics,
) {
  const maxLineWidth = getAvailableLineWidth(layout.x, layout.textAnchor)

  return {
    ...layout,
    categoryTextLength: getLineTextLength(metrics.categoryWidth, maxLineWidth),
    metadataTextLength: getLineTextLength(metrics.metadataWidth, maxLineWidth),
  }
}

function getAxisLabelSide(angleRadians: number): AxisLabelSide {
  const x = Math.cos(angleRadians)
  const y = Math.sin(angleRadians)

  if (y < 0 && Math.abs(x) < 0.35) {
    return "top"
  }

  if (y > 0 && Math.abs(x) < 0.35) {
    return "bottom"
  }

  return x < 0 ? "left" : "right"
}

function getLabelBlockLayout(angleRadians: number, metrics: LabelBlockMetrics) {
  const side = getAxisLabelSide(angleRadians)
  const axisEnd = polarToCartesian(angleRadians, PLOT_RADIUS)

  if (side === "top") {
    return applyLineWidthGuards(
      {
        x: clamp(
          CENTER_X,
          LABEL_SAFE_BOUNDS.left + metrics.blockWidth / 2,
          LABEL_SAFE_BOUNDS.right - metrics.blockWidth / 2,
        ),
        labelY: clamp(
          axisEnd.y - LABEL_VERTICAL_GAP - LABEL_LINE_HEIGHT,
          LABEL_SAFE_BOUNDS.top,
          LABEL_SAFE_BOUNDS.bottom,
        ),
        textAnchor: "middle" as LabelTextAnchor,
      },
      metrics,
    )
  }

  if (side === "bottom") {
    return applyLineWidthGuards(
      {
        x: clamp(
          CENTER_X,
          LABEL_SAFE_BOUNDS.left + metrics.blockWidth / 2,
          LABEL_SAFE_BOUNDS.right - metrics.blockWidth / 2,
        ),
        labelY: clamp(
          axisEnd.y + LABEL_VERTICAL_GAP,
          LABEL_SAFE_BOUNDS.top,
          LABEL_SAFE_BOUNDS.bottom - LABEL_LINE_HEIGHT,
        ),
        textAnchor: "middle" as LabelTextAnchor,
      },
      metrics,
    )
  }

  if (side === "left") {
    return applyLineWidthGuards(
      {
        x: clamp(axisEnd.x - LABEL_SIDE_GAP, LABEL_SAFE_BOUNDS.left, LABEL_SAFE_BOUNDS.right),
        labelY: clamp(
          axisEnd.y - LABEL_LINE_HEIGHT / 2,
          LABEL_SAFE_BOUNDS.top,
          LABEL_SAFE_BOUNDS.bottom - LABEL_LINE_HEIGHT,
        ),
        textAnchor: "end" as LabelTextAnchor,
      },
      metrics,
    )
  }

  return applyLineWidthGuards(
    {
      x: clamp(axisEnd.x + LABEL_SIDE_GAP, LABEL_SAFE_BOUNDS.left, LABEL_SAFE_BOUNDS.right),
      labelY: clamp(
        axisEnd.y - LABEL_LINE_HEIGHT / 2,
        LABEL_SAFE_BOUNDS.top,
        LABEL_SAFE_BOUNDS.bottom - LABEL_LINE_HEIGHT,
      ),
      textAnchor: "start" as LabelTextAnchor,
    },
    metrics,
  )
}

export default function ArchetypeRadarChart({ axes }: ArchetypeRadarChartProps) {
  const angleStep = (Math.PI * 2) / axes.length
  const startAngle = -Math.PI / 2
  const ringLevels = Array.from({ length: RING_COUNT }, (_, index) => (index + 1) / RING_COUNT)
  const plottedPoints = axes.map((axis, index) => {
    const angle = startAngle + angleStep * index
    const axisEnd = polarToCartesian(angle, PLOT_RADIUS)
    const performancePoint = polarToCartesian(angle, (axis.performance / 100) * PLOT_RADIUS)
    const volumePoint = polarToCartesian(angle, (axis.volume / 100) * PLOT_RADIUS)
    const labelLayout = getLabelBlockLayout(angle, getLabelBlockMetrics(axis))

    return {
      ...axis,
      axisEnd,
      performancePoint,
      volumePoint,
      labelLayout,
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
            return polarToCartesian(angle, PLOT_RADIUS * level)
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

        {plottedPoints.map((axis) => {
          return (
            <g
              key={`${axis.label}-label`}
            >
              <text
                x={axis.labelLayout.x}
                y={axis.labelLayout.labelY}
                textAnchor={axis.labelLayout.textAnchor}
                dominantBaseline="middle"
                fill={LABEL_COLOR}
                textLength={axis.labelLayout.categoryTextLength}
                lengthAdjust={axis.labelLayout.categoryTextLength === undefined ? undefined : "spacingAndGlyphs"}
                className="text-[12px] font-semibold"
              >
                {axis.label}
              </text>
              <text
                x={axis.labelLayout.x}
                y={axis.labelLayout.labelY + LABEL_LINE_HEIGHT}
                textAnchor={axis.labelLayout.textAnchor}
                dominantBaseline="middle"
                textLength={axis.labelLayout.metadataTextLength}
                lengthAdjust={axis.labelLayout.metadataTextLength === undefined ? undefined : "spacingAndGlyphs"}
              >
                <tspan fill={PERFORMANCE_METADATA_COLOR} className="text-[11px] font-bold">
                  {axis.display.performanceLabel}
                </tspan>
                <tspan fill={VOLUME_METADATA_COLOR} className="text-[10.5px] font-semibold">
                  {` ${axis.display.metadataSeparator} ${axis.display.volumeLabel}`}
                </tspan>
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
