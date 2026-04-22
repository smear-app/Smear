import { Link } from "react-router-dom"
import { FiChevronRight } from "react-icons/fi"
import type { StatsCardConfig, StatsPreviewTone, StatsPreviewVisualModel } from "../domain/types"

type StatsPreviewCardProps = {
  card: StatsCardConfig
  visual: StatsPreviewVisualModel
}

const TONE_STYLES: Record<
  StatsPreviewTone,
  {
    accent: string
    border: string
    activePreview: string
    mutedPreview: string
  }
> = {
  ember: {
    accent: "text-ember",
    border: "border-ember/20",
    activePreview: "bg-ember",
    mutedPreview: "bg-ember/15",
  },
  lichen: {
    accent: "text-lichen",
    border: "border-lichen/20",
    activePreview: "bg-lichen",
    mutedPreview: "bg-lichen/15",
  },
  gold: {
    accent: "text-ember",
    border: "border-ember/20",
    activePreview: "bg-ember",
    mutedPreview: "bg-ember/15",
  },
  slate: {
    accent: "text-stone-secondary",
    border: "border-stone-border",
    activePreview: "bg-stone-secondary",
    mutedPreview: "bg-stone-alt",
  },
}

const PROGRESSION_LINE_COLOR = "color-mix(in srgb, var(--ember) 92%, white 8%)"
const PROGRESSION_MUTED_LINE_COLOR = "color-mix(in srgb, var(--stone-border) 86%, transparent)"
const PROGRESSION_MARKER_OUTLINE_COLOR = "var(--stone-surface)"

