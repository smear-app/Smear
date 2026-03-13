export interface GymRecord {
  id: string
  name: string
  city: string
  state: string
  address?: string
  metadata?: {
    chain?: string
    disciplines?: string[]
  }
}

export interface StoredGymState {
  activeGymId: string | null
  bookmarkedGymIds: string[]
  recentHistoryGymIds: string[]
  recentGymIds: string[]
  hiddenGymIds: string[]
}

export interface BuiltGymState {
  activeGym: GymRecord | null
  bookmarkedGyms: GymRecord[]
  recentGyms: GymRecord[]
  bookmarkedGymIds: string[]
  recentGymIds: string[]
  recentHistoryGymIds: string[]
  hiddenGymIds: string[]
}

export const GYM_REGISTRY: GymRecord[] = [
  {
    id: "mission-cliffs",
    name: "Mission Cliffs",
    city: "San Francisco",
    state: "CA",
    address: "2295 Harrison St",
    metadata: { chain: "Touchstone", disciplines: ["rope", "bouldering"] },
  },
  {
    id: "dogpatch-boulders",
    name: "Dogpatch Boulders",
    city: "San Francisco",
    state: "CA",
    address: "2573 3rd St",
    metadata: { chain: "Touchstone", disciplines: ["bouldering"] },
  },
  {
    id: "pacific-pipe",
    name: "Pacific Pipe",
    city: "Oakland",
    state: "CA",
    address: "920 22nd Ave",
    metadata: { chain: "Touchstone", disciplines: ["rope", "bouldering"] },
  },
  {
    id: "berkeley-ironworks",
    name: "Berkeley Ironworks",
    city: "Berkeley",
    state: "CA",
    address: "800 Potter St",
    metadata: { chain: "Touchstone", disciplines: ["rope", "bouldering"] },
  },
  {
    id: "movement-san-francisco",
    name: "Movement San Francisco",
    city: "San Francisco",
    state: "CA",
    address: "924 Mason St",
    metadata: { chain: "Movement", disciplines: ["bouldering"] },
  },
  {
    id: "the-studio",
    name: "The Studio",
    city: "San Jose",
    state: "CA",
    address: "396 S 1st St",
    metadata: { disciplines: ["bouldering"] },
  },
  {
    id: "planet-granite-sunnyvale",
    name: "Movement Sunnyvale",
    city: "Sunnyvale",
    state: "CA",
    address: "815 Stewart Dr",
    metadata: { chain: "Movement", disciplines: ["rope", "bouldering"] },
  },
  {
    id: "bridges-rock-gym",
    name: "Bridges Rock Gym",
    city: "El Cerrito",
    state: "CA",
    address: "5635 San Pablo Ave",
    metadata: { disciplines: ["rope", "bouldering"] },
  },
]

export const MAX_RECENT_GYMS = 3

export const ACTIVE_GYM_STORAGE_KEY = "smear.active-gym"

const gymRegistryMap = new Map(GYM_REGISTRY.map((gym) => [gym.id, gym]))

export function getGymById(gymId: string) {
  return gymRegistryMap.get(gymId)
}

function isGymRecord(gym: GymRecord | undefined): gym is GymRecord {
  return Boolean(gym)
}

export function formatGymLocation(gym: GymRecord) {
  return `${gym.city}, ${gym.state}`
}

function uniqueValidGymIds(gymIds: string[]) {
  return Array.from(new Set(gymIds)).filter((gymId) => gymRegistryMap.has(gymId))
}

function resolveStoredGymIds(
  storedGymIds: string[] | undefined,
  fallbackGymIds: string[],
) {
  return storedGymIds === undefined ? fallbackGymIds : storedGymIds
}

function normalizeBookmarkedGymIds(bookmarkedGymIds: string[], hiddenGymIds: string[]) {
  return uniqueValidGymIds(bookmarkedGymIds).filter((gymId) => !hiddenGymIds.includes(gymId))
}

function normalizeRecentHistoryGymIds(recentHistoryGymIds: string[]) {
  return uniqueValidGymIds(recentHistoryGymIds)
}

function normalizeRecentGymIds(
  recentHistoryGymIds: string[],
  bookmarkedGymIds: string[],
  hiddenGymIds: string[],
) {
  // Visible "Recently Visited" is always a derived view. We scan the full
  // visit history ordered most-recent-first, exclude bookmarked/hidden gyms,
  // then take the first 3 remaining gyms so older non-bookmarked entries can
  // backfill when newer history items are bookmarked.
  return uniqueValidGymIds(recentHistoryGymIds)
    .filter((gymId) => !bookmarkedGymIds.includes(gymId) && !hiddenGymIds.includes(gymId))
    .slice(0, MAX_RECENT_GYMS)
}

export function buildGymState(storedState?: Partial<StoredGymState> | null): BuiltGymState {
  // Canonical registry records stay immutable. User-side bookmark, recent, and
  // hidden preferences only affect which registry gyms are surfaced in the UI.
  const hiddenGymIds = uniqueValidGymIds(storedState?.hiddenGymIds ?? [])
  const bookmarkedGymIds = normalizeBookmarkedGymIds(
    resolveStoredGymIds(storedState?.bookmarkedGymIds, []),
    hiddenGymIds,
  )
  const recentHistoryGymIds = normalizeRecentHistoryGymIds(
    resolveStoredGymIds(
      storedState?.recentHistoryGymIds ?? storedState?.recentGymIds,
      [],
    ),
  )
  const recentGymIds = normalizeRecentGymIds(
    recentHistoryGymIds,
    bookmarkedGymIds,
    hiddenGymIds,
  )
  const activeGym = storedState?.activeGymId ? getGymById(storedState.activeGymId) ?? null : null

  return {
    activeGym,
    bookmarkedGyms: bookmarkedGymIds.map((gymId) => getGymById(gymId)).filter(isGymRecord),
    recentGyms: recentGymIds.map((gymId) => getGymById(gymId)).filter(isGymRecord),
    bookmarkedGymIds,
    recentGymIds,
    recentHistoryGymIds,
    hiddenGymIds,
  }
}

export function addGymToRecent(
  recentHistoryGymIds: string[],
  gymId: string,
) {
  // Keep full local visit history so the derived recent list can backfill from
  // older entries and restore correct placement after unbookmarking.
  return uniqueValidGymIds([gymId, ...recentHistoryGymIds.filter((id) => id !== gymId)])
}

export function removeGymFromIds(gymIds: string[], gymId: string) {
  return gymIds.filter((id) => id !== gymId)
}

export function upsertGymId(gymIds: string[], gymId: string) {
  return uniqueValidGymIds([gymId, ...gymIds])
}

export function searchGymRegistry(query: string) {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return GYM_REGISTRY

  // TODO: Replace this local registry search with backend-powered search once
  // the canonical gym registry API is available.
  return GYM_REGISTRY.filter((gym) => {
    const haystack = [
      gym.name,
      gym.city,
      gym.state,
      gym.address ?? "",
      gym.metadata?.chain ?? "",
      ...(gym.metadata?.disciplines ?? []),
    ]
      .join(" ")
      .toLowerCase()

    return haystack.includes(normalizedQuery)
  })
}
