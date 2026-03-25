import { Capacitor } from "@capacitor/core"
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react"
import { FiCalendar, FiMapPin } from "react-icons/fi"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import BackButton from "../components/BackButton"
import ClimbStatusPill from "../components/ClimbStatusPill"
import ClimbDetailHero from "../components/climb-detail/ClimbDetailHero"
import ClimbIdentityBlock from "../components/climb-detail/ClimbIdentityBlock"
import ClimbNotesSection from "../components/climb-detail/ClimbNotesSection"
import ClimbTagsSection from "../components/climb-detail/ClimbTagsSection"
import { useAuth } from "../context/AuthContext"
import { buildClimbDetailData } from "../lib/climbDetail"
import type { Climb } from "../lib/climbs"
import { fetchClimbById } from "../lib/climbs"

type ClimbLocationState = {
  climb?: Climb
  from?: string
  fromState?: Record<string, unknown>
  transition?: string
}

type FetchedClimbState = {
  climb: Climb | null
  error: string | null
  requestedClimbId: string | null
  status: "idle" | "success" | "error"
}

const IMAGE_HEADER_INITIAL = 336
const IMAGE_HEADER_PLACEHOLDER = 168
const CARD_HERO_OVERLAP = 28
const CARD_TOP_PADDING = 24
const SUMMARY_BOTTOM_GAP = 18
const HERO_SUMMARY_UNDERLAP = 24
const HERO_MAX_IMAGE_SCALE = 1.08
const IMAGE_FOCAL_POINT = "50% 38%"

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function lerp(start: number, end: number, progress: number) {
  return start + (end - start) * progress
}

