import type { ArchetypeTrendItem } from "../../domain/archetype/types"
import ProgressionSurface from "../progression/ProgressionSurface"

type ArchetypeTrendCardProps = {
  items: ArchetypeTrendItem[]
}

export default function ArchetypeTrendCard({ items }: ArchetypeTrendCardProps) {
  return (
    <ProgressionSurface className="py-4">
      <div className="flex flex-wrap items-center gap-2.5">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-full bg-stone-bg px-3 py-1.5 text-xs font-medium text-stone-secondary dark:bg-stone-alt"
          >
            <span className="font-semibold text-stone-text">{item.label}</span>
            <span className="ml-1 text-ember">{item.change}</span>
          </div>
        ))}
      </div>
    </ProgressionSurface>
  )
}
