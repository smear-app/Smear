import type { Climb } from "./climbs"
import {
  HOLD_TAGS,
  MOVEMENT_TAGS,
  WALL_TAGS,
  getLogbookFilterKeyForTag,
  normalizeClimbTag,
} from "./climbTags"

export const LOGBOOK_PAGE_SIZE = 25
export const RECENT_CLIMBS_LIMIT = 5
export const SESSION_THRESHOLD_MS = 3 * 60 * 60 * 1000

export const LOGBOOK_SORT_OPTIONS = ["newest", "oldest", "hardest", "easiest"] as const
export const LOGBOOK_VIEW_OPTIONS = ["list", "calendar"] as const

export type LogbookSort = (typeof LOGBOOK_SORT_OPTIONS)[number]
export type LogbookView = (typeof LOGBOOK_VIEW_OPTIONS)[number]

export interface LogbookFilters {
  gymId: string
  sendTypes: string[]
  wallTypes: string[]
  holdTypes: string[]
  movementTypes: string[]
  grades: string[]
}

export interface LogbookSession {
  id: string
  gymId: string | null
  gymName: string | null
  startedAt: string
  endedAt: string
  climbs: Climb[]
}

const WALL_TAG_SET = new Set(WALL_TAGS)
const HOLD_TAG_SET = new Set(HOLD_TAGS)
const MOVEMENT_TAG_SET = new Set(MOVEMENT_TAGS)

export const DEFAULT_LOGBOOK_FILTERS: LogbookFilters = {
  gymId: "all",
  sendTypes: [],
  wallTypes: [],
  holdTypes: [],
  movementTypes: [],
  grades: [],
}

export function isChronologicalSort(sort: LogbookSort): boolean {
  return sort === "newest" || sort === "oldest"
}

export function formatTagLabel(value: string): string {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join(" ")
}

export function normalizeTag(value: string): string {
  return normalizeClimbTag(value)
}

