import BottomNav from "../../../components/BottomNav"
import StatsPreviewCard from "../components/StatsPreviewCard"
import { statsCards } from "../config/statsCards"

export default function StatsOverviewPage() {
  return (
    <div className="app-safe-shell min-h-screen bg-stone-bg">
      <main className="app-safe-shell__main mx-auto min-h-screen max-w-[420px] px-5 pb-32 pt-6">
        <div>
          <p className="text-[11px] font-semibold uppercase text-stone-muted">Stats</p>
          <h1 className="mt-1 text-2xl font-bold text-stone-text">Climbing overview</h1>
          <p className="mt-2 text-sm leading-6 text-stone-secondary">
            A quick read on progress, style, performance, and session rhythm.
          </p>
        </div>

        <section className="mt-5 flex flex-col gap-3.5" aria-label="Stats categories">
          {statsCards.map((card) => (
            <StatsPreviewCard key={card.id} card={card} />
          ))}
        </section>
      </main>

      <BottomNav />
    </div>
  )
}
