import ProgressionSurface from "../progression/ProgressionSurface"
import type { PerformanceGradeBand } from "../../domain/performance/types"

type GradeBandPerformanceProps = {
  bands: PerformanceGradeBand[]
  periodLabel: string
}

export default function GradeBandPerformance({ bands, periodLabel }: GradeBandPerformanceProps) {
  return (
    <ProgressionSurface>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-muted">Performance by grade band</p>
      <p className="mt-1 text-sm leading-5 text-stone-secondary">Send efficiency by grade in the {periodLabel}.</p>
      <div className="mt-4 space-y-3">
        {bands.map((band) => (
          <article key={band.label}>
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium text-stone-text">{band.label}</p>
              <p className="text-sm font-semibold text-stone-secondary">{band.sendRate}% send</p>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-stone-bg/85 dark:bg-stone-alt">
              <div
                className="h-full rounded-full bg-ember"
                style={{ width: `${band.sendRate}%`, opacity: 0.68 }}
              />
            </div>
          </article>
        ))}
      </div>
    </ProgressionSurface>
  )
}
