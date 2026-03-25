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

    if (!node || typeof ResizeObserver === "undefined") {
      setHeight(node?.getBoundingClientRect().height ?? 0)
      return
    }

    const updateHeight = () => setHeight(node.getBoundingClientRect().height)
    updateHeight()

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
  const [cardScrollTop, setCardScrollTop] = useState(0)
  const [isScrollPrimed, setIsScrollPrimed] = useState(false)
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const cardScrollRef = useRef<HTMLElement | null>(null)
  const summaryTileRef = useRef<HTMLElement | null>(null)
  const cardContentRef = useRef<HTMLDivElement | null>(null)
  const safeAreaProbeRef = useRef<HTMLDivElement | null>(null)
  const initializedDetailIdRef = useRef<string | null>(null)
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
    initializedDetailIdRef.current = null
    setCardScrollTop(0)
    setIsScrollPrimed(false)
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
  const viewportHeight = useObservedHeight(viewportRef)
  const summaryTileHeight = useObservedHeight(summaryTileRef)
  const measuredSafeAreaBottom = useObservedHeight(safeAreaProbeRef)
  const cardContentHeight = useObservedHeight(cardContentRef)
  const bottomSpacing = SUMMARY_BOTTOM_GAP + measuredSafeAreaBottom
  const collapsedCardHeight = summaryTileHeight > 0 ? summaryTileHeight + bottomSpacing : 0
  const defaultCardTop = initialHeroHeight - CARD_HERO_OVERLAP
  const defaultCardHeight = viewportHeight > 0 ? Math.max(0, viewportHeight - defaultCardTop) : 0
  const totalCardHeight = cardContentHeight + bottomSpacing
  const maxScrollableContentOffset = Math.max(0, totalCardHeight - summaryTileHeight - CARD_TOP_PADDING)
  const scrollProgressRange = Math.max(
    0,
    Math.min(
      Math.max(0, defaultCardHeight - collapsedCardHeight - CARD_TOP_PADDING),
      maxScrollableContentOffset,
    ),
  )
  const anchoredScrollTop = clamp(cardScrollTop, 0, scrollProgressRange)
  const cardHeroProgress = scrollProgressRange > 0 ? 1 - anchoredScrollTop / scrollProgressRange : 0
  const restingCardOffset = scrollProgressRange * (1 - cardHeroProgress)
  const cardTopInset = lerp(CARD_TOP_PADDING, 0, cardHeroProgress)
  const cardSpacerHeight = restingCardOffset
  const cardVisibleHeight = collapsedCardHeight + cardTopInset + restingCardOffset
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
  const heroHeight = lerp(initialHeroHeight, maxImageHeightAvailable, cardHeroProgress)
  const imageScale = hasImage ? lerp(1, HERO_MAX_IMAGE_SCALE, cardHeroProgress) : 1
  const heroLayoutReady =
    Boolean(detail) &&
    viewportHeight > 0 &&
    summaryTileHeight > 0 &&
    cardContentHeight > 0 &&
    isScrollPrimed
  const interactiveCardVisibleHeight = heroLayoutReady ? cardVisibleHeight : defaultCardHeight

  useLayoutEffect(() => {
    if (!detail || !cardScrollRef.current || !viewportHeight || !summaryTileHeight || !cardContentHeight) {
      return
    }

    if (initializedDetailIdRef.current === detail.id) {
      return
    }

    const nextScrollTop = scrollProgressRange
    cardScrollRef.current.scrollTop = nextScrollTop
    setCardScrollTop(nextScrollTop)
    setIsScrollPrimed(true)
    initializedDetailIdRef.current = detail.id
  }, [cardContentHeight, detail, scrollProgressRange, summaryTileHeight, viewportHeight])

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
      <div ref={viewportRef} className="relative mx-auto h-[100dvh] max-w-[420px] overflow-hidden bg-stone-bg">
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

        <div className="absolute inset-x-0 top-0 z-0" style={heroAnimationStyle}>
          <ClimbDetailHero
            imageUrl={detail?.referenceImageUrl}
            height={heroHeight}
            imageScale={imageScale}
            objectPosition={IMAGE_FOCAL_POINT}
          />
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 px-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
          <BackButton
            onClick={handleBack}
            ariaLabel="Back"
            size="sm"
            className="pointer-events-auto bg-stone-surface/92 backdrop-blur"
          />
        </div>

        {loading ? (
          <main
            className="absolute inset-x-0 bottom-0 z-10 rounded-t-[32px] bg-stone-bg px-5 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-6"
            style={{ height: Math.max(defaultCardHeight, 280), ...cardAnimationStyle }}
          >
            <div className="rounded-[28px] border border-stone-border bg-stone-surface px-5 py-8 text-center text-sm text-stone-muted shadow-[0_14px_34px_rgba(89,68,51,0.05)]">
              Loading climb details…
            </div>
          </main>
        ) : loadError || !detail ? (
          <main
            className="absolute inset-x-0 bottom-0 z-10 rounded-t-[32px] bg-stone-bg px-5 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-6"
            style={{ height: Math.max(defaultCardHeight, 280), ...cardAnimationStyle }}
          >
            <div className="rounded-[28px] border border-stone-border bg-stone-surface px-5 py-8 text-center text-sm text-red-500 shadow-[0_14px_34px_rgba(89,68,51,0.05)]">
              {loadError ?? "Climb not found."}
            </div>
          </main>
        ) : (
          <main
            ref={cardScrollRef}
            className="absolute inset-x-0 bottom-0 z-10 overflow-y-auto rounded-t-[32px] bg-stone-bg px-5"
            style={{
              height: Math.max(interactiveCardVisibleHeight, collapsedCardHeight || 0),
              paddingTop: cardTopInset,
              paddingBottom: `calc(${SUMMARY_BOTTOM_GAP}px + env(safe-area-inset-bottom))`,
              WebkitOverflowScrolling: "touch",
              overscrollBehaviorY: isNativeIOS ? "contain" : "auto",
              ...cardAnimationStyle,
              visibility: heroLayoutReady ? "visible" : "hidden",
            }}
            onScroll={(event) => {
              setCardScrollTop(event.currentTarget.scrollTop)
            }}
          >
            {/* The measured scrollTop becomes one normalized progress value, and that progress drives
                the spacer, card shell height, and hero interpolation over the same layout-defined range. */}
            <div style={{ height: cardSpacerHeight }} aria-hidden="true" />

            <div ref={cardContentRef}>
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
            </div>

            <div
              ref={safeAreaProbeRef}
              aria-hidden="true"
              style={{
                height: "env(safe-area-inset-bottom)",
              }}
            />
          </main>
        )}
      </div>
    </div>
  )
}
