import type { PerformanceMetric } from "../../domain/performance/types"
import StatsMetricTile from "../StatsMetricTile"
import ProgressionSurface from "../progression/ProgressionSurface"

type PerformanceMetricGridProps = {
  metrics: PerformanceMetric[]
  periodLabel: string
}

export default function PerformanceMetricGrid({ metrics }: PerformanceMetricGridProps) {
  return (
    <ProgressionSurface>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-muted">Supporting metrics</p>

      <div className="mt-3 grid auto-rows-fr grid-cols-2 gap-2">
        {metrics.map((metric) => (
          <StatsMetricTile
            key={metric.label}
            label={metric.label}
            value={metric.value}
            description={metric.description}
          />
        ))}
      </div>
    </ProgressionSurface>
  )
}
