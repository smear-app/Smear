import type { ArchetypeCategoryOutcomeBreakdownItem, ArchetypeOutcomeTone } from "../../domain/archetype/types"
import ProgressionSurface from "../progression/ProgressionSurface"

type ArchetypeBreakdownListProps = {
  items: ArchetypeCategoryOutcomeBreakdownItem[]
}

const TONE_STYLES: Record<ArchetypeOutcomeTone, string> = {
  flash: "var(--ember)",
  send: "color-mix(in srgb, var(--ember) 76%, white 24%)",
  attempted: "color-mix(in srgb, var(--stone-secondary) 58%, var(--stone-border) 42%)",
}

const LEGEND_ITEMS: Array<{ tone: ArchetypeOutcomeTone; label: string }> = [
  { tone: "flash", label: "Flash" },
  { tone: "send", label: "Send" },
  { tone: "attempted", label: "Attempted" },
]

function shouldRenderInside(percentage: number) {
  return percentage >= 16
}

export default function ArchetypeBreakdownList({ items }: ArchetypeBreakdownListProps) {
  return (
    <ProgressionSurface>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-muted">Style breakdown</p>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
        {LEGEND_ITEMS.map((item) => (
          <div key={item.tone} className="flex items-center gap-2 text-[11px] font-medium text-stone-secondary">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 rounded-[3px]"
              style={{ backgroundColor: TONE_STYLES[item.tone] }}
            />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-4">
        {items.map((item) => (
          <article key={item.label}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-stone-text">{item.label}</p>
              </div>
              <p className="shrink-0 text-[11px] font-medium text-stone-secondary">{item.totalCount} climbs</p>
            </div>
            <div className="mt-2.5 flex h-5 overflow-hidden rounded-full bg-stone-bg dark:bg-stone-alt">
              {item.outcomes.map((outcome) => (
                <div
                  key={`${item.label}-${outcome.tone}`}
                  className="relative h-full first:rounded-l-full last:rounded-r-full"
                  style={{
                    width: `${outcome.percentage}%`,
                    backgroundColor: TONE_STYLES[outcome.tone],
                    opacity: outcome.tone === "attempted" ? 0.92 : 0.84,
                  }}
                >
                  {shouldRenderInside(outcome.percentage) ? (
                    <span
                      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-[10px] font-semibold text-stone-surface"
                      style={{ textShadow: "0 1px 2px rgba(41, 31, 21, 0.24)" }}
                    >
                      {outcome.percentageLabel}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
            <div className="mt-1 flex min-h-[12px] items-start">
              {item.outcomes.map((outcome) => (
                <div
                  key={`${item.label}-${outcome.tone}-label`}
                  className="flex justify-center"
                  style={{ width: `${outcome.percentage}%` }}
                >
                  {!shouldRenderInside(outcome.percentage) ? (
                    <span
                      className="whitespace-nowrap text-[10px] font-semibold leading-none"
                      style={{ color: TONE_STYLES[outcome.tone] }}
                    >
                      {outcome.percentageLabel}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </ProgressionSurface>
  )
}
