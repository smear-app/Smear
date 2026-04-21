export type ClimbOutcome = "flash" | "send" | "attempt"

export type TagCategory = "holdType" | "movement" | "terrain" | "mechanics"

export type EnrichedTag = {
  id: string
  name: string
  category: TagCategory | null
}

export type EnrichedClimb = {
  id: string
  userId: string
  gymId: string | null
  gymName: string | null
  canonicalClimbId: string | null
  loggedAt: string
  completedAt: string | null
  gradeLabel: string | null
  gradeIndex: number | null
  color: string | null
  outcome: ClimbOutcome
  isSend: boolean
  isFlash: boolean
  isAttempt: boolean
  isCompleted: boolean
  tags: EnrichedTag[]
  notes: string | null
}

export type EnrichedSession<TClimb extends EnrichedClimb = EnrichedClimb> = {
  id: string
  gymId: string | null
  gymName: string | null
  startAt: string
  endAt: string
  climbIds: string[]
  climbs: TClimb[]
}
