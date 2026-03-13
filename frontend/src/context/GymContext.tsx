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
  loadAllGymsIntoCache,
  removeGymFromIds,
  searchGymCache,
  type GymRecord,
  upsertGymId,
} from "../lib/gyms"

interface GymContextValue {
  activeGym: GymRecord | null
  bookmarkedGyms: GymRecord[]
  recentGyms: GymRecord[]
  bookmarkedGymIds: string[]
  isHydrated: boolean
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
  const [isHydrated, setIsHydrated] = useState(false)
  const [activeGymId, setActiveGymId] = useState<string | null>(null)
  const [bookmarkedGymIds, setBookmarkedGymIds] = useState<string[]>([])
  const [recentHistoryGymIds, setRecentHistoryGymIds] = useState<string[]>([])
  const [hiddenGymIds, setHiddenGymIds] = useState<string[]>([])

  // Hydrate the gym cache from Supabase then restore stored selections
  useEffect(() => {
    loadAllGymsIntoCache().then(() => {
      const stored = readStoredGyms(storageUserId)
      if (stored) {
        const initial = buildGymState(stored)
        setActiveGymId(initial.activeGym?.id ?? null)
        setBookmarkedGymIds(initial.bookmarkedGymIds)
        setRecentHistoryGymIds(initial.recentHistoryGymIds)
        setHiddenGymIds(initial.hiddenGymIds)
      }
      setIsHydrated(true)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageUserId])

  useEffect(() => {
    if (!isHydrated || !storageUserId) return

    window.localStorage.setItem(
      getGymStorageKey(storageUserId),
      JSON.stringify({
        activeGymId,
        bookmarkedGymIds,
        recentHistoryGymIds,
        hiddenGymIds,
      }),
    )
  }, [activeGymId, bookmarkedGymIds, hiddenGymIds, isHydrated, recentHistoryGymIds, storageUserId])

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
      isHydrated,
      selectGym: (gymId: string) => {
        if (!getGymById(gymId)) return

        setHiddenGymIds((currentIds) => removeGymFromIds(currentIds, gymId))
        setActiveGymId(gymId)
        setRecentHistoryGymIds((currentIds) => addGymToRecent(currentIds, gymId))
      },
      toggleBookmark: (gymId: string) => {
        if (!getGymById(gymId)) return

        if (state.bookmarkedGymIds.includes(gymId)) {
          setBookmarkedGymIds((currentIds) => removeGymFromIds(currentIds, gymId))
          setHiddenGymIds((currentIds) => removeGymFromIds(currentIds, gymId))
          return
        }

        setHiddenGymIds((currentIds) => removeGymFromIds(currentIds, gymId))
        setBookmarkedGymIds((currentIds) => upsertGymId(currentIds, gymId))
      },
      searchGyms: (query: string) => searchGymCache(query),
    }
  }, [activeGymId, bookmarkedGymIds, hiddenGymIds, isHydrated, recentHistoryGymIds])

  return <GymContext.Provider value={value}>{children}</GymContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useGym() {
  const context = useContext(GymContext)
  if (!context) throw new Error("useGym must be used inside GymProvider")
  return context
}
