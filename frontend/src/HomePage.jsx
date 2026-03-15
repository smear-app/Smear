import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useLocation, useNavigate } from "react-router-dom"
import BottomNav from "./components/BottomNav"
import ClimbStatusPill from "./components/ClimbStatusPill"
import FloatingActionButton from "./components/FloatingActionButton"
import WelcomeCard from "./components/WelcomeCard"
import { useAuth } from "./context/AuthContext"
import { useGym } from "./context/GymContext"
import { getClimbColorBadgeStyle, getClimbColorName } from "./lib/climbColors"
import { fetchClimbs } from "./lib/climbs"

function HomePage({ onOpenLogClimb, refreshKey }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { activeGym } = useGym()
  const [climbs, setClimbs] = useState([])
  const [loadError, setLoadError] = useState(null)
  const [openingClimbId, setOpeningClimbId] = useState(null)
  const isReturningFromLogbook = location.state?.stackTransition === "back"
  const returningClimbId = location.state?.returnClimbId ?? null

  useEffect(() => {
    if (!user) return
    setLoadError(null)
    fetchClimbs(user.id)
      .then(setClimbs)
      .catch((err) => setLoadError(err.message))
  }, [user, refreshKey])

  return (
    <div className="min-h-screen bg-stone-bg">
      <main
        className="mx-auto max-w-[420px] px-5 pb-32 pt-6"
        style={{
          animation: isReturningFromLogbook ? "home-stack-return 280ms cubic-bezier(0.22, 1, 0.36, 1)" : "none",
        }}
      >
        <style>{`
          @keyframes home-stack-return {
            0% {
              opacity: 0.92;
              transform: translateX(-18px);
            }
            100% {
              opacity: 1;
              transform: translateX(0);
            }
          }
        `}</style>
        <WelcomeCard />

        <section className="mt-6 rounded-[28px] border border-stone-border bg-stone-surface px-5 py-6 shadow-[0_14px_34px_rgba(89,68,51,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <h2 className="min-w-0 whitespace-nowrap text-lg font-bold text-stone-text sm:text-xl">
              Recent Climbs
            </h2>
            <Link
              to="/home/logbook"
              state={{ stackTransition: "forward" }}
              className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-stone-secondary transition-colors duration-200 hover:text-ember sm:gap-2 sm:text-sm"
            >
              <span className="whitespace-nowrap">View All &rarr;</span>
              <span className="rounded-full border border-ember/10 bg-ember-soft px-2 py-0.5 text-xs font-semibold text-ember">
                {climbs.length}
              </span>
            </Link>
          </div>

          {loadError && (
            <p className="mt-4 text-sm text-red-500">{loadError}</p>
          )}

          {!loadError && climbs.length === 0 ? (
            <div className="mt-8 rounded-[24px] border border-dashed border-stone-border bg-stone-alt px-5 py-8 text-center text-sm text-stone-secondary">
              Your logged climbs will appear here.
            </div>
          ) : (
            <div className="mt-3 h-[375px] overflow-y-auto space-y-4 pr-1">
              {climbs.map((climb) => (
                <ClimbCard
                  key={climb.id}
                  climb={climb}
                  isOpening={openingClimbId === climb.id}
                  isReturning={returningClimbId === climb.id}
                  onOpen={() => {
                    if (openingClimbId) {
                      return
                    }

                    setOpeningClimbId(climb.id)

                    window.setTimeout(() => {
                      const goToClimb = () =>
                        navigate(`/climbs/${climb.id}`, {
                          state: { climb, from: "/home", transition: "card-open" },
                        })

                      if (typeof document !== "undefined" && "startViewTransition" in document) {
                        document.startViewTransition(goToClimb)
                        return
                      }

                      goToClimb()
                    }, 80)
                  }}
                />
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

function ClimbCard({ climb, isOpening, isReturning, onOpen }) {
  const badgeStyle = getClimbColorBadgeStyle(climb.climbColor)
  const climbColorName = getClimbColorName(climb.climbColor)
  const isTransitioning = isOpening || isReturning
  const [isPressed, setIsPressed] = useState(false)

  const handlePointerDown = (event) => {
    if (event.pointerType === "mouse") {
      return
    }

    setIsPressed(true)
  }

  const clearPressedState = () => {
    setIsPressed(false)
  }

  return (
    <Link
      to={`/climbs/${climb.id}`}
      state={{ climb, from: "/home", transition: "card-open" }}
      onPointerDown={handlePointerDown}
      onPointerUp={clearPressedState}
      onPointerCancel={clearPressedState}
      onPointerLeave={clearPressedState}
      onClick={(event) => {
        event.preventDefault()
        onOpen()
      }}
      className={`climb-card-interactive block rounded-[24px] border border-stone-border/70 p-4 shadow-[0_10px_24px_rgba(89,68,51,0.05)] transition-colors duration-150 ${
        isPressed ? "bg-[#F0EBE4]" : "bg-stone-surface"
      }`}
      style={{ viewTransitionName: isTransitioning ? "active-climb-card" : "none" }}
    >
      <div
        className={`transition-opacity duration-100 ${
          isOpening ? "opacity-0" : "opacity-100"
        }`}
        style={{
          animation: isReturning ? "climb-card-content-return 140ms ease-out" : "none",
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className="rounded-[18px] border px-3 py-2 text-sm font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]"
              style={badgeStyle}
            >
              {climb.gym_grade}
              {climb.personal_grade && climb.personal_grade !== climb.gym_grade
                ? ` / ${climb.personal_grade}`
                : ""}
            </div>

            <div>
              <p className="mt-1 text-xs text-stone-secondary font-bold">
                {climbColorName}
              </p>
              <p className="mt-0.5 text-xs text-stone-muted">
                {new Date(climb.created_at).toLocaleDateString()}
              </p>
              {climb.gym_name && (
                <p className="mt-0.5 text-xs text-stone-muted">{climb.gym_name}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <ClimbStatusPill sendType={climb.send_type} />
            {/* <div className="rounded-full border border-stone-border bg-stone-alt px-3 py-1 text-xs font-semibold text-stone-secondary">
              {climb.tags.length} tags
            </div> */}
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
      </div>
    </Link>
  )
}

export default HomePage
