import { useEffect, useMemo, useRef, useState } from "react"
import { FiBookmark, FiCheck, FiChevronDown, FiMapPin, FiPlus, FiSearch } from "react-icons/fi"
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
    setActiveGym,
    bookmarkGym,
    searchGyms,
  } = useGym()
  const [isOpen, setIsOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [query, setQuery] = useState("")
  const containerRef = useRef<HTMLDivElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  const searchResults = useMemo(() => searchGyms(query), [query, searchGyms])
  const visibleRecentGyms = useMemo(
    () => recentGyms.filter((gym) => !bookmarkedGymIds.includes(gym.id)),
    [bookmarkedGymIds, recentGyms],
  )

  useEffect(() => {
    if (!isOpen) return undefined

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    window.addEventListener("mousedown", handlePointerDown)
    return () => window.removeEventListener("mousedown", handlePointerDown)
  }, [isOpen])

  useEffect(() => {
    if (!isAddModalOpen) return undefined

    const timeoutId = window.setTimeout(() => {
      searchInputRef.current?.focus()
    }, 10)

    return () => window.clearTimeout(timeoutId)
  }, [isAddModalOpen])

  function handleSelect(gymId: string) {
    setActiveGym(gymId)
    setIsOpen(false)
  }

  function handleAddFromRegistry(gymId: string) {
    bookmarkGym(gymId)
    setActiveGym(gymId)
    setQuery("")
    setIsAddModalOpen(false)
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 rounded-2xl bg-white/85 px-3 py-2 text-left shadow-sm ring-1 ring-slate-200 transition hover:bg-white"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{activeGym.name}</p>
          <p className="mt-0.5 truncate text-xs text-slate-500">{formatGymLocation(activeGym)}</p>
        </div>
        <FiChevronDown
          className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <>
          <div className="absolute left-0 right-0 top-[calc(100%+12px)] z-30 rounded-[24px] bg-white p-4 shadow-[0_24px_60px_rgba(15,23,42,0.18)] ring-1 ring-slate-200">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Select gym</p>
                <p className="text-xs text-slate-500">Active gym for new logs</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700"
              >
                <FiPlus className="h-4 w-4" />
                + Add
              </button>
            </div>

            <SelectorSection
              title="Bookmarked gyms"
              gyms={bookmarkedGyms}
              activeGymId={activeGym.id}
              bookmarkedGymIds={bookmarkedGymIds}
              onSelect={handleSelect}
              onBookmark={bookmarkGym}
              className="mt-4"
            />
            <SelectorSection
              title="Recently visited"
              gyms={visibleRecentGyms}
              activeGymId={activeGym.id}
              bookmarkedGymIds={bookmarkedGymIds}
              onSelect={handleSelect}
              onBookmark={bookmarkGym}
              className="mt-4"
            />
          </div>

          {isAddModalOpen && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/20 px-5">
              <div className="w-full max-w-[420px] rounded-[28px] bg-[#fcfcfa] p-4 shadow-[0_30px_80px_rgba(15,23,42,0.2)] ring-1 ring-slate-200">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Add gym</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Search the canonical gym registry.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddModalOpen(false)
                      setQuery("")
                    }}
                    className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600"
                  >
                    Close
                  </button>
                </div>

                <label className="mt-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
                  <FiSearch className="h-4 w-4 text-slate-400" />
                  <input
                    ref={searchInputRef}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search gyms, cities, or chains"
                    className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </label>

                <div className="mt-4 max-h-[320px] space-y-2 overflow-y-auto pr-1">
                  {searchResults.map((gym) => {
                    const isBookmarked = bookmarkedGymIds.includes(gym.id)

                    return (
                      <button
                        key={gym.id}
                        type="button"
                        onClick={() => handleAddFromRegistry(gym.id)}
                        className="flex w-full items-center justify-between rounded-2xl bg-white px-3 py-2.5 text-left ring-1 ring-slate-200 transition hover:bg-slate-50"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">{gym.name}</p>
                          <p className="mt-0.5 truncate text-xs text-slate-500">
                            {formatGymLocation(gym)}
                            {gym.address ? ` • ${gym.address}` : ""}
                          </p>
                        </div>
                        <span
                          className={`ml-3 shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            isBookmarked
                              ? "bg-slate-100 text-slate-500"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {isBookmarked ? "Saved" : "Add"}
                        </span>
                      </button>
                    )
                  })}

                  {searchResults.length === 0 && (
                    <div className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                      No gyms matched your search.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
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
  onBookmark,
  className = "",
}: {
  title: string
  gyms: GymRecord[]
  activeGymId: string
  bookmarkedGymIds: string[]
  onSelect: (gymId: string) => void
  onBookmark: (gymId: string) => void
  className?: string
}) {
  return (
    <div className={className}>
      <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
        {title}
      </p>
      <div className="mt-2 space-y-1.5">
        {gyms.map((gym) => {
          const isActive = gym.id === activeGymId
          const isBookmarked = bookmarkedGymIds.includes(gym.id)

          return (
            <div
              key={gym.id}
              className={`flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left transition ${
                isActive ? "bg-emerald-50" : "bg-slate-50 hover:bg-slate-100"
              }`}
            >
              <button type="button" onClick={() => onSelect(gym.id)} className="min-w-0 flex-1">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{gym.name}</p>
                  <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-500">
                    <FiMapPin className="h-3.5 w-3.5 shrink-0" />
                    {formatGymLocation(gym)}
                  </p>
                </div>
              </button>
              <div className="ml-3 flex shrink-0 items-center gap-2">
                {!isBookmarked && (
                  <button
                    type="button"
                    aria-label={`Bookmark ${gym.name}`}
                    onClick={(event) => {
                      event.stopPropagation()
                      onBookmark(gym.id)
                    }}
                    className="rounded-full bg-white/90 p-1.5 text-slate-400 ring-1 ring-slate-200 transition hover:text-emerald-600"
                  >
                    <FiBookmark className="h-3.5 w-3.5" />
                  </button>
                )}
                {isActive && <FiCheck className="h-4 w-4 text-emerald-600" />}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default GymSelector
