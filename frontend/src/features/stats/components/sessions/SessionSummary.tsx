import type { SessionSummaryStat } from "../../domain/sessions/types"
import ProgressionSurface from "../progression/ProgressionSurface"

type SessionSummaryProps = {
  stats: SessionSummaryStat[]
}

export default function SessionSummary({ stats }: SessionSummaryProps) {
  return (
    <ProgressionSurface>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-muted">Selected session</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {stats.map((stat) => (
          <article
            key={stat.label}
            className="rounded-[20px] bg-stone-bg px-3.5 py-3 dark:bg-stone-alt"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-muted">{stat.label}</p>
            <p className="mt-2 text-[1.2rem] font-semibold leading-none text-stone-text">{stat.value}</p>
          </article>
        ))}
      </div>
    </ProgressionSurface>
  )
}
