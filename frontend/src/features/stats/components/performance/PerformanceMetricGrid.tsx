import type { PerformanceMetric } from "../../domain/performance/types"
import ProgressionSurface from "../progression/ProgressionSurface"

type PerformanceMetricGridProps = {
  metrics: PerformanceMetric[]
}

export default function PerformanceMetricGrid({ metrics }: PerformanceMetricGridProps) {
  return (
    <ProgressionSurface>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-muted">Supporting metrics</p>

      <div className="mt-3 grid auto-rows-fr grid-cols-2 gap-2">
        {metrics.map((metric) => (
          <article
            key={metric.label}
            className="grid h-full min-h-[94px] grid-rows-[auto_auto_minmax(2rem,auto)] rounded-[20px] bg-stone-bg px-3.5 py-2.5 dark:bg-stone-alt"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-muted">
              {metric.label}
            </p>
            <p className="mt-1.5 self-start text-[1.125rem] font-semibold leading-none text-stone-text">
              {metric.value}
            </p>
            <p
              className="mt-1 text-[11px] leading-4 text-stone-secondary"
              style={{
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: 2,
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {metric.description}
            </p>
          </article>
        ))}
      </div>
    </ProgressionSurface>
  )
}
