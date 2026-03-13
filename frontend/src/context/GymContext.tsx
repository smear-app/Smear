import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  ACTIVE_GYM_STORAGE_KEY,
  addGymToRecent,
  buildGymState,
  DEFAULT_ACTIVE_GYM_ID,
  getGymById,
  removeGymFromIds,
  searchGymRegistry,
  type GymRecord,
  upsertGymId,
} from "../lib/gyms"

interface GymContextValue {
  activeGym: GymRecord
  bookmarkedGyms: GymRecord[]
  recentGyms: GymRecord[]
  bookmarkedGymIds: string[]
  selectGym: (gymId: string) => void
  toggleBookmark: (gymId: string) => void
  searchGyms: (query: string) => GymRecord[]
}

const GymContext = createContext<GymContextValue | null>(null)

function readStoredGyms() {
  if (typeof window === "undefined") return null

  try {
    const rawValue = window.localStorage.getItem(ACTIVE_GYM_STORAGE_KEY)
    return rawValue ? JSON.parse(rawValue) : null
  } catch {
    return null
  }
}

export function GymProvider({ children }: { children: ReactNode }) {
  const initialState = buildGymState(readStoredGyms())
  const [activeGymId, setActiveGymId] = useState(initialState.activeGym.id)
  const [bookmarkedGymIds, setBookmarkedGymIds] = useState(initialState.bookmarkedGymIds)
  const [recentHistoryGymIds, setRecentHistoryGymIds] = useState(initialState.recentHistoryGymIds)
  const [hiddenGymIds, setHiddenGymIds] = useState(initialState.hiddenGymIds)

  useEffect(() => {
    // TODO: Persist gym preferences per user once profile-backed settings exist.
    // For now this stays in localStorage so active gym, bookmarks, and recent
    // selections, plus user-side hidden gyms, survive app restarts without backend support.
    // TODO: Persist hidden/removed gyms as user-specific preference state.
    window.localStorage.setItem(
      ACTIVE_GYM_STORAGE_KEY,
      JSON.stringify({
        activeGymId,
        bookmarkedGymIds,
        recentHistoryGymIds,
        hiddenGymIds,
      }),
    )
  }, [activeGymId, bookmarkedGymIds, hiddenGymIds, recentHistoryGymIds])

  const value = useMemo(() => {
    const state = buildGymState({
      activeGymId,
      bookmarkedGymIds,
      recentHistoryGymIds,
      hiddenGymIds,
    })
    const activeGym =
      getGymById(activeGymId) ??
      getGymById(DEFAULT_ACTIVE_GYM_ID) ??
      state.activeGym
    const { bookmarkedGyms, recentGyms } = state

    return {
      activeGym,
      bookmarkedGyms,
      recentGyms,
      bookmarkedGymIds: state.bookmarkedGymIds,
      selectGym: (gymId: string) => {
        if (!getGymById(gymId)) return

        setHiddenGymIds((currentIds) => removeGymFromIds(currentIds, gymId))
        setActiveGymId(gymId)
        // TODO: Replace this local recent list with real climb/session history
        // once gym visits are derived from backend activity data. The visible
        // top-3 recents are derived from this history after bookmark/hidden
        // filtering instead of being persisted as a separate user-facing list.
        setRecentHistoryGymIds((currentIds) => addGymToRecent(currentIds, gymId))
      },
      toggleBookmark: (gymId: string) => {
        if (!getGymById(gymId)) return

        if (state.bookmarkedGymIds.includes(gymId)) {
          // Unbookmarking only changes user-side preference state. The gym will
          // reappear in "Recently Visited" only if its existing history entry
          // still lands inside the current filtered top-3 recent set.
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
