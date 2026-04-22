import ProgressionSurface from "../progression/ProgressionSurface"
import type { PerformancePyramidBand } from "../../domain/performance/types"

type GradePyramidProps = {
  bands: PerformancePyramidBand[]
  periodLabel: string
}

export default function GradePyramid({ bands, periodLabel }: GradePyramidProps) {
  const maxCount = Math.max(0, ...bands.map((band) => band.count))

  return (
    <ProgressionSurface>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-muted">Grade pyramid</p>
      <p className="mt-1 text-xs leading-4 text-stone-secondary">Completed sends by grade in the {periodLabel}.</p>

      <div className="mt-3 space-y-2.5">
        {bands.map((band) => {
          const width = maxCount === 0 ? "0%" : `${(band.count / maxCount) * 100}%`

          return (
            <article key={band.label} className="grid grid-cols-[2rem_minmax(0,1fr)_1.5rem] items-center gap-3">
              <span className="text-sm font-medium text-stone-text">{band.label}</span>
              <div className="h-2 rounded-full bg-stone-bg dark:bg-stone-alt">
                <div
                  className="h-full rounded-full bg-ember"
                  style={{ width, opacity: 0.8 }}
                />
              </div>
              <span className="text-right text-sm font-semibold text-stone-secondary">{band.count}</span>
            </article>
          )
        })}
      </div>
    </ProgressionSurface>
  )
}
