import type { ClimbObject } from "../../../../lib/api"
import type { Climb } from "../../../../lib/climbs"
import type { EnrichedClimb } from "../primitives"
import type { StatsBaseData } from "./fetchStatsBase"
import { normalizeGrade } from "./normalizeGrade"
import { normalizeOutcome } from "./normalizeOutcome"
import { normalizeTags } from "./normalizeTags"

type NormalizableClimb = ClimbObject | Climb

function getRawClimbColor(climb: NormalizableClimb): string | null {
  return "hold_color" in climb ? climb.hold_color : climb.climbColor
}

function getGymName(climb: NormalizableClimb, gymsById: ReadonlyMap<string, string>): string | null {
  if (climb.gym_name) {
    return climb.gym_name
  }

  return climb.gym_id ? (gymsById.get(climb.gym_id) ?? null) : null
}

export function normalizeClimb(climb: NormalizableClimb, gymsById: ReadonlyMap<string, string> = new Map()): EnrichedClimb {
  const grade = normalizeGrade(climb.gym_grade, climb.gym_grade_value)
  const outcome = normalizeOutcome(climb.send_type)

  return {
    id: climb.id,
    userId: climb.user_id,
    gymId: climb.gym_id,
    gymName: getGymName(climb, gymsById),
    canonicalClimbId: climb.canonical_climb_id,
    loggedAt: climb.created_at,
    completedAt: outcome.isCompleted ? climb.created_at : null,
    gradeLabel: grade.gradeLabel,
    gradeIndex: grade.gradeIndex,
    color: getRawClimbColor(climb),
    outcome: outcome.outcome,
    isSend: outcome.isSend,
    isFlash: outcome.isFlash,
    isAttempt: outcome.isAttempt,
    isCompleted: outcome.isCompleted,
    tags: normalizeTags(climb.tags),
    notes: climb.notes,
  }
}

export function normalizeClimbs(
  climbs: readonly NormalizableClimb[],
  gymsById: ReadonlyMap<string, string> = new Map(),
): EnrichedClimb[] {
  return climbs.map((climb) => normalizeClimb(climb, gymsById))
}

export function prepareEnrichedClimbs(statsBase: StatsBaseData): EnrichedClimb[] {
  const gymsById = new Map(statsBase.gyms?.map((gym) => [gym.id, gym.name]) ?? [])
  return normalizeClimbs(statsBase.climbs, gymsById)
}

export function toEnrichedClimb(climb: Climb): EnrichedClimb {
  return normalizeClimb(climb)
}

export function toEnrichedClimbs(climbs: readonly Climb[]): EnrichedClimb[] {
  return normalizeClimbs(climbs)
}
