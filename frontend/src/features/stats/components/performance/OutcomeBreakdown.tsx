import ProgressionSurface from "../progression/ProgressionSurface"
import type { PerformanceOutcomeItem } from "../../domain/performance/types"

type OutcomeBreakdownProps = {
  items: PerformanceOutcomeItem[]
}

const TONE_STYLES: Record<PerformanceOutcomeItem["tone"], string> = {
  flash: "var(--ember)",
  send: "color-mix(in srgb, var(--ember) 76%, white 24%)",
  project: "color-mix(in srgb, var(--ember) 34%, var(--stone-surface) 66%)",
  unfinished: "color-mix(in srgb, var(--stone-border) 90%, transparent)",
}

export default function OutcomeBreakdown({ items }: OutcomeBreakdownProps) {
  return (
    <ProgressionSurface>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-muted">Outcome breakdown</p>

      <div className="mt-4 h-3 overflow-hidden rounded-full bg-stone-bg dark:bg-stone-alt">
        {items.map((item) => (
          <div
            key={item.label}
            className="h-full first:rounded-l-full last:rounded-r-full"
            style={{
              width: `${item.percentage}%`,
              backgroundColor: TONE_STYLES[item.tone],
              display: "inline-block",
            }}
          />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
        {items.map((item) => (
          <article key={item.label} className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 rounded-[3px]"
                style={{ backgroundColor: TONE_STYLES[item.tone] }}
              />
              <span className="truncate text-sm font-medium text-stone-text">{item.label}</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-stone-text">{item.percentage}%</p>
              <p className="text-[11px] text-stone-secondary">{item.count}</p>
            </div>
          </article>
        ))}
      </div>
    </ProgressionSurface>
  )
}
