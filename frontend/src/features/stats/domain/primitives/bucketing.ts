import type { EnrichedClimb } from "./types"

export type TimeBucket<TClimb extends EnrichedClimb = EnrichedClimb> = {
  key: string
  startAt: string
  endAt: string
  climbs: TClimb[]
}

function padDatePart(value: number): string {
  return String(value).padStart(2, "0")
}

export function toLocalDateKey(date: Date): string {
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`
}

function getTimestamp(value: string): number {
  const timestamp = new Date(value).getTime()
  return Number.isFinite(timestamp) ? timestamp : Number.POSITIVE_INFINITY
}

export function getLocalWeekStart(value: string | Date): Date | null {
  const date = new Date(value)

  if (!Number.isFinite(date.getTime())) {
    return null
  }

  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const day = start.getDay()
  const daysSinceMonday = (day + 6) % 7
  start.setDate(start.getDate() - daysSinceMonday)
  start.setHours(0, 0, 0, 0)
  return start
}

function groupClimbsBySession<TClimb extends EnrichedClimb>(climbs: readonly TClimb[]): TClimb[][] {
  const groupsByKey = new Map<string, TClimb[]>()

  for (const climb of climbs) {
    const groupKey = climb.sessionId ? `session:${climb.sessionId}` : `climb:${climb.id}`
    groupsByKey.set(groupKey, [...(groupsByKey.get(groupKey) ?? []), climb])
  }

  return [...groupsByKey.values()].map((group) =>
    [...group].sort((left, right) => getTimestamp(left.loggedAt) - getTimestamp(right.loggedAt) || left.id.localeCompare(right.id)),
  )
}

function getSessionBucketSource(climbs: readonly EnrichedClimb[]): string | null {
  const sessionStart = climbs.find((climb) => climb.sessionStartedAt)?.sessionStartedAt

  if (sessionStart) {
    return sessionStart
  }

  return [...climbs].sort((left, right) => getTimestamp(left.loggedAt) - getTimestamp(right.loggedAt))[0]?.loggedAt ?? null
}

export function bucketClimbsByWeek<TClimb extends EnrichedClimb>(climbs: readonly TClimb[]): Array<TimeBucket<TClimb>> {
  const bucketsByKey = new Map<string, TimeBucket<TClimb>>()

  for (const sessionClimbs of groupClimbsBySession(climbs)) {
    const bucketSource = getSessionBucketSource(sessionClimbs)
    const weekStart = bucketSource ? getLocalWeekStart(bucketSource) : null

    if (!weekStart) {
      continue
    }

    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 7)

    const key = toLocalDateKey(weekStart)
    const bucket = bucketsByKey.get(key) ?? {
      key,
      startAt: weekStart.toISOString(),
      endAt: weekEnd.toISOString(),
      climbs: [],
    }

    bucket.climbs.push(...sessionClimbs)
    bucketsByKey.set(key, bucket)
  }

  return [...bucketsByKey.values()].sort((left, right) => left.startAt.localeCompare(right.startAt))
}
