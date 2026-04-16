import BackButton from "../../../components/BackButton"
import BottomNav from "../../../components/BottomNav"
import type { StatsCardConfig } from "../domain/types"

type StatsDetailPlaceholderPageProps = {
  card: StatsCardConfig
}

export default function StatsDetailPlaceholderPage({ card }: StatsDetailPlaceholderPageProps) {
  return (
    <div className="app-safe-shell min-h-screen bg-stone-bg">
      <main className="app-safe-shell__main mx-auto flex min-h-screen max-w-[420px] flex-col px-5 pb-32 pt-6">
        <div className="flex items-center gap-3">
          <BackButton to="/stats" label="Back to Stats" ariaLabel="Back to Stats" size="sm" />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase text-stone-muted">Stats</p>
            <h1 className="truncate text-xl font-bold text-stone-text">{card.title}</h1>
          </div>
        </div>

        <section className="mt-6 rounded-[30px] border border-stone-border bg-stone-surface px-5 py-6 shadow-[0_14px_34px_rgba(89,68,51,0.08)]">
          <p className="text-sm font-semibold text-ember">{card.descriptor}</p>
          <p className="mt-3 text-sm leading-6 text-stone-secondary">{card.detailDescription}</p>
        </section>
      </main>

      <BottomNav />
    </div>
  )
}
