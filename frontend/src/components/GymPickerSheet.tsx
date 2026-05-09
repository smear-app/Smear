import { useEffect, useRef, useState } from "react"
import { FiBookmark, FiCheck, FiLoader, FiSearch } from "react-icons/fi"
import { RiBookmarkFill } from "react-icons/ri"
import { useGym } from "../context/GymContext"
import { formatGymLocation } from "../lib/gyms"
import SurfaceLayer from "./surfaces/SurfaceLayer"

interface GymPickerSheetProps {
  isOpen: boolean
  activeGymId?: string | null
  title?: string
  onClose: () => void
  onSelect: (gymId: string, gymName: string) => void
}

export default function GymPickerSheet({
  isOpen,
  activeGymId,
  title = "Select gym",
  onClose,
  onSelect,
}: GymPickerSheetProps) {
  const { bookmarkedGymIds, isHydrated, toggleBookmark, searchGyms } = useGym()
  const [query, setQuery] = useState("")
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  const searchResults = searchGyms(query)

  useEffect(() => {
    if (!isOpen) return undefined
    const id = window.setTimeout(() => {
      searchInputRef.current?.focus()
    }, 10)
    return () => window.clearTimeout(id)
  }, [isOpen])

  function handleClose() {
    setQuery("")
    onClose()
  }

  function handleSelect(gymId: string, gymName: string) {
    setQuery("")
    onSelect(gymId, gymName)
  }

  return (
    <SurfaceLayer open={isOpen} backdropClassName="bg-black/20" zIndexClassName="z-[60]" onBackdropPress={handleClose}>
      <div className="pointer-events-none flex h-full w-full items-center justify-center px-5">
        <div className="pointer-events-auto flex h-[520px] w-full max-w-[420px] flex-col rounded-[28px] bg-stone-surface p-4 shadow-[0_30px_80px_rgba(15,23,42,0.2)] ring-1 ring-stone-border">
          <div className="flex items-start justify-between gap-4">
            <p className="text-sm font-semibold text-stone-text">{title}</p>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-full bg-stone-alt px-3 py-1.5 text-xs font-semibold text-stone-secondary"
            >
              Close
            </button>
          </div>

          <label className="mt-3 flex items-center gap-2 rounded-2xl border border-stone-border bg-stone-surface px-3 py-2.5">
            <FiSearch className="h-4 w-4 text-stone-muted" />
            <input
              ref={searchInputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search gyms, cities, or chains"
              className="app-native-text-entry w-full bg-transparent text-stone-text outline-none placeholder:text-stone-muted"
            />
          </label>

          <div className="mt-4 min-h-0 flex-1 overflow-y-auto px-1 py-1">
            {!isHydrated ? (
              <div className="flex items-center justify-center py-10 text-sm text-stone-muted">
                <FiLoader className="mr-2 h-4 w-4 animate-spin" />
                Loading gyms...
              </div>
            ) : searchResults.length === 0 ? (
              <div className="rounded-2xl bg-stone-surface px-4 py-8 text-center">
                <p className="text-sm text-stone-muted">No gyms matched your search.</p>
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
                        onClick={() => handleSelect(gym.id, gym.name)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <p className="truncate text-sm font-semibold text-stone-text">{gym.name}</p>
                        <p className="mt-0.5 truncate text-xs text-stone-muted">
                          {formatGymLocation(gym)}
                          {gym.address ? ` • ${gym.address}` : ""}
                        </p>
                      </button>
                      <div className="ml-3 flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          aria-label={`${isBookmarked ? "Remove bookmark for" : "Bookmark"} ${gym.name}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleBookmark(gym.id)
                          }}
                          className="rounded-full bg-stone-surface/90 p-1.5 text-stone-muted ring-1 ring-stone-border transition hover:text-ember"
                        >
                          {isBookmarked ? (
                            <RiBookmarkFill className="h-3.5 w-3.5 text-ember" />
                          ) : (
                            <FiBookmark className="h-3.5 w-3.5" />
                          )}
                        </button>
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
    </SurfaceLayer>
  )
}
