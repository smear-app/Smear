import { Link } from "react-router-dom"
import type { IconType } from "react-icons"
import { FiActivity, FiCalendar, FiChevronRight, FiCompass, FiTarget, FiTrendingUp } from "react-icons/fi"
import type { StatsCardConfig, StatsPreviewTone, StatsPreviewVisualKind } from "../domain/types"

type StatsPreviewCardProps = {
  card: StatsCardConfig
}

const TONE_STYLES: Record<
  StatsPreviewTone,
  {
    accent: string
    icon: string
    glow: string
    border: string
  }
> = {
  ember: {
    accent: "text-ember",
    icon: "bg-ember-soft text-ember",
    glow: "shadow-[0_18px_48px_rgba(171,83,41,0.18)]",
    border: "border-ember/20",
  },
  lichen: {
    accent: "text-lichen",
    icon: "bg-lichen-soft text-lichen",
    glow: "shadow-[0_18px_48px_rgba(110,139,87,0.16)]",
    border: "border-lichen/20",
  },
  gold: {
    accent: "text-[#F0C36A]",
    icon: "bg-[#f0c36a24] text-[#F0C36A]",
    glow: "shadow-[0_18px_48px_rgba(240,195,106,0.13)]",
    border: "border-[#f0c36a24]",
  },
  slate: {
    accent: "text-[#9DB6C0]",
    icon: "bg-[#9db6c024] text-[#9DB6C0]",
    glow: "shadow-[0_18px_48px_rgba(157,182,192,0.13)]",
    border: "border-[#9db6c024]",
  },
}

const VISUAL_ICONS: Record<StatsPreviewVisualKind, IconType> = {
  trend: FiTrendingUp,
  profile: FiCompass,
  outcome: FiTarget,
  cadence: FiCalendar,
}

export default function StatsPreviewCard({ card }: StatsPreviewCardProps) {
  const Icon = VISUAL_ICONS[card.visualKind]
  const tone = TONE_STYLES[card.tone]

  return (
    <Link
      to={card.path}
      aria-label={`Open ${card.title} stats`}
      className={`group block rounded-[30px] border ${tone.border} bg-[#171718] px-5 py-5 text-left text-white ${tone.glow} transition duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-[#1B1B1D] active:translate-y-0`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-white">{card.title}</h2>
          <p className={`mt-1 text-sm font-semibold ${tone.accent}`}>{card.descriptor}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className={`flex h-9 w-9 items-center justify-center rounded-full ${tone.icon}`}>
            <Icon className="h-4 w-4" />
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-stone-400 transition-colors group-hover:text-white">
            <FiChevronRight className="h-4 w-4" />
          </span>
        </div>
      </div>

      <div className="mt-5 flex items-end justify-between gap-5">
        <div className="min-w-0 flex-1">
          <p className="text-[1.65rem] font-bold leading-none text-white">{card.primaryMetric}</p>
          <p className="mt-2 text-sm leading-5 text-stone-400">{card.secondaryText}</p>
        </div>

        <StatsPreviewVisual kind={card.visualKind} tone={card.tone} />
      </div>
    </Link>
  )
}

function StatsPreviewVisual({ kind, tone }: { kind: StatsPreviewVisualKind; tone: StatsPreviewTone }) {
  if (kind === "trend") {
    return (
      <div aria-hidden="true" className="flex h-20 w-24 shrink-0 items-end gap-1.5">
        {[34, 42, 38, 52, 64, 76].map((height, index) => (
          <span
            key={height}
            className={`w-2.5 rounded-full ${index >= 4 ? "bg-ember" : "bg-white/12"}`}
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
    )
  }

  if (kind === "profile") {
    return (
      <div aria-hidden="true" className="grid h-20 w-24 shrink-0 place-items-center">
        <div className="relative h-16 w-16">
          <span className="absolute inset-x-5 top-0 h-full rounded-full bg-lichen/20" />
          <span className="absolute inset-y-5 left-0 w-full rounded-full bg-white/10" />
          <span className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-lichen/35 bg-lichen/20" />
        </div>
      </div>
    )
  }

  if (kind === "outcome") {
    return (
      <div aria-hidden="true" className="grid h-20 w-24 shrink-0 place-items-center">
        <div className="grid h-16 w-16 place-items-center rounded-full border-[7px] border-white/10 border-t-[#F0C36A] border-r-[#F0C36A]">
          <FiActivity className="h-5 w-5 text-[#F0C36A]" />
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
            activeIndexes.has(index) ? TONE_STYLES[tone].icon : "bg-white/10"
          }`}
        />
      ))}
    </div>
  )
}
