import BottomNav from "./components/BottomNav"
import FloatingActionButton from "./components/FloatingActionButton"
import WelcomeCard from "./components/WelcomeCard"

function HomePage({ onOpenLogClimb, savedClimbs }) {
  return (
    <div className="min-h-screen bg-[#f5f5f2]">
      <main className="mx-auto flex min-h-screen max-w-[420px] flex-col px-5 pb-32 pt-6">
        <WelcomeCard />

        <section className="mt-6 rounded-[28px] bg-white px-5 py-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-600">
            Today
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
            Climb smarter.
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Log sessions, compare grades, and capture how each send really felt.
          </p>
        </section>

        <section className="mt-6 flex-1 rounded-[28px] bg-white px-5 py-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Saved Climbs
              </p>
              <h2 className="mt-2 text-xl font-bold text-slate-900">
                Debug Activity
              </h2>
            </div>
            <div className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
              {savedClimbs.length}
            </div>
          </div>

          {savedClimbs.length === 0 ? (
            <div className="mt-8 rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">
              Your saved climb logs will appear here.
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {savedClimbs
                .slice()
                .reverse()
                .map((climb) => (
                  <article
                    key={climb.createdAt}
                    className="rounded-[24px] bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {climb.gymGrade || "No gym grade"} /{" "}
                          {climb.feltLike || "No felt-like grade"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {climb.sendType || "No send type"} •{" "}
                          {new Date(climb.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                        {climb.tags.length} tags
                      </div>
                    </div>

                    {climb.photo ? (
                      <img
                        src={climb.photo}
                        alt="Logged climb"
                        className="mt-4 h-24 w-full rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="mt-4 flex h-24 items-center justify-center rounded-2xl bg-slate-200 text-xs font-medium text-slate-500">
                        No photo added
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2">
                      {climb.tags.map((tag) => (
                        <span
                          key={`${climb.createdAt}-${tag}`}
                          className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600"
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