export default function StatsPreviewCard({ card, visual }: StatsPreviewCardProps) {
  const tone = TONE_STYLES[card.tone]

  return (
    <Link
      to={card.path}
      state={{ fromStatsOverview: true }}
      aria-label={`Open ${card.title} stats`}
      className={`group block rounded-[30px] border ${tone.border} bg-stone-surface px-5 py-4 text-left shadow-[0_14px_34px_rgba(89,68,51,0.08)] transition duration-200 hover:-translate-y-0.5 hover:bg-stone-alt dark:border-white/[0.06] dark:shadow-[0_16px_34px_rgba(0,0,0,0.22)] active:translate-y-0`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-stone-text">{card.title}</h2>
          <p className={`mt-0.5 text-sm font-semibold ${tone.accent}`}>{card.descriptor}</p>
        </div>

        <span className="flex h-9 w-9 shrink-0 items-center justify-center text-stone-secondary/85 dark:text-stone-muted">
          <FiChevronRight className="h-4.5 w-4.5" />
        </span>
      </div>

      <div className="mt-3.5 flex items-end justify-between gap-5">
        <div className="min-w-0 flex-1">
          {card.primaryMetric ? (
            <p className="text-lg font-semibold leading-tight text-stone-text">{card.primaryMetric}</p>
          ) : null}
          <p className="mt-1.5 text-sm leading-5 text-stone-secondary">{card.secondaryText}</p>
        </div>

        <div className="-my-8 -mr-1 flex h-[8.5rem] w-[10.5rem] shrink-0 -translate-y-5 items-center justify-end overflow-visible">
          <StatsPreviewVisual visual={visual} tone={card.tone} />
        </div>
      </div>
    </Link>
  )
}

function StatsPreviewVisual({
  visual,
  tone,
}: {
  visual: StatsPreviewVisualModel
  tone: StatsPreviewTone
}) {
  if (visual.kind === "sparkline") {
    return <ProgressionPreviewSparkline visual={visual} />
  }

  if (visual.kind === "radar") {
    return <ArchetypePreviewRadar visual={visual} />
  }

  if (visual.kind === "conversionRing") {
    return <PerformancePreviewRing visual={visual} />
  }

  return <SessionsPreviewBars visual={visual} tone={tone} />
}

function buildSmoothSparklinePath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) {
    return ""
  }

  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`
  }

  const [first, ...rest] = points
  const commands = [`M ${first.x} ${first.y}`]

  rest.slice(0, -1).forEach((point, index) => {
    const next = rest[index + 1]
    const midX = (point.x + next.x) / 2
    const midY = (point.y + next.y) / 2
    commands.push(`Q ${point.x} ${point.y} ${midX} ${midY}`)
  })

  const last = points[points.length - 1]
  commands.push(`T ${last.x} ${last.y}`)

  return commands.join(" ")
}

function ProgressionPreviewSparkline({
  visual,
}: {
  visual: Extract<StatsPreviewVisualModel, { kind: "sparkline" }>
}) {
  const strokeColor = visual.muted ? PROGRESSION_MUTED_LINE_COLOR : PROGRESSION_LINE_COLOR
  const dotFill = visual.muted ? "var(--stone-border)" : PROGRESSION_LINE_COLOR
  const points = visual.points.map((point) => ({ x: point.xPercent, y: point.yPercent }))
  const path = buildSmoothSparklinePath(points)

  return (
    <svg aria-hidden="true" viewBox="0 0 100 80" className="h-full w-full overflow-visible">
      <path
        d={path}
        fill="none"
        stroke={strokeColor}
        strokeOpacity={visual.muted ? 0.62 : 1}
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {visual.points.map((point) => (
        <circle
          key={point.id}
          cx={point.xPercent}
          cy={point.yPercent}
          r="3.6"
          fill={dotFill}
          fillOpacity={point.active ? 1 : 0.62}
          stroke={PROGRESSION_MARKER_OUTLINE_COLOR}
          strokeWidth="2"
        />
      ))}
    </svg>
  )
}

function polarToCartesian(index: number, total: number, radius: number) {
  const angle = -Math.PI / 2 + (Math.PI * 2 * index) / total

  return {
    x: 50 + Math.cos(angle) * radius,
    y: 40 + Math.sin(angle) * radius,
  }
}

function toPolygonPoints(points: Array<{ x: number; y: number }>) {
  return points.map((point) => `${point.x},${point.y}`).join(" ")
}

function ArchetypePreviewRadar({ visual }: { visual: Extract<StatsPreviewVisualModel, { kind: "radar" }> }) {
  const axisCount = visual.axes.length
  const gridPoints = Array.from({ length: axisCount }, (_, index) => polarToCartesian(index, axisCount, 30))
  const valuePoints = visual.axes.map((axis, index) => polarToCartesian(index, axisCount, (axis.value / 100) * 30))
  const active = visual.state === "active"
  const balanced = visual.state === "balanced"

  return (
    <svg aria-hidden="true" viewBox="0 0 100 80" className="h-full w-full overflow-visible">
      <polygon
        points={toPolygonPoints(gridPoints)}
        fill="none"
        stroke="var(--stone-border)"
        strokeOpacity="0.78"
        strokeWidth="1"
      />
      {gridPoints.map((point, index) => (
        <line
          key={visual.axes[index].id}
          x1="50"
          y1="40"
          x2={point.x}
          y2={point.y}
          stroke="var(--stone-border)"
          strokeOpacity="0.45"
          strokeWidth="1"
        />
      ))}
      <polygon
        points={toPolygonPoints(valuePoints)}
        fill={active || balanced ? "var(--lichen)" : "var(--stone-border)"}
        fillOpacity={active ? 0.24 : balanced ? 0.16 : 0.08}
        stroke={active || balanced ? "var(--lichen)" : "var(--stone-border)"}
        strokeOpacity={active ? 0.92 : balanced ? 0.68 : 0.42}
        strokeWidth={active ? 2.25 : 1.75}
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PerformancePreviewRing({ visual }: { visual: Extract<StatsPreviewVisualModel, { kind: "conversionRing" }> }) {
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const dashLength = (Math.min(Math.max(visual.percent, 0), 100) / 100) * circumference

  return (
    <svg aria-hidden="true" viewBox="0 0 180 144" className="h-full w-full overflow-visible">
      <circle
        cx="90"
        cy="72"
        r={radius}
        fill="none"
        stroke="var(--stone-border)"
        strokeOpacity="0.72"
        strokeWidth="14"
      />
      <circle
        cx="90"
        cy="72"
        r={radius}
        fill="none"
        stroke={visual.active ? "var(--ember)" : "var(--stone-secondary)"}
        strokeOpacity={visual.active ? 0.92 : 0.28}
        strokeWidth="14"
        strokeLinecap="round"
        strokeDasharray={`${dashLength} ${circumference}`}
        transform="rotate(-90 90 72)"
      />
      <text
        x="90"
        y="72"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="var(--stone-secondary)"
        className="text-[18px] font-medium"
      >
        Send %
      </text>
    </svg>
  )
}

function SessionsPreviewBars({
  visual,
  tone,
}: {
  visual: Extract<StatsPreviewVisualModel, { kind: "dailyBars" }>
  tone: StatsPreviewTone
}) {
  return (
    <div aria-hidden="true" className="grid h-full w-full grid-cols-7 items-end gap-2.5 px-1.5 py-3">
      {visual.bars.map((bar) => (
        <span
          key={bar.id}
          className={`min-h-[7px] rounded-full ${
            bar.active
              ? `${TONE_STYLES[tone].activePreview} shadow-[0_0_0_1px_color-mix(in_srgb,var(--stone-text)_8%,transparent)]`
              : "border border-stone-border bg-stone-alt/85 dark:border-white/15 dark:bg-white/10"
          }`}
          style={{ height: `${bar.heightPercent}%` }}
        />
      ))}
    </div>
  )
}
