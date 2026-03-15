import { useEffect, useMemo, useState } from "react"
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
  const [climb, setClimb] = useState<Climb | null>(locationState.climb ?? null)
  const [loading, setLoading] = useState(!locationState.climb)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [scrollY, setScrollY] = useState(0)

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

    if (locationState.climb?.id === climbId) {
      setClimb(locationState.climb)
      setLoading(false)
      return
    }

    setLoading(true)
    setLoadError(null)

    fetchClimbs(user.id)
      .then((climbs) => {
        const matchingClimb = climbs.find((entry) => entry.id === climbId) ?? null
        setClimb(matchingClimb)
        setLoadError(matchingClimb ? null : "Climb not found.")
      })
      .catch((error: Error) => setLoadError(error.message))
      .finally(() => setLoading(false))
  }, [climbId, locationState.climb, user])

  const detail = useMemo(() => (climb ? buildClimbDetailData(climb) : null), [climb])
  const hasImage = Boolean(detail?.referenceImageUrl)
  const expandedHeight = hasImage ? IMAGE_HEADER_EXPANDED : PLACEHOLDER_HEADER_EXPANDED
  const collapsedHeight = hasImage ? IMAGE_HEADER_COLLAPSED : PLACEHOLDER_HEADER_COLLAPSED
  const headerHeight = Math.max(collapsedHeight, expandedHeight - scrollY * 0.45)

  return (
    <div className="min-h-[100dvh] bg-stone-bg">
      <div className="mx-auto max-w-[420px]">
        <div className="sticky top-0 z-0">
          <div className="relative">
            <ClimbDetailHero imageUrl={detail?.referenceImageUrl} height={headerHeight} />
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 px-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
              <BackButton
                onClick={() => {
                  if (window.history.length > 1) {
                    navigate(-1)
                    return
                  }

                  navigate(locationState.from ?? "/home")
                }}
                ariaLabel="Back"
                size="sm"
                className="pointer-events-auto bg-stone-surface/92 backdrop-blur"
              />
            </div>
          </div>
        </div>

        <main className="relative z-10 -mt-7 rounded-t-[32px] bg-stone-bg px-5 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-6">
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
              <section className="rounded-[30px] border border-stone-border bg-stone-surface px-5 py-5 shadow-[0_14px_34px_rgba(89,68,51,0.08)]">
                <div className="flex items-start justify-between gap-4">
                  <ClimbIdentityBlock
                    gymGrade={detail.gymGrade}
                    climbColor={detail.climbColor}
                    officialName={detail.officialName}
                    gymName={detail.gymName}
                  />
                  <ClimbStatusPill sendType={detail.sendType} className="shrink-0" />
                </div>

                <p className="mt-4 text-xs text-stone-muted">
                  Logged {new Date(detail.loggedAt).toLocaleDateString()}
                </p>
              </section>

              <div className="mt-5">
                <ClimbTagsSection tags={detail.canonicalTags} />
                <UserTagDifferenceBar tags={detail.userTagDifferences} />
              </div>

              <div className="mt-5">
                <ClimbNotesSection notes={detail.userNotes} />
              </div>

              <section className="mt-5 rounded-[28px] border border-dashed border-stone-border bg-stone-surface/80 px-5 py-5 text-sm text-stone-muted shadow-[0_14px_34px_rgba(89,68,51,0.04)]">
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
