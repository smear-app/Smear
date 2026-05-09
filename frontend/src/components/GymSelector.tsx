import { useMemo, useState, type MouseEvent as ReactMouseEvent } from "react"
import { FiBookmark, FiCheck, FiChevronDown, FiMapPin } from "react-icons/fi"

import { RiBookmarkFill } from "react-icons/ri"
import { useGym } from "../context/GymContext"
import { formatGymLocation, type GymRecord } from "../lib/gyms"
import AnchoredPopover from "./logbook/AnchoredPopover"
import GymPickerSheet from "./GymPickerSheet"

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
  } = useGym()
  const [isOpen, setIsOpen] = useState(false)
  const [isRegistryOpen, setIsRegistryOpen] = useState(false)

  const selectedSnapshot = useMemo(
    () => getSelectedGymSnapshot(activeGym, isHydrated),
    [activeGym, isHydrated],
  )

  function handleSelectFromPopup(gymId: string) {
    selectGym(gymId)
    setIsOpen(false)
  }

  function handleSelectFromRegistry(gymId: string) {
    selectGym(gymId)
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
    <>
      <AnchoredPopover
        open={isOpen}
        onClose={() => setIsOpen(false)}
        align="left"
        panelClassName="!w-[min(20rem,calc(100vw-2.5rem))] !rounded-[24px] !border-transparent !bg-stone-surface !p-4 !shadow-[0_24px_60px_rgba(15,23,42,0.18)] ring-1 ring-stone-border dark:ring-stone-border"
        trigger={
          <div className={className}>
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
          </div>
        }
      >
        <div>
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
      </AnchoredPopover>

      <GymPickerSheet
        isOpen={isRegistryOpen}
        activeGymId={activeGymId}
        onClose={() => setIsRegistryOpen(false)}
        onSelect={(gymId) => handleSelectFromRegistry(gymId)}
      />
    </>
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
