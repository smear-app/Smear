import ProgressionSurface from "../progression/ProgressionSurface"
import type { PerformanceOutcomeItem } from "../../domain/performance/types"
import OutcomeDonutBreakdown from "../OutcomeDonutBreakdown"

type OutcomeBreakdownProps = {
  items: PerformanceOutcomeItem[]
  periodLabel: string
}

export default function OutcomeBreakdown({ items, periodLabel }: OutcomeBreakdownProps) {
  return (
    <ProgressionSurface>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-muted">Outcome breakdown</p>
      <p className="mt-1 text-sm leading-5 text-stone-secondary">How logged attempts resolved in the {periodLabel}.</p>
      <OutcomeDonutBreakdown items={items} centerLabel="attempts" ariaLabel="Outcome breakdown donut chart" />
    </ProgressionSurface>
  )
}
