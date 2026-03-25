import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from "react"
import { FiBookmark, FiCheck, FiChevronDown, FiLoader, FiMapPin, FiSearch } from "react-icons/fi"

import { RiBookmarkFill } from "react-icons/ri"
import { useGym } from "../context/GymContext"
import { formatGymLocation, type GymRecord } from "../lib/gyms"

interface GymSelectorProps {
  className?: string
  showLocation?: boolean
}

type SelectedGymSnapshot = {
  id: string | null
  name: string
  location: string | null
}

function getSelectedGymSnapshot(activeGym: GymRecord | null, isHydrated: boolean): SelectedGymSnapshot {
  if (!isHydrated) {
    return {
      id: "loading",
      name: "Loading...",
      location: "Loading location...",
    }
  }

  if (!activeGym) {
    return {
      id: null,
      name: "Select Gym",
      location: null,
    }
  }

  return {
    id: activeGym.id,
    name: activeGym.name,
    location: formatGymLocation(activeGym),
  }
}

function GymSelector({ className = "", showLocation = true }: GymSelectorProps) {
  const {
    activeGym,
    bookmarkedGyms,
    recentGyms,
    bookmarkedGymIds,
    isHydrated,
    selectGym,
    toggleBookmark,
    searchGyms,
  } = useGym()
  const [isOpen, setIsOpen] = useState(false)
  const [isRegistryOpen, setIsRegistryOpen] = useState(false)
  const [query, setQuery] = useState("")
  const containerRef = useRef<HTMLDivElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  const searchResults = useMemo(() => searchGyms(query), [query, searchGyms])
  const selectedSnapshot = useMemo(
    () => getSelectedGymSnapshot(activeGym, isHydrated),
    [activeGym, isHydrated],
  )

  useEffect(() => {
    if (!isOpen && !isRegistryOpen) return undefined

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
        setIsRegistryOpen(false)
      }
    }

    window.addEventListener("mousedown", handlePointerDown)
    return () => window.removeEventListener("mousedown", handlePointerDown)
  }, [isOpen, isRegistryOpen])

  useEffect(() => {
    if (!isRegistryOpen) return undefined

    const timeoutId = window.setTimeout(() => {
      searchInputRef.current?.focus()
    }, 10)

    return () => window.clearTimeout(timeoutId)
  }, [isRegistryOpen])

  function handleSelectFromPopup(gymId: string) {
    selectGym(gymId)
    setIsOpen(false)
  }

  function handleSelectFromRegistry(gymId: string) {
    selectGym(gymId)
    setQuery("")
    setIsRegistryOpen(false)
    setIsOpen(false)
  }

  function handleBookmarkToggle(event: ReactMouseEvent, gymId: string) {
    event.stopPropagation()
    toggleBookmark(gymId)
  }

  const activeGymId = activeGym?.id ?? null
  const isEmptyState = selectedSnapshot.id === null

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className={`inline-flex items-center justify-between gap-3 rounded-2xl bg-stone-surface/85 px-3 py-2 text-left shadow-sm ring-1 ring-stone-border transition hover:bg-stone-surface ${
          isEmptyState ? "min-w-[8.75rem]" : "min-w-[12.5rem] max-w-[15rem]"
        }`}
      >
        <div className="relative min-w-0 flex-1 overflow-hidden">
          <div
            className={
              isEmptyState
                ? "min-h-[1.25rem]"
                : showLocation
                  ? "min-h-[2.625rem]"
                  : "min-h-[1.25rem]"
            }
          >
            <SelectedGymLabel snapshot={selectedSnapshot} showLocation={showLocation} />
          </div>
        </div>
        <FiChevronDown
          className={`h-4 w-4 shrink-0 text-stone-muted transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-[calc(100%+12px)] z-30 w-[min(20rem,calc(100vw-2.5rem))] rounded-[24px] bg-stone-surface p-4 shadow-[0_24px_60px_rgba(15,23,42,0.18)] ring-1 ring-stone-border">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-stone-text">Select gym</p>
              <p className="text-xs text-stone-muted">Active gym for new logs</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsRegistryOpen(true)
              }}
              className="inline-flex items-center rounded-full bg-ember-soft px-3 py-1.5 text-xs font-semibold text-ember"
            >
              Select
            </button>
          </div>

          <SelectorSection
            title="Bookmarked Gyms"
            gyms={bookmarkedGyms}
            activeGymId={activeGymId}
            bookmarkedGymIds={bookmarkedGymIds}
            onSelect={handleSelectFromPopup}
            onToggleBookmark={handleBookmarkToggle}
            emptyMessage="None"
            className="mt-4"
          />
          <SelectorSection
            title="Recently Visited"
            gyms={recentGyms}
            activeGymId={activeGymId}
            bookmarkedGymIds={bookmarkedGymIds}
            onSelect={handleSelectFromPopup}
            onToggleBookmark={handleBookmarkToggle}
            emptyMessage="None"
            className="mt-4"
          />
        </div>
      )}

      {isRegistryOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20 px-5">
          <div className="flex h-[520px] w-full max-w-[420px] flex-col rounded-[28px] bg-stone-surface p-4 shadow-[0_30px_80px_rgba(15,23,42,0.2)] ring-1 ring-stone-border">
            <div className="flex items-start justify-between gap-4">
              <p className="text-sm font-semibold text-stone-text">Select gym</p>
              <button
                type="button"
                onClick={() => {
                  setIsRegistryOpen(false)
                  setQuery("")
                }}
                className="rounded-full bg-stone-alt px-3 py-1.5 text-xs font-semibold text-stone-secondary"
              >
                Close
              </button>
            </div>

            <label className="mt- flex items-center gap-2 rounded-2xl border border-stone-border bg-stone-surface px-3 py-2.5">
              <FiSearch className="h- w-4 text-stone-muted" />
              <input
                ref={searchInputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search gyms, cities, or chains"
                className="w-full bg-transparent text-sm text-stone-text outline-none placeholder:text-stone-muted"
              />
            </label>

            <div className="mt-6 min-h-0 flex-1 overflow-y-auto px-1 py-1">
              {!isHydrated ? (
                <div className="flex items-center justify-center py-10 text-sm text-stone-muted">
                  <FiLoader className="mr-2 h-4 w-4 animate-spin" />
                  Loading gyms...
                </div>
              ) : searchResults.length === 0 ? (
                <div className="rounded-2xl bg-stone-surface px-4 py-8 text-center">
                  <p className="text-sm text-stone-muted">No gyms matched your search.</p>
                  <a
                    href="/support"
                    className="mt-3 inline-block text-xs font-semibold text-ember"
                  >
                    Don't see your gym?
                  </a>
                </div>
              ) : (
                <div className="space-y-2">
                  {searchResults.map((gym) => {
                      const isBookmarked = bookmarkedGymIds.includes(gym.id)
                      const isActive = activeGymId === gym.id

                      return (
                        <div
                          key={gym.id}
                          className={`flex items-center justify-between rounded-2xl px-3 py-2.5 ring-1 transition ${
                            isActive
                              ? "bg-ember-soft ring-ember/25"
                              : "bg-stone-surface ring-stone-border hover:bg-stone-alt"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => handleSelectFromRegistry(gym.id)}
                            className="min-w-0 flex-1 text-left"
                          >
                            <p className="truncate text-sm font-semibold text-stone-text">{gym.name}</p>
                            <p className="mt-0.5 truncate text-xs text-stone-muted">
                              {formatGymLocation(gym)}
                              {gym.address ? ` • ${gym.address}` : ""}
                            </p>
                          </button>
                          <div className="ml-3 flex shrink-0 items-center gap-2">
                            <BookmarkToggleButton
                              gymName={gym.name}
                              isBookmarked={isBookmarked}
                              onClick={(event) => handleBookmarkToggle(event, gym.id)}
                            />
                            {isActive && <FiCheck className="h-4 w-4 text-ember" />}
                          </div>
                        </div>
                      )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SelectedGymLabel({
  snapshot,
  showLocation,
}: {
  snapshot: SelectedGymSnapshot
  showLocation: boolean
}) {
  const isEmptyState = snapshot.id === null
  const nameTone = snapshot.id === "loading" ? "text-stone-muted" : "text-stone-text"

  return (
    <div className="min-w-0 transition-opacity duration-150">
      <p className={`truncate text-sm font-semibold ${nameTone}`}>{snapshot.name}</p>
      {showLocation && snapshot.location && !isEmptyState ? (
        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-stone-muted">
          <FiMapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{snapshot.location}</span>
        </p>
      ) : null}
    </div>
  )
}

