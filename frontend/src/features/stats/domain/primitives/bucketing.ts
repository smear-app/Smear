import type { EnrichedClimb } from "./types"

export type TimeBucket<TClimb extends EnrichedClimb = EnrichedClimb> = {
  key: string
  startAt: string
  endAt: string
  climbs: TClimb[]
}

function toUtcDateKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function getWeekStartUtc(value: string): Date | null {
  const date = new Date(value)

  if (!Number.isFinite(date.getTime())) {
    return null
  }

  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = start.getUTCDay()
  const daysSinceMonday = (day + 6) % 7
  start.setUTCDate(start.getUTCDate() - daysSinceMonday)
  return start
}

export function bucketClimbsByWeek<TClimb extends EnrichedClimb>(climbs: readonly TClimb[]): Array<TimeBucket<TClimb>> {
  const bucketsByKey = new Map<string, TimeBucket<TClimb>>()

  for (const climb of climbs) {
    const weekStart = getWeekStartUtc(climb.loggedAt)

    if (!weekStart) {
      continue
    }

    const weekEnd = new Date(weekStart)
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 7)

    const key = toUtcDateKey(weekStart)
    const bucket = bucketsByKey.get(key) ?? {
      key,
      startAt: weekStart.toISOString(),
      endAt: weekEnd.toISOString(),
      climbs: [],
    }

    bucket.climbs.push(climb)
    bucketsByKey.set(key, bucket)
  }

  return [...bucketsByKey.values()].sort((left, right) => left.startAt.localeCompare(right.startAt))
}
