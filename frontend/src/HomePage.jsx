import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useLocation, useNavigate } from "react-router-dom"
import BottomNav from "./components/BottomNav"
import FloatingActionButton from "./components/FloatingActionButton"
import ClimbTileActionsMenu from "./components/logbook/ClimbTileActionsMenu"
import WelcomeCard from "./components/WelcomeCard"
import CompactClimbTileRow from "./components/logbook/CompactClimbTileRow"
import { useGym } from "./context/GymContext"

function HomePage({ onOpenLogClimb, onEditClimb, onDeleteClimb, climbs, totalClimbs, loadError }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { activeGym } = useGym()
  const [openingClimbId, setOpeningClimbId] = useState(null)
  const [returnTransitionClimbId, setReturnTransitionClimbId] = useState(() => location.state?.returnClimbId ?? null)
  const isReturningFromLogbook = location.state?.stackTransition === "back"
  const returningClimbId = location.state?.returnClimbId ?? null
  const returningClimb = location.state?.returnClimb ?? null

  const displayClimbs = useMemo(
    () =>
      returningClimb && !climbs.some((climb) => climb.id === returningClimb.id)
        ? [returningClimb, ...climbs]
        : climbs,
    [climbs, returningClimb],
  )

  useEffect(() => {
    if (!returningClimbId) {
      setReturnTransitionClimbId(null)
      return undefined
    }

    setReturnTransitionClimbId(returningClimbId)
    const timeoutId = window.setTimeout(() => {
      setReturnTransitionClimbId(null)
    }, 220)

    return () => window.clearTimeout(timeoutId)
  }, [returningClimbId])

  useEffect(() => {
    if (!returningClimbId) {
      setReturnTransitionClimbId(null)
      return undefined
    }

    setReturnTransitionClimbId(returningClimbId)
    const timeoutId = window.setTimeout(() => {
      setReturnTransitionClimbId(null)
    }, 220)

    return () => window.clearTimeout(timeoutId)
  }, [returningClimbId])

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

        <section className="mt-6 rounded-[28px] border border-stone-border bg-stone-surface px-5 py-5 shadow-[0_14px_34px_rgba(89,68,51,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <h2 className="min-w-0 whitespace-nowrap text-lg font-bold text-stone-text sm:text-xl">
              Recent Climbs
            </h2>
            <Link
              to="/home/logbook"
              state={{ stackTransition: "forward" }}
              className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-stone-secondary transition-colors duration-200 hover:text-ember dark:hover:text-ember sm:gap-2 sm:text-sm"
            >
              <span className="whitespace-nowrap">Logbook &rarr;</span>
              <span className="rounded-full border border-ember/10 bg-ember-soft px-2 py-0.5 text-xs font-semibold text-ember">
                {totalClimbs}
              </span>
            </Link>
          </div>

          {loadError && (
            <p className="mt-4 text-sm text-red-500">{loadError}</p>
          )}

          {!loadError && displayClimbs.length === 0 ? (
            <div className="mt-8 rounded-[24px] border border-dashed border-stone-border bg-stone-alt px-5 py-8 text-center text-sm text-stone-secondary">
              Your logged climbs will appear here.
            </div>
          ) : (
            <div className="mt-2.5 h-[375px] overflow-y-auto space-y-2.5 pr-1">
              {displayClimbs.map((climb) => (
                <ClimbCard
                  key={climb.id}
                  climb={climb}
                  onDelete={onDeleteClimb}
                  onEdit={onEditClimb}
                  isOpening={openingClimbId === climb.id}
                  isReturning={returnTransitionClimbId === climb.id}
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

function formatHomeClimbDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "numeric",
    day: "numeric",
  })
}

function ClimbCard({ climb, isOpening, isReturning, onDelete, onEdit, onOpen }) {
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
    <div className="relative">
      <ClimbTileActionsMenu
        onEdit={() => onEdit(climb)}
        onDelete={() => onDelete(climb.id)}
      />
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
        className={`climb-card-interactive block rounded-[20px] border border-stone-border/70 px-4 py-3 pr-12 shadow-[0_10px_24px_rgba(89,68,51,0.05)] transition-colors duration-150 ${
          isPressed ? "bg-[#F0EBE4]" : "bg-stone-alt"
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
          <CompactClimbTileRow
            climb={climb}
            density="home"
            metaText={
              <span className="flex min-w-0 items-center gap-1.5">
                <span className="shrink-0">{formatHomeClimbDate(climb.created_at)}</span>
                <span className="shrink-0">•</span>
                {climb.gym_name ? <span className="min-w-0 truncate">{climb.gym_name}</span> : null}
              </span>
            }
          />
        </div>
      </Link>
    </div>
  )
}

export default HomePage
