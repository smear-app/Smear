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

        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-stone-border bg-stone-alt text-stone-secondary transition-colors group-hover:text-ember">
          <FiChevronRight className="h-4 w-4" />
        </span>
      </div>

      <div className="mt-3.5 flex items-end justify-between gap-5">
        <div className="min-w-0 flex-1">
          {card.primaryMetric ? (
            <p className="text-lg font-semibold leading-tight text-stone-text">{card.primaryMetric}</p>
          ) : null}
          <p className="mt-1.5 text-sm leading-5 text-stone-secondary">{card.secondaryText}</p>
        </div>

        <StatsPreviewVisual visual={visual} tone={card.tone} />
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
  if (visual.kind === "trendDots") {
    return <ProgressionPreviewDots visual={visual} tone={tone} />
  }

  if (visual.kind === "radar") {
    return <ArchetypePreviewRadar visual={visual} />
  }

  if (visual.kind === "conversionRing") {
    return <PerformancePreviewRing visual={visual} />
  }

  return <SessionsPreviewBars visual={visual} tone={tone} />
}

function ProgressionPreviewDots({
  visual,
  tone,
}: {
  visual: Extract<StatsPreviewVisualModel, { kind: "trendDots" }>
  tone: StatsPreviewTone
}) {
  const strokeColor = visual.muted ? "var(--stone-border)" : "var(--ember)"
  const dotClass = visual.muted ? TONE_STYLES[tone].mutedPreview : TONE_STYLES[tone].activePreview
  const points = visual.points.map((point) => `${point.xPercent},${point.yPercent}`).join(" ")

  return (
    <svg aria-hidden="true" viewBox="0 0 100 80" className="h-20 w-24 shrink-0 overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeOpacity={visual.muted ? 0.35 : 0.62}
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {visual.points.map((point) => (
        <circle
          key={point.id}
          cx={point.xPercent}
          cy={point.yPercent}
          r={point.active ? 4.8 : 4.2}
          className={point.active ? dotClass : TONE_STYLES[tone].mutedPreview}
          stroke="var(--stone-surface)"
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
    <svg aria-hidden="true" viewBox="0 0 100 80" className="h-20 w-24 shrink-0 overflow-visible">
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
  const radius = 25
  const circumference = 2 * Math.PI * radius
  const dashLength = (Math.min(Math.max(visual.percent, 0), 100) / 100) * circumference

  return (
    <svg aria-hidden="true" viewBox="0 0 100 80" className="h-20 w-24 shrink-0">
      <circle
        cx="50"
        cy="40"
        r={radius}
        fill="none"
        stroke="var(--stone-border)"
        strokeOpacity="0.72"
        strokeWidth="8"
      />
      <circle
        cx="50"
        cy="40"
        r={radius}
        fill="none"
        stroke={visual.active ? "var(--ember)" : "var(--stone-secondary)"}
        strokeOpacity={visual.active ? 0.92 : 0.28}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={`${dashLength} ${circumference}`}
        transform="rotate(-90 50 40)"
      />
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
    <div aria-hidden="true" className="grid h-20 w-24 shrink-0 grid-cols-7 items-end gap-1.5">
      {visual.bars.map((bar) => (
        <span
          key={bar.id}
          className={`rounded-full ${bar.active ? TONE_STYLES[tone].activePreview : TONE_STYLES[tone].mutedPreview}`}
          style={{ height: `${bar.heightPercent}%` }}
        />
      ))}
    </div>
  )
}
