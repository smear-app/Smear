import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from "react"
import { FiBookmark, FiCheck, FiChevronDown, FiLoader, FiMapPin, FiSearch } from "react-icons/fi"

import { RiBookmarkFill } from "react-icons/ri"
import { useGym } from "../context/GymContext"
import { formatGymLocation, type GymRecord } from "../lib/gyms"

interface GymSelectorProps {
  className?: string
}

function GymSelector({ className = "" }: GymSelectorProps) {
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

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 rounded-2xl bg-white/85 px-3 py-2 text-left shadow-sm ring-1 ring-slate-200 transition hover:bg-white"
      >
        <div className="min-w-0">
          {!isHydrated ? (
            <p className="text-sm font-semibold text-slate-400">Loading...</p>
          ) : (
            <>
              <p className="truncate text-sm font-semibold text-slate-900">
                {activeGym ? activeGym.name : "Select Gym"}
              </p>
              {activeGym ? (
                <p className="mt-0.5 truncate text-xs text-slate-500">{formatGymLocation(activeGym)}</p>
              ) : null}
            </>
          )}
        </div>
        <FiChevronDown
          className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-[calc(100%+12px)] z-30 rounded-[24px] bg-white p-4 shadow-[0_24px_60px_rgba(15,23,42,0.18)] ring-1 ring-slate-200">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Select gym</p>
              <p className="text-xs text-slate-500">Active gym for new logs</p>
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
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/20 px-5">
          <div className="flex h-[520px] w-full max-w-[420px] flex-col rounded-[28px] bg-[#fcfcfa] p-4 shadow-[0_30px_80px_rgba(15,23,42,0.2)] ring-1 ring-slate-200">
            <div className="flex items-start justify-between gap-4">
              <p className="text-sm font-semibold text-slate-900">Select gym</p>
              <button
                type="button"
                onClick={() => {
                  setIsRegistryOpen(false)
                  setQuery("")
                }}
                className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600"
              >
                Close
              </button>
            </div>

            <label className="mt- flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
              <FiSearch className="h- w-4 text-slate-400" />
              <input
                ref={searchInputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search gyms, cities, or chains"
                className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
            </label>

            <div className="mt-6 min-h-0 flex-1 overflow-y-auto px-1 py-1">
              {!isHydrated ? (
                <div className="flex items-center justify-center py-10 text-sm text-slate-400">
                  <FiLoader className="mr-2 h-4 w-4 animate-spin" />
                  Loading gyms...
                </div>
              ) : searchResults.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 px-4 py-8 text-center">
                  <p className="text-sm text-slate-500">No gyms matched your search.</p>
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
                              : "bg-white ring-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => handleSelectFromRegistry(gym.id)}
                            className="min-w-0 flex-1 text-left"
                          >
                            <p className="truncate text-sm font-semibold text-slate-900">{gym.name}</p>
                            <p className="mt-0.5 truncate text-xs text-slate-500">
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
      <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
        {title}
      </p>
      <div className="mt-2 space-y-1.5">
        {gyms.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 px-4 py-4 text-center text-sm text-slate-500">
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
                  isActive ? "bg-ember-soft" : "bg-slate-50 hover:bg-slate-100"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelect(gym.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="truncate text-sm font-semibold text-slate-900">{gym.name}</p>
                  <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-500">
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
      className="rounded-full bg-white/90 p-1.5 text-slate-400 ring-1 ring-slate-200 transition hover:text-ember"
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
