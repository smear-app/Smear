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
  searchGymRegistry,
  type GymRecord,
} from "../lib/gyms"

interface GymContextValue {
  activeGym: GymRecord
  bookmarkedGyms: GymRecord[]
  recentGyms: GymRecord[]
  bookmarkedGymIds: string[]
  setActiveGym: (gymId: string) => void
  bookmarkGym: (gymId: string) => void
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
  const [recentGymIds, setRecentGymIds] = useState(initialState.recentGymIds)

  useEffect(() => {
    // TODO: Persist gym preferences per user once profile-backed settings exist.
    // For now this stays in localStorage so active gym, bookmarks, and recent
    // selections survive app restarts without backend support.
    window.localStorage.setItem(
      ACTIVE_GYM_STORAGE_KEY,
      JSON.stringify({
        activeGymId,
        bookmarkedGymIds,
        recentGymIds,
      }),
    )
  }, [activeGymId, bookmarkedGymIds, recentGymIds])

  const value = useMemo(() => {
    const activeGym =
      getGymById(activeGymId) ??
      getGymById(DEFAULT_ACTIVE_GYM_ID) ??
      buildGymState().activeGym
    const bookmarkedGyms = buildGymState({ bookmarkedGymIds }).bookmarkedGyms
    const recentGyms = buildGymState({ recentGymIds }).recentGyms

    return {
      activeGym,
      bookmarkedGyms,
      recentGyms,
      bookmarkedGymIds,
      setActiveGym: (gymId: string) => {
        if (!getGymById(gymId)) return
        setActiveGymId(gymId)
        // TODO: Replace this local recent list with real climb/session history
        // once gym visits are derived from backend activity data.
        setRecentGymIds((currentIds) => addGymToRecent(currentIds, gymId))
      },
      bookmarkGym: (gymId: string) => {
        if (!getGymById(gymId)) return
        setBookmarkedGymIds((currentIds) =>
          currentIds.includes(gymId) ? currentIds : [...currentIds, gymId],
        )
      },
      searchGyms: (query: string) => {
        return searchGymRegistry(query)
      },
    }
  }, [activeGymId, bookmarkedGymIds, recentGymIds])

  return <GymContext.Provider value={value}>{children}</GymContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useGym() {
  const context = useContext(GymContext)
  if (!context) throw new Error("useGym must be used inside GymProvider")
  return context
}
