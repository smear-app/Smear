import type { ArchetypeRadarAxis } from "../../domain/archetype/types"

type ArchetypeRadarChartProps = {
  axes: ArchetypeRadarAxis[]
}

const WIDTH = 320
const CENTER_X = WIDTH / 2
const BASE_CENTER_Y = 136
const PLOT_RADIUS = 106
const PLOT_TO_LABEL_GAP = 10
const PLOT_SAFE_GAP = 6
const WALL_ANGLE_SIDE_LABEL_EDGE_INSET = 8
const LABEL_HORIZONTAL_SAFE_INSET = 0
const LABEL_VERTICAL_SAFE_INSET = 8
const LABEL_LINE_HEIGHT = 13
const LABEL_BLOCK_HEIGHT = LABEL_LINE_HEIGHT * 2
const HEIGHT = BASE_CENTER_Y + PLOT_RADIUS + PLOT_TO_LABEL_GAP + LABEL_LINE_HEIGHT + LABEL_VERTICAL_SAFE_INSET
const LABEL_SAFE_BOUNDS = {
  left: LABEL_HORIZONTAL_SAFE_INSET,
  right: WIDTH - LABEL_HORIZONTAL_SAFE_INSET,
  top: LABEL_VERTICAL_SAFE_INSET,
  bottom: HEIGHT - LABEL_VERTICAL_SAFE_INSET,
}
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
type Point = { x: number; y: number }
type LabelBlockBounds = {
  left: number
  right: number
  top: number
  bottom: number
}
type LabelBlockLayout = {
  x: number
  labelY: number
  textAnchor: LabelTextAnchor
  bounds: LabelBlockBounds
}

