import type { Climb } from "../../../../lib/climbs"
import { buildImplicitSessions as buildLogbookSessions } from "../../../../lib/logbook"

export function buildSessionClimbsByStatsSessionId(climbs: readonly Climb[]): Map<string, Climb[]> {
  const sessionClimbsById = new Map<string, Climb[]>()
  const implicitClimbs: Climb[] = []

  for (const climb of climbs) {
    if (climb.session_id) {
      sessionClimbsById.set(climb.session_id, [...(sessionClimbsById.get(climb.session_id) ?? []), climb])
    } else {
      implicitClimbs.push(climb)
    }
  }

  for (const session of buildLogbookSessions(implicitClimbs)) {
    sessionClimbsById.set(session.id, session.climbs)
  }

  return sessionClimbsById
}
