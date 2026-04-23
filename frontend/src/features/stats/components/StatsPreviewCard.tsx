import { Link } from "react-router-dom"
import { FiActivity, FiChevronRight } from "react-icons/fi"
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
    return <ProgressionPreviewBars visual={visual} />
  }

  if (visual.kind === "radar") {
    return <ArchetypePreviewRadar visual={visual} />
  }

  if (visual.kind === "conversionRing") {
    return <PerformancePreviewRing visual={visual} />
  }

  return <SessionsPreviewBars visual={visual} tone={tone} />
}

function ProgressionPreviewBars({
  visual,
}: {
  visual: Extract<StatsPreviewVisualModel, { kind: "sparkline" }>
}) {
  const heights = visual.points.map((point) => {
    const gradeHeight = 100 - point.yPercent
    return Math.min(Math.max(gradeHeight, 28), 76)
  })

  return (
    <div aria-hidden="true" className="grid h-full w-full grid-cols-6 items-end gap-2.5 px-3 py-5">
      {visual.points.map((point, index) => (
        <span
          key={point.id}
          className={`min-h-[12px] rounded-full ${
            point.active && !visual.muted
              ? "bg-ember shadow-[0_0_0_1px_color-mix(in_srgb,var(--stone-text)_8%,transparent)]"
              : "border border-stone-border bg-stone-alt/85 dark:border-white/15 dark:bg-white/10"
          }`}
          style={{ height: `${heights[index]}%` }}
        />
      ))}
    </div>
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
        strokeOpacity="0.58"
        strokeWidth="1.15"
      />
      <polygon
        points={toPolygonPoints(valuePoints)}
        fill={active || balanced ? "var(--ember)" : "var(--stone-border)"}
        fillOpacity={active ? 0.32 : balanced ? 0.22 : 0.08}
        stroke={active || balanced ? "var(--ember)" : "var(--stone-border)"}
        strokeOpacity={active ? 0.96 : balanced ? 0.76 : 0.42}
        strokeWidth={active ? 2.8 : 2.1}
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PerformancePreviewRing({ visual }: { visual: Extract<StatsPreviewVisualModel, { kind: "conversionRing" }> }) {
  const radius = 40
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
      <foreignObject x="78" y="60" width="24" height="24" className="pointer-events-none">
        <div className="flex h-6 w-6 items-center justify-center text-stone-secondary/75 dark:text-stone-muted">
          <FiActivity className="h-4 w-4" />
        </div>
      </foreignObject>
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
    <div aria-hidden="true" className="grid h-full w-full grid-cols-7 gap-2 px-1.5 pb-4 pt-3">
      {visual.bars.map((bar) => (
        <span key={bar.id} className="flex min-w-0 flex-col items-center justify-end gap-1.5">
          <span className="relative flex h-full w-full items-end justify-center">
            <span className="absolute bottom-0 left-0 right-0 h-px bg-stone-border/45 dark:bg-white/10" />
            <span
              className={`relative z-10 min-h-[7px] w-full rounded-full ${
                bar.active
                  ? `${TONE_STYLES[tone].activePreview} shadow-[0_0_0_1px_color-mix(in_srgb,var(--stone-text)_8%,transparent)]`
                  : "border border-stone-border bg-stone-alt/85 dark:border-white/15 dark:bg-white/10"
              }`}
              style={{ height: `${bar.heightPercent}%` }}
            />
          </span>
          <span className="text-[9px] font-medium leading-none text-stone-secondary/75 dark:text-stone-muted">
            {bar.label}
          </span>
        </span>
      ))}
    </div>
  )
}
