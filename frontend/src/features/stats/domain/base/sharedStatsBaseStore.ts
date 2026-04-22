import { fetchStatsBase, type StatsBaseData } from "./fetchStatsBase"
import { prepareEnrichedClimbs } from "./normalizeClimbs"
import type { EnrichedClimb } from "../primitives"

const STATS_BASE_STALE_MS = 5 * 60 * 1000

export type SharedStatsBaseStatus = "idle" | "loading" | "success" | "error"

export type SharedStatsBaseSnapshot = {
  userId: string | null
  statsBase: StatsBaseData | null
  enrichedClimbs: EnrichedClimb[]
  status: SharedStatsBaseStatus
  error: Error | null
  fetchedAt: number
  version: number
}

let snapshot: SharedStatsBaseSnapshot = {
  userId: null,
  statsBase: null,
  enrichedClimbs: [],
  status: "idle",
  error: null,
  fetchedAt: 0,
  version: 0,
}

let inFlightRequest: { userId: string; promise: Promise<SharedStatsBaseSnapshot> } | null = null

const listeners = new Set<() => void>()

function emitChange() {
  for (const listener of listeners) {
    listener()
  }
}

function setSnapshot(nextSnapshot: SharedStatsBaseSnapshot) {
  snapshot = nextSnapshot
  emitChange()
}

function isFreshForUser(userId: string, now = Date.now()) {
  return (
    snapshot.userId === userId &&
    snapshot.status === "success" &&
    snapshot.statsBase !== null &&
    now - snapshot.fetchedAt < STATS_BASE_STALE_MS
  )
}

export function subscribeSharedStatsBase(listener: () => void) {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

export function getSharedStatsBaseSnapshot(): SharedStatsBaseSnapshot {
  return snapshot
}

export function invalidateSharedStatsBase(userId?: string) {
  if (userId && snapshot.userId !== userId) {
    return
  }

  setSnapshot({
    ...snapshot,
    status: snapshot.statsBase ? "success" : "idle",
    error: null,
    fetchedAt: 0,
    version: snapshot.version + 1,
  })
}

export function removeClimbFromSharedStatsBase(climbId: string, userId?: string) {
  if (userId && snapshot.userId !== userId) {
    return
  }

  if (!snapshot.statsBase) {
    invalidateSharedStatsBase(userId)
    return
  }

  const statsBase: StatsBaseData = {
    ...snapshot.statsBase,
    climbs: snapshot.statsBase.climbs.filter((climb) => climb.id !== climbId),
  }

  setSnapshot({
    ...snapshot,
    statsBase,
    enrichedClimbs: snapshot.enrichedClimbs.filter((climb) => climb.id !== climbId),
    status: "success",
    error: null,
    fetchedAt: 0,
    version: snapshot.version + 1,
  })
}

export function resetSharedStatsBase() {
  inFlightRequest = null
  setSnapshot({
    userId: null,
    statsBase: null,
    enrichedClimbs: [],
    status: "idle",
    error: null,
    fetchedAt: 0,
    version: snapshot.version + 1,
  })
}

export async function loadSharedStatsBase(userId: string, options: { force?: boolean } = {}) {
  if (!options.force && isFreshForUser(userId)) {
    return snapshot
  }

  if (!options.force && inFlightRequest?.userId === userId) {
    return inFlightRequest.promise
  }

  const nextVersion = snapshot.version + 1

  setSnapshot({
    userId,
    statsBase: snapshot.userId === userId ? snapshot.statsBase : null,
    enrichedClimbs: snapshot.userId === userId ? snapshot.enrichedClimbs : [],
    status: "loading",
    error: null,
    fetchedAt: snapshot.userId === userId ? snapshot.fetchedAt : 0,
    version: nextVersion,
  })

  const promise = fetchStatsBase(userId)
    .then((statsBase) => {
      const nextSnapshot: SharedStatsBaseSnapshot = {
        userId,
        statsBase,
        enrichedClimbs: prepareEnrichedClimbs(statsBase),
        status: "success",
        error: null,
        fetchedAt: Date.now(),
        version: nextVersion + 1,
      }

      setSnapshot(nextSnapshot)
      return nextSnapshot
    })
    .catch((error) => {
      const nextSnapshot: SharedStatsBaseSnapshot = {
        userId,
        statsBase: snapshot.userId === userId ? snapshot.statsBase : null,
        enrichedClimbs: snapshot.userId === userId ? snapshot.enrichedClimbs : [],
        status: "error",
        error: error instanceof Error ? error : new Error("Failed to load stats"),
        fetchedAt: 0,
        version: nextVersion + 1,
      }

      setSnapshot(nextSnapshot)
      return nextSnapshot
    })
    .finally(() => {
      if (inFlightRequest?.promise === promise) {
        inFlightRequest = null
      }
    })

  inFlightRequest = { userId, promise }
  return promise
}
