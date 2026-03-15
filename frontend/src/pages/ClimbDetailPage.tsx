import { useEffect, useMemo, useState } from "react"
import { FiCalendar, FiMapPin } from "react-icons/fi"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import BackButton from "../components/BackButton"
import ClimbStatusPill from "../components/ClimbStatusPill"
import ClimbDetailHero from "../components/climb-detail/ClimbDetailHero"
import ClimbIdentityBlock from "../components/climb-detail/ClimbIdentityBlock"
import ClimbNotesSection from "../components/climb-detail/ClimbNotesSection"
import ClimbTagsSection from "../components/climb-detail/ClimbTagsSection"
import UserTagDifferenceBar from "../components/climb-detail/UserTagDifferenceBar"
import { useAuth } from "../context/AuthContext"
import { buildClimbDetailData } from "../lib/climbDetail"
import type { Climb } from "../lib/climbs"
import { fetchClimbs } from "../lib/climbs"

type ClimbLocationState = {
  climb?: Climb
  from?: string
  transition?: string
}

type FetchedClimbState = {
  climb: Climb | null
  error: string | null
  requestedClimbId: string | null
  status: "idle" | "success" | "error"
}

const IMAGE_HEADER_EXPANDED = 336
const IMAGE_HEADER_COLLAPSED = 172
const PLACEHOLDER_HEADER_EXPANDED = 168
const PLACEHOLDER_HEADER_COLLAPSED = 116

