import type { SessionOutcomeItem } from "../../domain/sessions/types"
import OutcomeDonutBreakdown from "../OutcomeDonutBreakdown"

type SessionOutcomeBreakdownProps = {
  items: SessionOutcomeItem[]
  totalCount: number
}

export default function SessionOutcomeBreakdown({ items, totalCount }: SessionOutcomeBreakdownProps) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-muted">Outcome breakdown</p>
      <OutcomeDonutBreakdown
        items={items}
        totalCount={totalCount}
        centerLabel="climbs"
        ariaLabel="Session outcome breakdown donut chart"
      />
    </div>
  )
}
