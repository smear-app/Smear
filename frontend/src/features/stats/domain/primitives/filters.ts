import type { EnrichedClimb } from "./types"

export function filterCompletedClimbs<TClimb extends EnrichedClimb>(climbs: readonly TClimb[]): TClimb[] {
  return climbs.filter((climb) => climb.isCompleted)
}

export function filterSentClimbs<TClimb extends EnrichedClimb>(climbs: readonly TClimb[]): TClimb[] {
  return climbs.filter((climb) => climb.isSend || climb.isFlash)
}

export function filterFlashClimbs<TClimb extends EnrichedClimb>(climbs: readonly TClimb[]): TClimb[] {
  return climbs.filter((climb) => climb.isFlash)
}

export function filterAttemptClimbs<TClimb extends EnrichedClimb>(climbs: readonly TClimb[]): TClimb[] {
  return climbs.filter((climb) => climb.isAttempt)
}
