import type { ArchetypeFacetBreakdownItem } from "../../domain/archetype/types"
import ProgressionSurface from "../progression/ProgressionSurface"

type ArchetypeBreakdownListProps = {
  items: ArchetypeFacetBreakdownItem[]
}

export default function ArchetypeBreakdownList({ items }: ArchetypeBreakdownListProps) {
  return (
    <ProgressionSurface>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-muted">Style breakdown</p>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <article key={item.label}>
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium text-stone-text">{item.label}</p>
              <p className="text-sm font-semibold text-stone-secondary">{item.percentageLabel}</p>
            </div>
            <div className="mt-2 h-2 rounded-full bg-stone-bg dark:bg-stone-alt">
              <div
                className="h-full rounded-full bg-ember"
                style={{ width: `${item.value}%`, opacity: 0.82 }}
              />
            </div>
          </article>
        ))}
      </div>
    </ProgressionSurface>
  )
}
