import type { ProgressionMilestone } from "../../domain/progression/types"
import { formatRelativeTime } from "../../../../lib/relativeTime"
import ProgressionSurface from "./ProgressionSurface"

type ProgressionMilestonesListProps = {
  milestones: ProgressionMilestone[]
}

export default function ProgressionMilestonesList({ milestones }: ProgressionMilestonesListProps) {
  return (
    <ProgressionSurface>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-muted">
            Milestones
          </p>
          <h2 className="mt-1 text-lg font-semibold text-stone-text">Progress markers</h2>
        </div>
      </div>

      <div className="mt-4 space-y-0">
        {milestones.map((milestone, index) => (
          <article
            key={`${milestone.occurredAt}-${milestone.title}`}
            className={`relative pl-8 ${index > 0 ? "border-t border-stone-border/80 pt-4 dark:border-white/[0.06]" : ""} ${
              index < milestones.length - 1 ? "pb-4" : ""
            }`}
          >
            <span className="absolute left-0 top-1.5 flex h-4 w-4 items-center justify-center rounded-full border border-ember/25 bg-ember-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-ember" />
            </span>

            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-stone-text">{milestone.title}</h3>
                <p className="mt-1 text-sm leading-6 text-stone-secondary">{milestone.detail}</p>
              </div>

              <span className="shrink-0 rounded-full bg-stone-bg px-2.5 py-1 text-[11px] font-semibold text-stone-secondary dark:bg-stone-alt">
                <span className="whitespace-nowrap">{formatRelativeTime(milestone.occurredAt)}</span>
              </span>
            </div>
          </article>
        ))}
      </div>
    </ProgressionSurface>
  )
}
