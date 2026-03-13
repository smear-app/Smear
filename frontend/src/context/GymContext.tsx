import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  addGymToRecent,
  buildGymState,
  getGymById,
  getGymStorageKey,
  removeGymFromIds,
  searchGymRegistry,
  type GymRecord,
  upsertGymId,
} from "../lib/gyms"

interface GymContextValue {
  activeGym: GymRecord | null
  bookmarkedGyms: GymRecord[]
  recentGyms: GymRecord[]
  bookmarkedGymIds: string[]
  selectGym: (gymId: string) => void
  toggleBookmark: (gymId: string) => void
  searchGyms: (query: string) => GymRecord[]
}

const GymContext = createContext<GymContextValue | null>(null)

function readStoredGyms(userId: string | undefined) {
  if (typeof window === "undefined") return null
  if (!userId) return null

  try {
    const rawValue = window.localStorage.getItem(getGymStorageKey(userId))
    return rawValue ? JSON.parse(rawValue) : null
  } catch {
    return null
  }
}

export function GymProvider({
  children,
  storageUserId,
}: {
  children: ReactNode
  storageUserId?: string
}) {
  const initialState = buildGymState(readStoredGyms(storageUserId))
  const [activeGymId, setActiveGymId] = useState<string | null>(initialState.activeGym?.id ?? null)
  const [bookmarkedGymIds, setBookmarkedGymIds] = useState(initialState.bookmarkedGymIds)
  const [recentHistoryGymIds, setRecentHistoryGymIds] = useState(initialState.recentHistoryGymIds)
  const [hiddenGymIds, setHiddenGymIds] = useState(initialState.hiddenGymIds)

  useEffect(() => {
    if (!storageUserId) return

    // TODO: Persist active gym selection per user once profile-backed settings exist.
    // TODO: Persist user bookmark selections with profile-backed preferences.
    // TODO: Persist local visit history so recent derivation can move off localStorage.
    // TODO: Replace local visit-history derivation with real session/log history from the backend.
    // TODO: Preserve the initial no-gym-selected state for brand new users when user records are first created.
    // For now this stays in localStorage so active gym, bookmarks, visit history,
    // and user-side hidden gyms survive app restarts without backend support.
    // Local state is namespaced per authenticated user so one user's selections
    // do not appear for another brand new account on the same device.
    // TODO: Persist hidden/removed gyms as user-specific preference state.
    window.localStorage.setItem(
      getGymStorageKey(storageUserId),
      JSON.stringify({
        activeGymId,
        bookmarkedGymIds,
        recentHistoryGymIds,
        hiddenGymIds,
      }),
    )
  }, [activeGymId, bookmarkedGymIds, hiddenGymIds, recentHistoryGymIds, storageUserId])

  const value = useMemo(() => {
    const state = buildGymState({
      activeGymId,
      bookmarkedGymIds,
      recentHistoryGymIds,
      hiddenGymIds,
    })
    const { activeGym, bookmarkedGyms, recentGyms } = state

    return {
      activeGym,
      bookmarkedGyms,
      recentGyms,
      bookmarkedGymIds: state.bookmarkedGymIds,
      selectGym: (gymId: string) => {
        if (!getGymById(gymId)) return

        setHiddenGymIds((currentIds) => removeGymFromIds(currentIds, gymId))
        setActiveGymId(gymId)
        // Recent visibility is derived from full visit history, not manually
        // managed. Selecting a gym records a visit and the UI recomputes the
        // top 3 most recent non-bookmarked gyms from that history.
        setRecentHistoryGymIds((currentIds) => addGymToRecent(currentIds, gymId))
      },
      toggleBookmark: (gymId: string) => {
        if (!getGymById(gymId)) return

        if (state.bookmarkedGymIds.includes(gymId)) {
          // Unbookmarking does not mutate visit history. The gym naturally
          // returns to its correct recent position only if its stored visit
          // recency places it inside the current visible top 3 non-bookmarked gyms.
          setBookmarkedGymIds((currentIds) => removeGymFromIds(currentIds, gymId))
          setHiddenGymIds((currentIds) => removeGymFromIds(currentIds, gymId))
          return
        }

        setHiddenGymIds((currentIds) => removeGymFromIds(currentIds, gymId))
        setBookmarkedGymIds((currentIds) => upsertGymId(currentIds, gymId))
      },
      searchGyms: (query: string) => {
        return searchGymRegistry(query)
      },
    }
  }, [activeGymId, bookmarkedGymIds, hiddenGymIds, recentHistoryGymIds])

  return <GymContext.Provider value={value}>{children}</GymContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useGym() {
  const context = useContext(GymContext)
  if (!context) throw new Error("useGym must be used inside GymProvider")
  return context
}
