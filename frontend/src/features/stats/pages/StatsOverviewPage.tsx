import BottomNav from "../../../components/BottomNav"
import StatsPreviewCard from "../components/StatsPreviewCard"
import { statsCards } from "../config/statsCards"

export default function StatsOverviewPage() {
  return (
    <div className="app-safe-shell min-h-screen bg-stone-bg">
      <main className="app-safe-shell__main mx-auto min-h-screen max-w-[420px] px-5 pb-32 pt-6">
        <h1 className="text-2xl font-bold text-stone-text">Stats</h1>

        <section className="mt-4 flex flex-col gap-3.5" aria-label="Stats categories">
          {statsCards.map((card) => (
            <StatsPreviewCard key={card.id} card={card} />
          ))}
        </section>
      </main>

      <BottomNav />
    </div>
  )
}
