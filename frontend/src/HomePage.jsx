import { useEffect, useState } from "react"
import BottomNav from "./components/BottomNav"
import FloatingActionButton from "./components/FloatingActionButton"
import WelcomeCard from "./components/WelcomeCard"
import { useAuth } from "./context/AuthContext"
import { fetchClimbs } from "./lib/climbs"

function HomePage({ onOpenLogClimb, refreshKey }) {
  const { user } = useAuth()
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
    <div className="min-h-screen bg-[#f5f5f2]">
      <main className="mx-auto flex min-h-screen max-w-[420px] flex-col px-5 pb-32 pt-6">
        <WelcomeCard />

        <section className="mt-6 flex-1 rounded-[28px] bg-white px-5 py-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Recent Climbs</h2>
            <div className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
              {climbs.length}
            </div>
          </div>

          {loadError && (
            <p className="mt-4 text-sm text-red-500">{loadError}</p>
          )}

          {!loadError && climbs.length === 0 ? (
            <div className="mt-8 rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">
              Your logged climbs will appear here.
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {climbs.map((climb) => (
                <article
                  key={climb.id}
                  className="rounded-[24px] bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {climb.gym_grade}
                        {climb.personal_grade && climb.personal_grade !== climb.gym_grade
                          ? ` / ${climb.personal_grade}`
                          : ""}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 capitalize">
                        {climb.send_type} •{" "}
                        {new Date(climb.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                      {climb.tags.length} tags
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {climb.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 capitalize"
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

      <FloatingActionButton onClick={onOpenLogClimb} />
      <BottomNav />
    </div>
  )
}

export default HomePage
