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
      <p className="mt-1 text-sm leading-5 text-stone-secondary">Completed sends by grade in the {periodLabel}.</p>

      <div className="mt-4 space-y-2.5">
        {bands.map((band) => {
          const width = maxCount === 0 ? "0%" : `${(band.count / maxCount) * 100}%`

          return (
            <article key={band.label} className="grid grid-cols-[2.25rem_minmax(0,1fr)_2rem] items-center gap-3">
              <span className="text-sm font-medium text-stone-text">{band.label}</span>
              <div className="flex justify-center">
                <div className="flex h-8 w-full max-w-[14rem] items-center justify-center rounded-full bg-stone-bg dark:bg-stone-alt">
                  <div
                    className="h-5 rounded-full bg-ember"
                    style={{ width, opacity: 0.82 }}
                  />
                </div>
              </div>
              <span className="text-right text-sm font-semibold text-stone-secondary">{band.count}</span>
            </article>
          )
        })}
      </div>
    </ProgressionSurface>
  )
}
