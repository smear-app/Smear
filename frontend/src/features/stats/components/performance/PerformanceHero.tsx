import ProgressionSurface from "../progression/ProgressionSurface"
import type { PerformanceHero as PerformanceHeroModel } from "../../domain/performance/types"

type PerformanceHeroProps = {
  hero: PerformanceHeroModel
}

const TRACK_COLOR = "color-mix(in srgb, var(--stone-border) 78%, transparent)"
const PROGRESS_COLOR = "var(--ember)"

export default function PerformanceHero({ hero }: PerformanceHeroProps) {
  const radius = 48
  const circumference = 2 * Math.PI * radius
  const progress = (hero.value / 100) * circumference

  return (
    <ProgressionSurface className="py-4">
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <svg viewBox="0 0 120 120" className="h-[116px] w-[116px]" role="img" aria-label={`${hero.label} ${hero.valueLabel}`}>
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={TRACK_COLOR}
              strokeWidth="12"
            />
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={PROGRESS_COLOR}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${progress} ${circumference - progress}`}
              transform="rotate(-90 60 60)"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[1.7rem] font-bold leading-none text-stone-text">{hero.valueLabel}</span>
          </div>
        </div>

        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-muted">{hero.label}</p>
          <p className="mt-2 text-sm leading-6 text-stone-secondary">{hero.description}</p>
        </div>
      </div>
    </ProgressionSurface>
  )
}
