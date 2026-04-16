import type { ArchetypeFacetBreakdownItem } from "../../domain/archetype/types"
import ProgressionSurface from "../progression/ProgressionSurface"

type ArchetypeStrengthsSectionProps = {
  strengths: ArchetypeFacetBreakdownItem[]
  growthAreas: ArchetypeFacetBreakdownItem[]
}

export default function ArchetypeStrengthsSection({
  strengths,
  growthAreas,
}: ArchetypeStrengthsSectionProps) {
  return (
    <ProgressionSurface>
      <div className="grid grid-cols-2 gap-4">
        <FacetColumn title="Strengths" items={strengths} tone="strong" />
        <FacetColumn title="Growth Areas" items={growthAreas} tone="muted" />
      </div>
    </ProgressionSurface>
  )
}

function FacetColumn({
  title,
  items,
  tone,
}: {
  title: string
  items: ArchetypeFacetBreakdownItem[]
  tone: "strong" | "muted"
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-muted">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <div
            key={item.label}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              tone === "strong"
                ? "bg-ember-soft text-ember"
                : "bg-stone-bg text-stone-secondary dark:bg-stone-alt"
            }`}
          >
            {item.label}
          </div>
        ))}
      </div>
    </div>
  )
}
