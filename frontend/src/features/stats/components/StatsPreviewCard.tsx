import { Link } from "react-router-dom"
import { FiActivity, FiChevronRight } from "react-icons/fi"
import type { StatsCardConfig, StatsPreviewTone, StatsPreviewTrendPoint, StatsPreviewVisualKind } from "../domain/types"

type StatsPreviewCardProps = {
  card: StatsCardConfig
  trendPoints?: StatsPreviewTrendPoint[]
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

export default function StatsPreviewCard({ card, trendPoints }: StatsPreviewCardProps) {
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
          <p className="text-lg font-semibold leading-tight text-stone-text">{card.primaryMetric}</p>
          <p className="mt-1.5 text-sm leading-5 text-stone-secondary">{card.secondaryText}</p>
        </div>

        <StatsPreviewVisual kind={card.visualKind} tone={card.tone} trendPoints={trendPoints} />
      </div>
    </Link>
  )
}

function StatsPreviewVisual({
  kind,
  tone,
  trendPoints,
}: {
  kind: StatsPreviewVisualKind
  tone: StatsPreviewTone
  trendPoints?: StatsPreviewTrendPoint[]
}) {
  if (kind === "trend") {
    return <ProgressionPreviewBars points={trendPoints ?? []} tone={tone} />
  }

  if (kind === "profile") {
    return (
      <div aria-hidden="true" className="grid h-20 w-24 shrink-0 place-items-center">
        <div className="relative h-16 w-16">
          <span className="absolute inset-x-5 top-0 h-full rounded-full bg-lichen/20" />
          <span className="absolute inset-y-5 left-0 w-full rounded-full bg-stone-alt" />
          <span className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-lichen/35 bg-lichen/20" />
        </div>
      </div>
    )
  }

  if (kind === "outcome") {
    return (
      <div aria-hidden="true" className="grid h-20 w-24 shrink-0 place-items-center">
        <div className="grid h-16 w-16 place-items-center rounded-full border-[7px] border-stone-alt border-r-ember border-t-ember">
          <FiActivity className="h-5 w-5 text-ember" />
        </div>
      </div>
    )
  }

  const activeIndexes = new Set([1, 3, 5])

  return (
    <div aria-hidden="true" className="grid h-20 w-24 shrink-0 grid-cols-7 items-end gap-1.5">
      {Array.from({ length: 7 }, (_, index) => (
        <span
          key={index}
          className={`h-9 rounded-full ${
            activeIndexes.has(index) ? TONE_STYLES[tone].activePreview : TONE_STYLES[tone].mutedPreview
          }`}
        />
      ))}
    </div>
  )
}

function ProgressionPreviewBars({ points, tone }: { points: StatsPreviewTrendPoint[]; tone: StatsPreviewTone }) {
  const placeholderHeights = [34, 52, 42]
  const hasPoints = points.length > 0

  return (
    <div aria-hidden="true" className="flex h-20 w-24 shrink-0 items-end justify-center gap-2.5">
      {hasPoints
        ? points.map((point) => (
            <span
              key={point.id}
              className={`w-3.5 rounded-full ${TONE_STYLES[tone].activePreview}`}
              style={{ height: `${point.heightPercent}%` }}
            />
          ))
        : placeholderHeights.map((height) => (
            <span
              key={height}
              className={`w-3.5 rounded-full ${TONE_STYLES[tone].mutedPreview}`}
              style={{ height: `${height}%` }}
            />
          ))}
    </div>
  )
}
