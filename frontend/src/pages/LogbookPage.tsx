import { Link } from "react-router-dom"
import { FiArrowLeft } from "react-icons/fi"
import BottomNav from "../components/BottomNav"

export default function LogbookPage() {
  return (
    <div className="min-h-screen bg-stone-bg">
      <main className="mx-auto flex min-h-screen max-w-[420px] flex-col px-5 pb-32 pt-6">
        <div className="flex items-center gap-3">
          <Link
            to="/home"
            aria-label="Back to Home"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-stone-border bg-stone-surface text-stone-text shadow-[0_10px_24px_rgba(89,68,51,0.05)] transition-colors duration-200 hover:border-ember/20 hover:text-ember"
          >
            <FiArrowLeft className="h-5 w-5" />
          </Link>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-muted">
              Logbook
            </p>
            <h1 className="mt-1 text-2xl font-bold text-stone-text">Logbook</h1>
          </div>
        </div>

        <div className="mt-6 flex-1 rounded-[28px] border border-dashed border-stone-border bg-stone-surface/70 px-5 py-6 shadow-[0_14px_34px_rgba(89,68,51,0.05)]" />
      </main>

      <BottomNav />
    </div>
  )
}
