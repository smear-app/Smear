import ProgressionSurface from "../progression/ProgressionSurface"
import StatsMetricTile from "../StatsMetricTile"
import type { SessionTrendMetric } from "../../domain/sessions/types"

type SessionTrendMetricsProps = {
  metrics: SessionTrendMetric[]
}

export default function SessionTrendMetrics({ metrics }: SessionTrendMetricsProps) {
  return (
    <ProgressionSurface>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-muted">Trend summary</p>
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
