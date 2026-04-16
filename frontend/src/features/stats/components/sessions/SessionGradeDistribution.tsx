import type { SessionGradeDistributionItem } from "../../domain/sessions/types"

type SessionGradeDistributionProps = {
  items: SessionGradeDistributionItem[]
}

export default function SessionGradeDistribution({ items }: SessionGradeDistributionProps) {
  const maxCount = Math.max(...items.map((item) => item.count))

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-muted">Grade distribution</p>
      <div className="mt-3 space-y-2.5">
        {items.map((item) => (
          <article key={item.label} className="grid grid-cols-[2rem_minmax(0,1fr)_1.5rem] items-center gap-3">
            <span className="text-sm font-medium text-stone-text">{item.label}</span>
            <div className="h-2 rounded-full bg-stone-bg dark:bg-stone-alt">
              <div className="h-full rounded-full bg-ember" style={{ width: `${(item.count / maxCount) * 100}%`, opacity: 0.8 }} />
            </div>
            <span className="text-right text-sm font-semibold text-stone-secondary">{item.count}</span>
          </article>
        ))}
      </div>
    </div>
  )
}