export function toLocalDateKey(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function getTagCategory(value: string): "wall" | "hold" | "movement" | null {
  const filterKey = getLogbookFilterKeyForTag(value)

  if (filterKey === "wallTypes") {
    return "wall"
  }

  if (filterKey === "holdTypes") {
    return "hold"
  }

  if (filterKey === "movementTypes") {
    return "movement"
  }

  return null
}

export function getClimbAttributes(climb: Climb) {
  const normalizedTags = climb.tags.map(normalizeTag)

  return {
    wallType: normalizedTags.find((tag) => WALL_TAG_SET.has(tag as (typeof WALL_TAGS)[number])) ?? null,
    holdType: normalizedTags.find((tag) => HOLD_TAG_SET.has(tag as (typeof HOLD_TAGS)[number])) ?? null,
    movementType:
      normalizedTags.find((tag) => MOVEMENT_TAG_SET.has(tag as (typeof MOVEMENT_TAGS)[number])) ?? null,
  }
}

export function getPrimaryLogbookAttribute(climb: Climb): string | null {
  const attributes = getClimbAttributes(climb)
  return attributes.wallType ?? attributes.movementType ?? attributes.holdType
}

export function doesClimbMatchFilters(climb: Climb, filters: LogbookFilters): boolean {
  const normalizedTags = climb.tags.map(normalizeTag)

  if (filters.gymId !== "all" && climb.gym_id !== filters.gymId) {
    return false
  }

  if (filters.sendTypes.length > 0 && !filters.sendTypes.includes(climb.send_type)) {
    return false
  }

  if (filters.wallTypes.length > 0 && !filters.wallTypes.some((tag) => normalizedTags.includes(normalizeTag(tag)))) {
    return false
  }

  if (filters.holdTypes.length > 0 && !filters.holdTypes.some((tag) => normalizedTags.includes(normalizeTag(tag)))) {
    return false
  }

  if (
    filters.movementTypes.length > 0 &&
    !filters.movementTypes.some((tag) => normalizedTags.includes(normalizeTag(tag)))
  ) {
    return false
  }

  if (filters.grades.length > 0 && !filters.grades.includes(climb.gym_grade)) {
    return false
  }

  return true
}

export function sortClimbs(climbs: Climb[], sort: LogbookSort): Climb[] {
  const direction = sort === "oldest" || sort === "easiest" ? 1 : -1

  return [...climbs].sort((left, right) => {
    if (sort === "newest" || sort === "oldest") {
      return direction * (new Date(left.created_at).getTime() - new Date(right.created_at).getTime())
    }

    const gradeDelta = (left.gym_grade_value ?? 0) - (right.gym_grade_value ?? 0)
    if (gradeDelta !== 0) {
      return direction * gradeDelta
    }

    return new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
  })
}

export function buildImplicitSessions(climbs: Climb[]): LogbookSession[] {
  return climbs.reduce<LogbookSession[]>((sessions, climb) => {
    const previousSession = sessions.at(-1)
    if (!previousSession) {
      sessions.push({
        id: `${climb.gym_id ?? "unknown"}:${climb.id}`,
        gymId: climb.gym_id,
        gymName: climb.gym_name,
        startedAt: climb.created_at,
        endedAt: climb.created_at,
        climbs: [climb],
      })
      return sessions
    }

    const lastClimb = previousSession.climbs.at(-1)
    const withinSameGym = previousSession.gymId === climb.gym_id
    const withinThreshold =
      lastClimb !== undefined &&
      Math.abs(new Date(climb.created_at).getTime() - new Date(lastClimb.created_at).getTime()) <=
        SESSION_THRESHOLD_MS

    if (withinSameGym && withinThreshold) {
      previousSession.climbs.push(climb)
      previousSession.startedAt = previousSession.climbs[0].created_at
      previousSession.endedAt = climb.created_at
      return sessions
    }

    sessions.push({
      id: `${climb.gym_id ?? "unknown"}:${climb.id}`,
      gymId: climb.gym_id,
      gymName: climb.gym_name,
      startedAt: climb.created_at,
      endedAt: climb.created_at,
      climbs: [climb],
    })
    return sessions
  }, [])
}

export function getVisibleSessions(climbs: Climb[], filters: LogbookFilters): LogbookSession[] {
  return buildImplicitSessions(climbs)
    .map((session) => ({
      ...session,
      climbs: session.climbs.filter((climb) => doesClimbMatchFilters(climb, filters)),
    }))
    .filter((session) => session.climbs.length > 0)
}

export function getVisibleClimbs(climbs: Climb[], filters: LogbookFilters, sort: LogbookSort): Climb[] {
  return sortClimbs(
    climbs.filter((climb) => doesClimbMatchFilters(climb, filters)),
    sort,
  )
}

export function getClimbsForDateKey(climbs: Climb[], dateKey: string | null): Climb[] {
  if (!dateKey) {
    return []
  }

  return climbs.filter((climb) => toLocalDateKey(climb.created_at) === dateKey)
}

export function getAttributeFilterSections() {
  return [
    {
      key: "wallTypes" as const,
      title: "Wall Type",
      options: WALL_TAGS.map((value) => ({ value, label: formatTagLabel(value) })),
    },
    {
      key: "holdTypes" as const,
      title: "Hold Type",
      options: HOLD_TAGS.map((value) => ({ value, label: formatTagLabel(value) })),
    },
    {
      key: "movementTypes" as const,
      title: "Movement",
      options: MOVEMENT_TAGS.map((value) => ({ value, label: formatTagLabel(value) })),
    },
  ]
}

export function getSortLabel(sort: LogbookSort): string {
  switch (sort) {
    case "newest":
      return "Newest"
    case "oldest":
      return "Oldest"
    case "hardest":
      return "Hardest first"
    case "easiest":
      return "Easiest first"
  }
}