function polarToCartesian(angleRadians: number, radius: number, centerY: number) {
  return {
    x: CENTER_X + Math.cos(angleRadians) * radius,
    y: centerY + Math.sin(angleRadians) * radius,
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

function getBoundsForAnchor(x: number, top: number, textAnchor: LabelTextAnchor, metrics: LabelBlockMetrics) {
  const left =
    textAnchor === "start" ? x : textAnchor === "end" ? x - metrics.blockWidth : x - metrics.blockWidth / 2

  return {
    left,
    right: left + metrics.blockWidth,
    top,
    bottom: top + LABEL_BLOCK_HEIGHT,
  }
}

function toLabelLayout(x: number, top: number, textAnchor: LabelTextAnchor, metrics: LabelBlockMetrics): LabelBlockLayout {
  return {
    x,
    labelY: top + LABEL_LINE_HEIGHT / 2,
    textAnchor,
    bounds: getBoundsForAnchor(x, top, textAnchor, metrics),
  }
}

function getPlotPolygon(axisCount: number, startAngle: number, angleStep: number, radius: number, centerY: number) {
  return Array.from({ length: axisCount }, (_, index) =>
    polarToCartesian(startAngle + angleStep * index, radius, centerY),
  )
}

function createSideLabelLayout(side: AxisLabelSide, axisEnd: Point, metrics: LabelBlockMetrics) {
  if (side === "top") {
    const x = clamp(
      axisEnd.x,
      LABEL_SAFE_BOUNDS.left + metrics.blockWidth / 2,
      LABEL_SAFE_BOUNDS.right - metrics.blockWidth / 2,
    )

    return toLabelLayout(x, axisEnd.y - PLOT_TO_LABEL_GAP - LABEL_BLOCK_HEIGHT, "middle", metrics)
  }

  if (side === "bottom") {
    const x = clamp(
      axisEnd.x,
      LABEL_SAFE_BOUNDS.left + metrics.blockWidth / 2,
      LABEL_SAFE_BOUNDS.right - metrics.blockWidth / 2,
    )

    return toLabelLayout(x, axisEnd.y + PLOT_TO_LABEL_GAP, "middle", metrics)
  }

  if (side === "left") {
    const x = clamp(
      axisEnd.x - PLOT_TO_LABEL_GAP,
      LABEL_SAFE_BOUNDS.left + metrics.blockWidth,
      LABEL_SAFE_BOUNDS.right,
    )

    return toLabelLayout(x, axisEnd.y - LABEL_BLOCK_HEIGHT / 2, "end", metrics)
  }

  const x = clamp(
    axisEnd.x + PLOT_TO_LABEL_GAP,
    LABEL_SAFE_BOUNDS.left,
    LABEL_SAFE_BOUNDS.right - metrics.blockWidth,
  )

  return toLabelLayout(x, axisEnd.y - LABEL_BLOCK_HEIGHT / 2, "start", metrics)
}

function createWallAngleSideLabelLayout(
  side: Extract<AxisLabelSide, "left" | "right">,
  axisEnd: Point,
  metrics: LabelBlockMetrics,
  centerY: number,
  sideLabelTrackWidth: number,
) {
  const textAnchor = side === "left" ? "end" : "start"
  const x = side === "left"
    ? clamp(
        axisEnd.x - PLOT_TO_LABEL_GAP,
        LABEL_SAFE_BOUNDS.left + WALL_ANGLE_SIDE_LABEL_EDGE_INSET + sideLabelTrackWidth,
        LABEL_SAFE_BOUNDS.right - WALL_ANGLE_SIDE_LABEL_EDGE_INSET,
      )
    : clamp(
        axisEnd.x + PLOT_TO_LABEL_GAP,
        LABEL_SAFE_BOUNDS.left + WALL_ANGLE_SIDE_LABEL_EDGE_INSET,
        LABEL_SAFE_BOUNDS.right - WALL_ANGLE_SIDE_LABEL_EDGE_INSET - sideLabelTrackWidth,
      )
  const naturalTop = axisEnd.y - PLOT_TO_LABEL_GAP - LABEL_BLOCK_HEIGHT
  const naturalLayout = toLabelLayout(x, naturalTop, textAnchor, metrics)
  const nearestPlotEdgeX = side === "left" ? naturalLayout.bounds.right : naturalLayout.bounds.left
  const upperVertexY = centerY - PLOT_RADIUS - PLOT_SAFE_GAP
  const plotBoundaryYAtLabelEdge = upperVertexY + Math.abs(nearestPlotEdgeX - CENTER_X)
  const maxLabelBottom = plotBoundaryYAtLabelEdge - PLOT_TO_LABEL_GAP
  const top = clamp(
    Math.min(naturalTop, maxLabelBottom - LABEL_BLOCK_HEIGHT),
    LABEL_SAFE_BOUNDS.top,
    LABEL_SAFE_BOUNDS.bottom - LABEL_BLOCK_HEIGHT,
  )

  return toLabelLayout(x, top, textAnchor, metrics)
}

function createVerticalFallbackLayout(
  placement: "above" | "below",
  axisEnd: Point,
  metrics: LabelBlockMetrics,
) {
  const centeredX = clamp(
    axisEnd.x,
    LABEL_SAFE_BOUNDS.left + metrics.blockWidth / 2,
    LABEL_SAFE_BOUNDS.right - metrics.blockWidth / 2,
  )
  const top =
    placement === "above" ? axisEnd.y - PLOT_TO_LABEL_GAP - LABEL_BLOCK_HEIGHT : axisEnd.y + PLOT_TO_LABEL_GAP

  return toLabelLayout(centeredX, top, "middle", metrics)
}

function isPointInsideBounds(point: Point, bounds: LabelBlockBounds) {
  return point.x >= bounds.left && point.x <= bounds.right && point.y >= bounds.top && point.y <= bounds.bottom
}

function isPointInsidePolygon(point: Point, polygon: Point[]) {
  let isInside = false

  for (let index = 0, previousIndex = polygon.length - 1; index < polygon.length; previousIndex = index, index += 1) {
    const current = polygon[index]
    const previous = polygon[previousIndex]
    const crossesY = current.y > point.y !== previous.y > point.y

    if (crossesY) {
      const intersectionX = ((previous.x - current.x) * (point.y - current.y)) / (previous.y - current.y) + current.x

      if (point.x < intersectionX) {
        isInside = !isInside
      }
    }
  }

  return isInside
}

function getOrientation(first: Point, second: Point, third: Point) {
  const value = (second.y - first.y) * (third.x - second.x) - (second.x - first.x) * (third.y - second.y)

  if (Math.abs(value) < 0.001) {
    return 0
  }

  return value > 0 ? 1 : 2
}

function isPointOnSegment(first: Point, second: Point, third: Point) {
  return (
    second.x <= Math.max(first.x, third.x) &&
    second.x >= Math.min(first.x, third.x) &&
    second.y <= Math.max(first.y, third.y) &&
    second.y >= Math.min(first.y, third.y)
  )
}

function doSegmentsIntersect(firstStart: Point, firstEnd: Point, secondStart: Point, secondEnd: Point) {
  const firstOrientation = getOrientation(firstStart, firstEnd, secondStart)
  const secondOrientation = getOrientation(firstStart, firstEnd, secondEnd)
  const thirdOrientation = getOrientation(secondStart, secondEnd, firstStart)
  const fourthOrientation = getOrientation(secondStart, secondEnd, firstEnd)

  if (firstOrientation !== secondOrientation && thirdOrientation !== fourthOrientation) {
    return true
  }

  return (
    (firstOrientation === 0 && isPointOnSegment(firstStart, secondStart, firstEnd)) ||
    (secondOrientation === 0 && isPointOnSegment(firstStart, secondEnd, firstEnd)) ||
    (thirdOrientation === 0 && isPointOnSegment(secondStart, firstStart, secondEnd)) ||
    (fourthOrientation === 0 && isPointOnSegment(secondStart, firstEnd, secondEnd))
  )
}

function doesBoundsIntersectPolygon(bounds: LabelBlockBounds, polygon: Point[]) {
  const boundsPoints = [
    { x: bounds.left, y: bounds.top },
    { x: bounds.right, y: bounds.top },
    { x: bounds.right, y: bounds.bottom },
    { x: bounds.left, y: bounds.bottom },
  ]
  const boundsEdges = boundsPoints.map((point, index) => [point, boundsPoints[(index + 1) % boundsPoints.length]])
  const polygonEdges = polygon.map((point, index) => [point, polygon[(index + 1) % polygon.length]])

  return (
    boundsPoints.some((point) => isPointInsidePolygon(point, polygon)) ||
    polygon.some((point) => isPointInsideBounds(point, bounds)) ||
    boundsEdges.some(([boundsStart, boundsEnd]) =>
      polygonEdges.some(([polygonStart, polygonEnd]) =>
        doSegmentsIntersect(boundsStart, boundsEnd, polygonStart, polygonEnd),
      ),
    )
  )
}

function isInsideLabelSafeBounds(bounds: LabelBlockBounds) {
  return (
    bounds.left >= LABEL_SAFE_BOUNDS.left &&
    bounds.right <= LABEL_SAFE_BOUNDS.right &&
    bounds.top >= LABEL_SAFE_BOUNDS.top &&
    bounds.bottom <= LABEL_SAFE_BOUNDS.bottom
  )
}

function isValidLabelLayout(layout: LabelBlockLayout, plotPolygon: Point[]) {
  return isInsideLabelSafeBounds(layout.bounds) && !doesBoundsIntersectPolygon(layout.bounds, plotPolygon)
}

function getLabelBlockLayout(
  angleRadians: number,
  metrics: LabelBlockMetrics,
  centerY: number,
  plotPolygon: Point[],
  axisCount: number,
  sideLabelTrackWidth: number,
) {
  const side = getAxisLabelSide(angleRadians)
  const axisEnd = polarToCartesian(angleRadians, PLOT_RADIUS, centerY)
  const sideLayout =
    axisCount === 4 && (side === "left" || side === "right")
      ? createWallAngleSideLabelLayout(side, axisEnd, metrics, centerY, sideLabelTrackWidth)
      : createSideLabelLayout(side, axisEnd, metrics)
  const verticalPreference = axisEnd.y >= centerY ? "below" : "above"
  const isLowerThreeAxisVertex = axisCount === 3 && axisEnd.y > centerY
  const verticalFallback = createVerticalFallbackLayout(
    verticalPreference,
    axisEnd,
    metrics,
  )
  const alternateVerticalFallback = createVerticalFallbackLayout(
    verticalPreference === "below" ? "above" : "below",
    axisEnd,
    metrics,
  )
  const candidates = isLowerThreeAxisVertex
    ? [verticalFallback, alternateVerticalFallback, sideLayout]
    : [sideLayout, verticalFallback, alternateVerticalFallback]

  return candidates.find((candidate) => isValidLabelLayout(candidate, plotPolygon)) ?? candidates[1]
}

function getAxisVerticalBounds(
  angleRadians: number,
  metrics: LabelBlockMetrics,
  centerY: number,
  plotPolygon: Point[],
  axisCount: number,
  sideLabelTrackWidth: number,
) {
  const axisEnd = polarToCartesian(angleRadians, PLOT_RADIUS, centerY)
  const layout = getLabelBlockLayout(angleRadians, metrics, centerY, plotPolygon, axisCount, sideLabelTrackWidth)

  return {
    minY: Math.min(axisEnd.y, layout.bounds.top),
    maxY: Math.max(axisEnd.y, layout.bounds.bottom),
  }
}

function getWallAngleSideLabelTrackWidth(labelMetrics: LabelBlockMetrics[], startAngle: number, angleStep: number) {
  if (labelMetrics.length !== 4) {
    return 0
  }

  return Math.max(
    ...labelMetrics
      .filter((_, index) => {
        const side = getAxisLabelSide(startAngle + angleStep * index)

        return side === "left" || side === "right"
      })
      .map((metrics) => metrics.blockWidth),
  )
}

function getCenteredPlotOffset(labelMetrics: LabelBlockMetrics[], startAngle: number, angleStep: number) {
  const sideLabelTrackWidth = getWallAngleSideLabelTrackWidth(labelMetrics, startAngle, angleStep)
  const plotPolygon = getPlotPolygon(
    labelMetrics.length,
    startAngle,
    angleStep,
    PLOT_RADIUS + PLOT_SAFE_GAP,
    BASE_CENTER_Y,
  )
  const bounds = labelMetrics.map((metrics, index) =>
    getAxisVerticalBounds(
      startAngle + angleStep * index,
      metrics,
      BASE_CENTER_Y,
      plotPolygon,
      labelMetrics.length,
      sideLabelTrackWidth,
    ),
  )
  const minY = Math.min(...bounds.map((bound) => bound.minY))
  const maxY = Math.max(...bounds.map((bound) => bound.maxY))
  const contentHeight = maxY - minY

  return (HEIGHT - contentHeight) / 2 - minY
}

export default function ArchetypeRadarChart({ axes }: ArchetypeRadarChartProps) {
  const angleStep = (Math.PI * 2) / axes.length
  const startAngle = -Math.PI / 2
  const labelMetrics = axes.map(getLabelBlockMetrics)
  const sideLabelTrackWidth = getWallAngleSideLabelTrackWidth(labelMetrics, startAngle, angleStep)
  const centerY = BASE_CENTER_Y + getCenteredPlotOffset(labelMetrics, startAngle, angleStep)
  const ringLevels = Array.from({ length: RING_COUNT }, (_, index) => (index + 1) / RING_COUNT)
  const plotPolygon = getPlotPolygon(axes.length, startAngle, angleStep, PLOT_RADIUS + PLOT_SAFE_GAP, centerY)
  const plottedPoints = axes.map((axis, index) => {
    const angle = startAngle + angleStep * index
    const axisEnd = polarToCartesian(angle, PLOT_RADIUS, centerY)
    const performancePoint = polarToCartesian(angle, (axis.performance / 100) * PLOT_RADIUS, centerY)
    const volumePoint = polarToCartesian(angle, (axis.volume / 100) * PLOT_RADIUS, centerY)
    const labelLayout = getLabelBlockLayout(
      angle,
      labelMetrics[index],
      centerY,
      plotPolygon,
      axes.length,
      sideLabelTrackWidth,
    )

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
            return polarToCartesian(angle, PLOT_RADIUS * level, centerY)
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
            y1={centerY}
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
                className="text-[12px] font-semibold"
              >
                {axis.label}
              </text>
              <text
                x={axis.labelLayout.x}
                y={axis.labelLayout.labelY + LABEL_LINE_HEIGHT}
                textAnchor={axis.labelLayout.textAnchor}
                dominantBaseline="middle"
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
