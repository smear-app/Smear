import type { Climb } from "./climbs"
import {
  buildImplicitSessions as buildStatsImplicitSessions,
  DEFAULT_IMPLICIT_SESSION_THRESHOLD_MS,
} from "../features/stats/domain/primitives"
import { toEnrichedClimbs } from "../features/stats/domain/base/normalizeClimbs"
import {
  HOLD_TAGS,
  MOVEMENT_TAGS,
  WALL_TAGS,
  getLogbookFilterKeyForTag,
  getLogbookTagFilterSections,
  normalizeClimbTag,
} from "./climbTags"

export const LOGBOOK_PAGE_SIZE = 25
export const RECENT_CLIMBS_LIMIT = 5
export const SESSION_THRESHOLD_MS = DEFAULT_IMPLICIT_SESSION_THRESHOLD_MS

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
  mechanicTypes: string[]
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
  mechanicTypes: [],
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

export function getTagCategory(value: string): "wall" | "hold" | "movement" | "mechanic" | null {
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

  if (filterKey === "mechanicTypes") {
    return "mechanic"
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

  if (
    filters.mechanicTypes.length > 0 &&
    !filters.mechanicTypes.some((tag) => normalizedTags.includes(normalizeTag(tag)))
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
  const climbsById = new Map(climbs.map((climb) => [climb.id, climb]))
  const inputOrderByClimbId = new Map(climbs.map((climb, index) => [climb.id, index]))
  const sessions = buildStatsImplicitSessions(toEnrichedClimbs(climbs), SESSION_THRESHOLD_MS).map<LogbookSession>(
    (session) => {
      const sessionClimbs = session.climbIds
        .flatMap((climbId) => {
          const climb = climbsById.get(climbId)
          return climb ? [climb] : []
        })
        .sort((left, right) => (inputOrderByClimbId.get(left.id) ?? 0) - (inputOrderByClimbId.get(right.id) ?? 0))

      return {
        id: `${session.gymId ?? "unknown"}:${sessionClimbs[0]?.id ?? session.climbIds[0]}`,
        gymId: session.gymId,
        gymName: session.gymName,
        startedAt: sessionClimbs[0]?.created_at ?? session.startAt,
        endedAt: sessionClimbs.at(-1)?.created_at ?? session.endAt,
        climbs: sessionClimbs,
      }
    },
  )

  return sessions.sort((left, right) => {
    const leftOrder = inputOrderByClimbId.get(left.climbs[0]?.id ?? "") ?? 0
    const rightOrder = inputOrderByClimbId.get(right.climbs[0]?.id ?? "") ?? 0
    return leftOrder - rightOrder
  })
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
  return getLogbookTagFilterSections()
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
