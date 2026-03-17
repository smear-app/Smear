import type { Climb } from "../../lib/climbs"

type LogbookCalendarScaffoldProps = {
  climbs: Climb[]
}

function buildCalendarSummary(climbs: Climb[]) {
  const counts = new Map<string, number>()

  for (const climb of climbs) {
    const key = new Date(climb.created_at).toISOString().slice(0, 10)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  return Array.from(counts.entries())
    .sort(([left], [right]) => right.localeCompare(left))
    .slice(0, 6)
}

export default function LogbookCalendarScaffold({ climbs }: LogbookCalendarScaffoldProps) {
  const summary = buildCalendarSummary(climbs)

  return (
    <section className="rounded-[28px] border border-stone-border bg-stone-surface px-5 py-5 shadow-[0_14px_34px_rgba(89,68,51,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-muted">
            Calendar
          </p>
          <h2 className="mt-2 text-lg font-semibold text-stone-text">Scaffolded for expansion</h2>
        </div>
        <div className="rounded-full border border-dashed border-stone-border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-secondary">
          Next
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-stone-secondary">
        Calendar mode is wired to the same logbook dataset, but the rich month interactions are
        intentionally deferred for this refactor.
      </p>

      <div className="mt-5 grid grid-cols-7 gap-2 rounded-[24px] border border-stone-border/80 bg-[#F6F1EA] p-3">
        {Array.from({ length: 35 }, (_, index) => (
          <div
            key={index}
            className="aspect-square rounded-[14px] border border-stone-border/60 bg-stone-surface/80"
          />
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {summary.length === 0 ? (
          <p className="text-sm text-stone-muted">Your logged days will appear here.</p>
        ) : (
          summary.map(([date, count]) => (
            <div
              key={date}
              className="flex items-center justify-between rounded-[18px] border border-stone-border/70 bg-stone-alt px-3 py-2 text-sm text-stone-secondary"
            >
              <span>{new Date(date).toLocaleDateString()}</span>
              <span className="font-semibold text-stone-text">{count} climbs</span>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
