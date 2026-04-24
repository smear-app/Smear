import type { EnrichedClimb } from "../primitives"

export type ArchetypeTimeframe = "30-days" | "all-time"

export type ArchetypeTimeframeOption = {
  value: ArchetypeTimeframe
  label: string
}

const DAY_MS = 24 * 60 * 60 * 1000
const THIRTY_DAYS = 30

export const defaultArchetypeTimeframe: ArchetypeTimeframe = "30-days"

export const archetypeTimeframeOptions: ArchetypeTimeframeOption[] = [
  { value: "30-days", label: "30 Days" },
  { value: "all-time", label: "All Time" },
]

function getArchetypeTimeframeStart(timeframe: ArchetypeTimeframe, now: Date): Date | null {
  if (timeframe === "all-time") {
    return null
  }

  return new Date(now.getTime() - THIRTY_DAYS * DAY_MS)
}

export function filterClimbsForArchetypeTimeframe(
  climbs: readonly EnrichedClimb[],
  timeframe: ArchetypeTimeframe,
  now: Date,
): EnrichedClimb[] {
  const start = getArchetypeTimeframeStart(timeframe, now)

  if (start === null) {
    return [...climbs]
  }

  const startTime = start.getTime()
  const endTime = now.getTime()

  return climbs.filter((climb) => {
    const loggedAt = new Date(climb.loggedAt).getTime()
    return Number.isFinite(loggedAt) && loggedAt >= startTime && loggedAt <= endTime
  })
}