function useObservedHeight<T extends HTMLElement>(ref: RefObject<T | null>) {
  const [height, setHeight] = useState(0)

  useLayoutEffect(() => {
    const node = ref.current

    if (!node) {
      setHeight(0)
      return
    }

    const updateHeight = () => setHeight(node.getBoundingClientRect().height)
    updateHeight()

    if (typeof ResizeObserver === "undefined") {
      return
    }

    const resizeObserver = new ResizeObserver(updateHeight)
    resizeObserver.observe(node)

    return () => resizeObserver.disconnect()
  }, [ref])

  return height
}

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
  const [isClosing, setIsClosing] = useState(false)
  const [pageScrollTop, setPageScrollTop] = useState(0)
  const [isDefaultAnchorReady, setIsDefaultAnchorReady] = useState(false)
  const pageScrollRef = useRef<HTMLDivElement | null>(null)
  const summaryTileRef = useRef<HTMLElement | null>(null)
  const safeAreaProbeRef = useRef<HTMLDivElement | null>(null)
  const isCardOpenTransition = locationState.transition === "card-open"
  const isNativeIOS = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios"
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
    setIsDefaultAnchorReady(false)

    if (pageScrollRef.current) {
      pageScrollRef.current.scrollTop = 0
    }

    setPageScrollTop(0)
  }, [climbId])

  useEffect(() => {
    if (!user || !climbId) {
      return
    }

    if (routeClimb) {
      return
    }

    let isCancelled = false

    fetchClimbById(user.id, climbId)
      .then((matchingClimb) => {
        if (isCancelled) {
          return
        }

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
  const initialHeroHeight = hasImage ? IMAGE_HEADER_INITIAL : IMAGE_HEADER_PLACEHOLDER
  const viewportHeight = useObservedHeight(pageScrollRef)
  const summaryTileHeight = useObservedHeight(summaryTileRef)
  const safeAreaBottom = useObservedHeight(safeAreaProbeRef)
  const bottomSpacing = SUMMARY_BOTTOM_GAP + safeAreaBottom
  const defaultCardTop = initialHeroHeight - CARD_HERO_OVERLAP
  const collapsedCardTop =
    viewportHeight > 0 && summaryTileHeight > 0
      ? Math.max(defaultCardTop, viewportHeight - bottomSpacing - summaryTileHeight - CARD_TOP_PADDING)
      : defaultCardTop
  const defaultAnchorOffset = Math.max(0, collapsedCardTop - defaultCardTop)
  const boundedHeroScrollTop = clamp(pageScrollTop, 0, defaultAnchorOffset)
  // Default lives at the measured anchor. The hero only uses the bounded range above it;
  // deeper page scroll immediately becomes the normal details-reading path.
  const heroProgress =
    defaultAnchorOffset > 0 ? 1 - boundedHeroScrollTop / defaultAnchorOffset : 0
  const maxImageHeightAvailable =
    viewportHeight > 0 && summaryTileHeight > 0
      ? Math.max(
          initialHeroHeight,
          Math.min(
            viewportHeight,
            viewportHeight - bottomSpacing - summaryTileHeight + HERO_SUMMARY_UNDERLAP,
          ),
        )
      : initialHeroHeight
  // Preserve the existing image interpolation behavior and only correct the scroll-domain around it.
  const heroHeight = lerp(initialHeroHeight, maxImageHeightAvailable, heroProgress)
  const imageScale = hasImage ? lerp(1, HERO_MAX_IMAGE_SCALE, heroProgress) : 1
  const cardAnchorSpacerHeight = initialHeroHeight + defaultAnchorOffset
  const isLayoutMeasured = !detail || (viewportHeight > 0 && summaryTileHeight > 0)

  useLayoutEffect(() => {
    if (!pageScrollRef.current || !detail || !isLayoutMeasured || isDefaultAnchorReady) {
      return
    }

    pageScrollRef.current.scrollTop = defaultAnchorOffset
    setPageScrollTop(defaultAnchorOffset)
    setIsDefaultAnchorReady(true)
  }, [defaultAnchorOffset, detail, isDefaultAnchorReady, isLayoutMeasured])

  const handleBack = () => {
    if (!detail || isClosing) {
      return
    }

    setIsClosing(true)

    window.setTimeout(() => {
      const goBack = () => {
        navigate(locationState.from ?? "/home", {
          state: {
            ...locationState.fromState,
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

  const heroAnimationStyle = {
    animation: isClosing
      ? "climb-detail-content-exit 160ms cubic-bezier(0.55, 0, 0.55, 0.2)"
      : isCardOpenTransition
        ? "climb-detail-hero-enter 180ms cubic-bezier(0.22, 1, 0.36, 1)"
        : "none",
  } as const

  const cardAnimationStyle = {
    animation: isClosing
      ? "climb-detail-content-exit 160ms cubic-bezier(0.55, 0, 0.55, 0.2)"
      : isCardOpenTransition
        ? "climb-detail-content-enter 200ms cubic-bezier(0.22, 1, 0.36, 1)"
        : "none",
  } as const

  return (
    <div className="min-h-[100dvh] bg-stone-bg">
      <div
        ref={pageScrollRef}
        className="mx-auto h-[100dvh] max-w-[420px] overflow-y-auto bg-stone-bg"
        style={{
          WebkitOverflowScrolling: "touch",
          overscrollBehaviorY: isNativeIOS ? "contain" : "auto",
        }}
        onScroll={(event) => {
          setPageScrollTop(event.currentTarget.scrollTop)
        }}
      >
        <div
          className="relative min-h-full"
          style={{
            visibility: detail && !isDefaultAnchorReady ? "hidden" : "visible",
          }}
        >
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

          <div className="sticky top-0 z-0 h-0">
            <div className="relative" style={heroAnimationStyle}>
              <ClimbDetailHero
                imageUrl={detail?.referenceImageUrl}
                height={heroHeight}
                imageScale={imageScale}
                objectPosition={IMAGE_FOCAL_POINT}
              />
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

          <div aria-hidden="true" style={{ height: cardAnchorSpacerHeight }} />

          <main
            className="relative z-10 -mt-7 rounded-t-[32px] bg-stone-bg px-5 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-6"
            style={cardAnimationStyle}
          >
            {/* The card remains one normal-flow unit. The shared page scroll moves the whole card
                and its contents together, so the summary tile never drifts inside the shell. */}
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
                  ref={summaryTileRef}
                  className="rounded-[30px] border border-stone-border bg-stone-surface px-5 py-5 shadow-[0_14px_34px_rgba(89,68,51,0.08)]"
                  style={{
                    viewTransitionName: isCardOpenTransition || isClosing ? "active-climb-card" : "none",
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
                  <ClimbTagsSection tags={detail.detailTags} />
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

            <div
              ref={safeAreaProbeRef}
              aria-hidden="true"
              style={{
                height: "env(safe-area-inset-bottom)",
              }}
            />
          </main>
        </div>
      </div>
    </div>
  )
}
