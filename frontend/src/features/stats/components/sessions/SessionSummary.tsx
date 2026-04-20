import type { SessionIdentity, SessionSummaryStat } from "../../domain/sessions/types"
import ProgressionSurface from "../progression/ProgressionSurface"
import SessionIdentityLine from "./SessionIdentityLine"

type SessionSummaryProps = {
  identity: SessionIdentity
  stats: SessionSummaryStat[]
}

export default function SessionSummary({ identity, stats }: SessionSummaryProps) {
  return (
    <ProgressionSurface>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-muted">Selected session</p>
      <SessionIdentityLine identity={identity} />
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
