import { useEffect, useState } from "react"
import BottomNav from "./components/BottomNav"
import FloatingActionButton from "./components/FloatingActionButton"
import WelcomeCard from "./components/WelcomeCard"
import { useAuth } from "./context/AuthContext"
import { useGym } from "./context/GymContext"
import { fetchClimbs } from "./lib/climbs"

function HomePage({ onOpenLogClimb, refreshKey }) {
  const { user } = useAuth()
  const { activeGym } = useGym()
  const [climbs, setClimbs] = useState([])
  const [loadError, setLoadError] = useState(null)

  useEffect(() => {
    if (!user) return
    setLoadError(null)
    fetchClimbs(user.id)
      .then(setClimbs)
      .catch((err) => setLoadError(err.message))
  }, [user, refreshKey])

  return (
    <div className="min-h-screen bg-stone-bg">
      <main className="mx-auto flex min-h-[450px] max-w-[420px] flex-col px-5 pb-32 pt-6">
        <WelcomeCard />

        <section className="mt-6 flex-1 rounded-[28px] border border-stone-border bg-stone-surface px-5 py-6 shadow-[0_14px_34px_rgba(89,68,51,0.08)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-muted">
                Recent Climbs
              </p>
              <h2 className="mt-1 text-xl font-bold text-stone-text">Your latest sessions</h2>
            </div>
            <div className="rounded-full border border-ember/10 bg-ember-soft px-3 py-1 text-sm font-semibold text-ember">
              {climbs.length}
            </div>
          </div>

          {loadError && (
            <p className="mt-4 text-sm text-red-500">{loadError}</p>
          )}

          {!loadError && climbs.length === 0 ? (
            <div className="mt-8 rounded-[24px] border border-dashed border-stone-border bg-stone-alt px-5 py-8 text-center text-sm text-stone-secondary">
              Your logged climbs will appear here.
            </div>
          ) : (
            <div className="mt-6 min-h-0 flex-1 overflow-y-auto space-y-4 pr-1">
              {climbs.map((climb) => (
                <article
                  key={climb.id}
                  className="rounded-[24px] border border-stone-border/70 bg-stone-surface p-4 shadow-[0_10px_24px_rgba(89,68,51,0.05)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-[18px] bg-stone-alt px-3 py-2 text-sm font-semibold text-ember shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
                        {climb.gym_grade}
                        {climb.personal_grade && climb.personal_grade !== climb.gym_grade
                          ? ` / ${climb.personal_grade}`
                          : ""}
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-stone-text">
                          {climb.tags[0] ? `${climb.tags[0]} session` : "Logged climb"}
                        </p>
                        <p className="mt-1 text-xs text-stone-secondary capitalize">
                          {climb.send_type} • {new Date(climb.created_at).toLocaleDateString()}
                        </p>
                        {climb.gym_name && (
                          <p className="mt-0.5 text-xs text-stone-muted">{climb.gym_name}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <StatusPill sendType={climb.send_type} />
                      <div className="rounded-full border border-stone-border bg-stone-alt px-3 py-1 text-xs font-semibold text-stone-secondary">
                        {climb.tags.length} tags
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {climb.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-stone-border/70 bg-stone-alt px-3 py-1 text-xs font-medium text-stone-secondary capitalize"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <FloatingActionButton onClick={onOpenLogClimb} disabled={!activeGym} />
      <BottomNav />
    </div>
  )
}

function StatusPill({ sendType }) {
  const normalized = sendType?.toLowerCase()

  if (normalized === "flash") {
    return (
      <div className="rounded-full border border-lichen/10 bg-lichen-soft px-3 py-1 text-xs font-semibold text-lichen">
        Flash
      </div>
    )
  }

  if (normalized === "send") {
    return (
      <div className="rounded-full border border-ember/10 bg-ember-soft px-3 py-1 text-xs font-semibold text-ember">
        Send
      </div>
    )
  }

  return (
    <div className="rounded-full border border-stone-border bg-stone-alt px-3 py-1 text-xs font-semibold text-stone-secondary">
      Attempt
    </div>
  )
}

export default HomePage
