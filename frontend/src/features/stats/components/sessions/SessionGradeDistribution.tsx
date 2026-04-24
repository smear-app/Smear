import type { SessionGradeDistributionItem } from "../../domain/sessions/types"
import { OUTCOME_TONE_STYLES } from "../outcomeToneStyles"

type SessionGradeDistributionProps = {
  items: SessionGradeDistributionItem[]
}

export default function SessionGradeDistribution({ items }: SessionGradeDistributionProps) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-muted">Grade distribution</p>
      <div className="mt-3 space-y-2.5">
        {items.length > 0 ? (
          items.map((item) => (
            <article key={item.label} className="grid grid-cols-[2rem_minmax(0,1fr)_1.5rem] items-center gap-3">
              <span className="text-sm font-medium text-stone-text">{item.label}</span>
              <div className="h-2 rounded-full bg-stone-bg dark:bg-stone-alt">
                <div
                  className="flex h-full overflow-hidden rounded-full"
                  style={{ width: `${item.widthPercent}%`, opacity: 0.86 }}
                  aria-label={`${item.label} outcome composition`}
                >
                  {item.segments
                    .filter((segment) => segment.count > 0)
                    .map((segment) => (
                      <span
                        key={segment.tone}
                        aria-hidden="true"
                        className="h-full"
                        style={{
                          width: `${segment.percentage}%`,
                          minWidth: segment.percentage > 0 ? 2 : undefined,
                          backgroundColor: OUTCOME_TONE_STYLES[segment.tone],
                        }}
                      />
                    ))}
                </div>
              </div>
              <span className="text-right text-sm font-semibold text-stone-secondary">{item.count}</span>
            </article>
          ))
        ) : (
          <p className="text-sm text-stone-muted">No graded climbs</p>
        )}
      </div>
    </div>
  )
}
