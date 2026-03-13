import { supabase } from "./supabase"

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

export const MAX_RECENT_GYMS = 3

export const ACTIVE_GYM_STORAGE_KEY = "smear.active-gym"

export function getGymStorageKey(userId: string) {
  return `${ACTIVE_GYM_STORAGE_KEY}:${userId}`
}

// Runtime cache — populated from Supabase on app mount. All sync gym
// lookups (bookmarks, recent, active) resolve against this cache.
const gymCache = new Map<string, GymRecord>()

function dbRowToGymRecord(row: Record<string, unknown>): GymRecord {
  return {
    id: row.id as string,
    name: row.name as string,
    city: row.city as string,
    state: row.state as string,
    address: (row.address as string | null) ?? undefined,
  }
}

export function registerGymsInCache(gyms: GymRecord[]) {
  for (const gym of gyms) {
    gymCache.set(gym.id, gym)
  }
}

export async function loadAllGymsIntoCache(): Promise<void> {
  const { data } = await supabase.from("gyms").select("*").limit(500)
  if (data) registerGymsInCache(data.map(dbRowToGymRecord))
}

export async function getGymsByIds(ids: string[]): Promise<GymRecord[]> {
  if (ids.length === 0) return []
  const { data } = await supabase.from("gyms").select("*").in("id", ids)
  if (!data) return []
  const gyms = data.map(dbRowToGymRecord)
  registerGymsInCache(gyms)
  return gyms
}

export function getGymById(gymId: string): GymRecord | undefined {
  return gymCache.get(gymId)
}

export function formatGymLocation(gym: GymRecord) {
  return `${gym.city}, ${gym.state}`
}

function isGymRecord(gym: GymRecord | undefined): gym is GymRecord {
  return Boolean(gym)
}

function uniqueValidGymIds(gymIds: string[]) {
  return Array.from(new Set(gymIds)).filter((gymId) => gymCache.has(gymId))
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
  return uniqueValidGymIds(recentHistoryGymIds)
    .filter((gymId) => !bookmarkedGymIds.includes(gymId) && !hiddenGymIds.includes(gymId))
    .slice(0, MAX_RECENT_GYMS)
}

export function buildGymState(storedState?: Partial<StoredGymState> | null): BuiltGymState {
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

export function addGymToRecent(recentHistoryGymIds: string[], gymId: string) {
  return uniqueValidGymIds([gymId, ...recentHistoryGymIds.filter((id) => id !== gymId)])
}

export function removeGymFromIds(gymIds: string[], gymId: string) {
  return gymIds.filter((id) => id !== gymId)
}

export function upsertGymId(gymIds: string[], gymId: string) {
  return uniqueValidGymIds([gymId, ...gymIds])
}

export function searchGymCache(query: string): GymRecord[] {
  const all = Array.from(gymCache.values())
  const normalized = query.trim().toLowerCase()
  if (!normalized) return all

  return all.filter((gym) => {
    const haystack = [gym.name, gym.city, gym.state, gym.address ?? ""]
      .join(" ")
      .toLowerCase()
    return haystack.includes(normalized)
  })
}

