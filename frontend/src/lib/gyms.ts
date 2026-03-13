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
  activeGymId: string
  bookmarkedGymIds: string[]
  recentGymIds: string[]
}

export interface BuiltGymState {
  activeGym: GymRecord
  bookmarkedGyms: GymRecord[]
  recentGyms: GymRecord[]
  bookmarkedGymIds: string[]
  recentGymIds: string[]
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

export const DEFAULT_ACTIVE_GYM_ID = "mission-cliffs"
export const DEFAULT_BOOKMARKED_GYM_IDS = ["mission-cliffs", "dogpatch-boulders"]
export const DEFAULT_RECENT_GYM_IDS = ["pacific-pipe", "berkeley-ironworks", "mission-cliffs"]

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

export function buildGymState(storedState?: Partial<StoredGymState> | null): BuiltGymState {
  const bookmarkedGymIds = uniqueValidGymIds(
    storedState?.bookmarkedGymIds?.length
      ? storedState.bookmarkedGymIds
      : DEFAULT_BOOKMARKED_GYM_IDS,
  )
  const recentGymIds = uniqueValidGymIds(
    storedState?.recentGymIds?.length ? storedState.recentGymIds : DEFAULT_RECENT_GYM_IDS,
  )
  const activeGym =
    getGymById(storedState?.activeGymId ?? "") ??
    getGymById(DEFAULT_ACTIVE_GYM_ID) ??
    GYM_REGISTRY[0]

  return {
    activeGym,
    bookmarkedGyms: bookmarkedGymIds.map((gymId) => getGymById(gymId)).filter(isGymRecord),
    recentGyms: recentGymIds.map((gymId) => getGymById(gymId)).filter(isGymRecord),
    bookmarkedGymIds,
    recentGymIds,
  }
}

export function addGymToRecent(recentGymIds: string[], gymId: string, maxItems = 4) {
  return [gymId, ...recentGymIds.filter((id) => id !== gymId)].slice(0, maxItems)
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