function SelectorSection({
  title,
  gyms,
  activeGymId,
  bookmarkedGymIds,
  onSelect,
  onToggleBookmark,
  emptyMessage,
  className = "",
}: {
  title: string
  gyms: GymRecord[]
  activeGymId: string | null
  bookmarkedGymIds: string[]
  onSelect: (gymId: string) => void
  onToggleBookmark: (event: ReactMouseEvent, gymId: string) => void
  emptyMessage: string
  className?: string
}) {
  return (
    <div className={className}>
      <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-muted">
        {title}
      </p>
      <div className="mt-2 space-y-1.5">
        {gyms.length === 0 ? (
          <div className="rounded-2xl bg-stone-surface px-4 py-4 text-center text-sm text-stone-muted">
            {emptyMessage}
          </div>
        ) : (
          gyms.map((gym) => {
            const isActive = gym.id === activeGymId
            const isBookmarked = bookmarkedGymIds.includes(gym.id)

            return (
              <div
                key={gym.id}
                className={`flex items-center justify-between rounded-2xl px-3 py-2.5 transition ${
                  isActive ? "bg-ember-soft" : "bg-stone-surface hover:bg-stone-alt"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelect(gym.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="truncate text-sm font-semibold text-stone-text">{gym.name}</p>
                  <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-stone-muted">
                    <FiMapPin className="h-3.5 w-3.5 shrink-0" />
                    {formatGymLocation(gym)}
                  </p>
                </button>

                <div className="ml-3 flex shrink-0 items-center gap-2">
                  <BookmarkToggleButton
                    gymName={gym.name}
                    isBookmarked={isBookmarked}
                    onClick={(event) => onToggleBookmark(event, gym.id)}
                  />
                  {isActive && <FiCheck className="h-4 w-4 text-ember" />}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function BookmarkToggleButton({
  gymName,
  isBookmarked,
  onClick,
}: {
  gymName: string
  isBookmarked: boolean
  onClick: (event: ReactMouseEvent) => void
}) {
  return (
    <button
      type="button"
      aria-label={`${isBookmarked ? "Remove bookmark for" : "Bookmark"} ${gymName}`}
      onClick={onClick}
      className="rounded-full bg-stone-surface/90 p-1.5 text-stone-muted ring-1 ring-stone-border transition hover:text-ember"
    >
      {isBookmarked ? (
        <RiBookmarkFill className="h-3.5 w-3.5 text-ember" />
      ) : (
        <FiBookmark className="h-3.5 w-3.5" />
      )}
    </button>
  )
}

export default GymSelector
