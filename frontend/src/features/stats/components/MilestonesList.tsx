import { formatRelativeTime } from "../../../lib/relativeTime"
import type { StatsMilestone } from "../domain/milestones/types"
import ProgressionSurface from "./progression/ProgressionSurface"

type MilestonesListProps = {
  milestones: StatsMilestone[]
  title?: string
  emptyTitle?: string
  emptyBody?: string
}

export default function MilestonesList({
  milestones,
  title = "Progress markers",
  emptyTitle = "No milestones yet",
  emptyBody = "Keep logging climbs to unlock progress markers.",
}: MilestonesListProps) {
  return (
    <ProgressionSurface>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-muted">Milestones</p>
        <h2 className="mt-1 text-lg font-semibold text-stone-text">{title}</h2>
      </div>

      {milestones.length > 0 ? (
        <div className="mt-4">
          {milestones.map((milestone, index) => (
            <article
              key={milestone.id}
              className={`flex items-center justify-between gap-3 py-3 ${
                index > 0 ? "border-t border-stone-border/80 dark:border-white/[0.06]" : ""
              }`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-ember/25 bg-ember-soft">
                  <span className="h-1.5 w-1.5 rounded-full bg-ember" />
                </span>
                <h3 className="truncate text-sm font-semibold text-stone-text">{milestone.title}</h3>
              </div>

              <span className="shrink-0 text-xs font-semibold text-stone-secondary">
                {formatRelativeTime(milestone.achievedAt)}
              </span>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-[18px] border border-dashed border-stone-border/90 bg-stone-bg/60 px-4 py-5 text-center dark:border-white/[0.08] dark:bg-stone-alt/50">
          <p className="text-sm font-semibold text-stone-secondary">{emptyTitle}</p>
          <p className="mt-1 text-sm leading-5 text-stone-muted">{emptyBody}</p>
        </div>
      )}
    </ProgressionSurface>
  )
}