export default function ClimbDetailPage() {
  const { climbId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const locationState = (location.state ?? {}) as ClimbLocationState
  const routeClimb = locationState.climb?.id === climbId ? locationState.climb : null
  const [fetchedState, setFetchedState] = useState<FetchedClimbState>({
    climb: null,
    error: null,
    requestedClimbId: null,
    status: "idle",
  })
  const [scrollY, setScrollY] = useState(0)
  const [isClosing, setIsClosing] = useState(false)
  const isCardOpenTransition = locationState.transition === "card-open"
  const fetchedClimb =
    fetchedState.requestedClimbId === climbId && fetchedState.status === "success"
      ? fetchedState.climb
      : null
  const climb = routeClimb ?? fetchedClimb
  const loadError =
    fetchedState.requestedClimbId === climbId && fetchedState.status === "error"
      ? fetchedState.error
      : null
  const loading =
    !routeClimb &&
    Boolean(climbId) &&
    (!user ||
      fetchedState.requestedClimbId !== climbId ||
      fetchedState.status === "idle")

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)

    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    if (!user || !climbId) {
      return
    }

    if (routeClimb) {
      return
    }

    let isCancelled = false

    fetchClimbs(user.id)
      .then((climbs) => {
        if (isCancelled) {
          return
        }

        const matchingClimb = climbs.find((entry) => entry.id === climbId) ?? null
        setFetchedState({
          climb: matchingClimb,
          error: matchingClimb ? null : "Climb not found.",
          requestedClimbId: climbId,
          status: matchingClimb ? "success" : "error",
        })
      })
      .catch((error: Error) => {
        if (isCancelled) {
          return
        }

        setFetchedState({
          climb: null,
          error: error.message,
          requestedClimbId: climbId,
          status: "error",
        })
      })

    return () => {
      isCancelled = true
    }
  }, [climbId, routeClimb, user])

  const detail = useMemo(() => (climb ? buildClimbDetailData(climb) : null), [climb])
  const hasImage = Boolean(detail?.referenceImageUrl)
  const expandedHeight = hasImage ? IMAGE_HEADER_EXPANDED : PLACEHOLDER_HEADER_EXPANDED
  const collapsedHeight = hasImage ? IMAGE_HEADER_COLLAPSED : PLACEHOLDER_HEADER_COLLAPSED
  const headerHeight = Math.max(collapsedHeight, expandedHeight - scrollY * 0.45)

  const handleBack = () => {
    if (!detail || isClosing) {
      return
    }

    setIsClosing(true)

    window.setTimeout(() => {
      const goBack = () => {
        navigate(locationState.from ?? "/home", {
          state: {
            stackTransition: locationState.from === "/home" ? undefined : "back",
            returnClimbId: detail.id,
            returnClimb: climb,
            transition: "card-close",
          },
        })
      }

      if (typeof document !== "undefined" && "startViewTransition" in document) {
        document.startViewTransition(goBack)
        return
      }

      goBack()
    }, 80)
  }

  return (
    <div className="min-h-[100dvh] bg-stone-bg">
      <div className="mx-auto max-w-[420px]">
        <style>{`
          @keyframes climb-detail-hero-enter {
            0% {
              opacity: 0;
              transform: scale(0.985);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }

          @keyframes climb-detail-content-enter {
            0% {
              opacity: 0;
              transform: translateY(12px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes climb-detail-content-exit {
            0% {
              opacity: 1;
              transform: translateY(0);
            }
            100% {
              opacity: 0;
              transform: translateY(8px);
            }
          }
        `}</style>
        <div className="sticky top-0 z-0">
          <div
            className="relative"
            style={{
              animation: isClosing
                ? "climb-detail-content-exit 160ms cubic-bezier(0.55, 0, 0.55, 0.2)"
                : isCardOpenTransition
                  ? "climb-detail-hero-enter 180ms cubic-bezier(0.22, 1, 0.36, 1)"
                  : "none",
            }}
          >
            <ClimbDetailHero imageUrl={detail?.referenceImageUrl} height={headerHeight} />
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 px-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
              <BackButton
                onClick={handleBack}
                ariaLabel="Back"
                size="sm"
                className="pointer-events-auto bg-stone-surface/92 backdrop-blur"
              />
            </div>
          </div>
        </div>

        <main
          className="relative z-10 -mt-7 rounded-t-[32px] bg-stone-bg px-5 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-6"
          style={{
            animation: isClosing
              ? "climb-detail-content-exit 160ms cubic-bezier(0.55, 0, 0.55, 0.2)"
              : isCardOpenTransition
                ? "climb-detail-content-enter 200ms cubic-bezier(0.22, 1, 0.36, 1)"
                : "none",
          }}
        >
          {loading ? (
            <div className="rounded-[28px] border border-stone-border bg-stone-surface px-5 py-8 text-center text-sm text-stone-muted shadow-[0_14px_34px_rgba(89,68,51,0.05)]">
              Loading climb details…
            </div>
          ) : loadError || !detail ? (
            <div className="rounded-[28px] border border-stone-border bg-stone-surface px-5 py-8 text-center text-sm text-red-500 shadow-[0_14px_34px_rgba(89,68,51,0.05)]">
              {loadError ?? "Climb not found."}
            </div>
          ) : (
            <>
              <section
                className="rounded-[30px] border border-stone-border bg-stone-surface px-5 py-5 shadow-[0_14px_34px_rgba(89,68,51,0.08)]"
                style={{
                  viewTransitionName:
                    isCardOpenTransition || isClosing ? "active-climb-card" : "none",
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <ClimbIdentityBlock
                      gymGrade={detail.gymGrade}
                      climbColor={detail.climbColor}
                      officialName={detail.officialName}
                    />
                    <div className="mt-3 space-y-1.5">
                      {detail.gymName ? (
                        <div className="flex items-center gap-2 text-sm text-stone-muted">
                          <FiMapPin className="h-3.5 w-3.5 shrink-0 text-stone-secondary" />
                          <span>{detail.gymName}</span>
                        </div>
                      ) : null}
                      <div className="flex items-center gap-2 text-sm text-stone-muted">
                        <FiCalendar className="h-3.5 w-3.5 shrink-0 text-stone-secondary" />
                        <span>{new Date(detail.loggedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <ClimbStatusPill sendType={detail.sendType} className="shrink-0" />
                </div>
              </section>

              <div className="mt-5">
                <ClimbTagsSection tags={detail.canonicalTags} />
                <UserTagDifferenceBar tags={detail.userTagDifferences} />
              </div>

              <div className="mt-5">
                <ClimbNotesSection notes={detail.userNotes} />
              </div>

              <section className="mt-5 rounded-[28px] border border-dashed border-stone-border/90 bg-[#F6F1EA] px-5 py-4 text-sm text-stone-muted shadow-[0_12px_28px_rgba(89,68,51,0.035)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-muted">
                  Coming Later
                </p>
                <p className="mt-3 leading-6">
                  Ratings, community ascents, and comments will live here once we split official
                  community data from user-specific climb history.
                </p>
                {/* TODO: Add community ratings and ascents once the backend exposes official climb records. */}
                {/* TODO: Add comments when social discussion data is modeled separately from personal notes. */}
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
