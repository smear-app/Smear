import type { ProgressionMetric } from "../../domain/progression/types"
import ProgressionSurface from "./ProgressionSurface"

type ProgressionMetricsGridProps = {
  metrics: ProgressionMetric[]
}

export default function ProgressionMetricsGrid({ metrics }: ProgressionMetricsGridProps) {
  return (
    <ProgressionSurface>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-muted">
        Supporting metrics
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        {metrics.map((metric) => (
          <article
            key={metric.label}
            className="rounded-[22px] bg-stone-bg px-4 py-3 dark:bg-stone-alt"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-muted">
              {metric.label}
            </p>
            <p className="mt-2 text-lg font-semibold text-stone-text">{metric.value}</p>
            <p className="mt-1 text-xs leading-5 text-stone-secondary">{metric.context}</p>
          </article>
        ))}
      </div>
    </ProgressionSurface>
  )
}
