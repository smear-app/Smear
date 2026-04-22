import type { EnrichedClimb, EnrichedSession } from "./types"

export const DEFAULT_IMPLICIT_SESSION_THRESHOLD_MS = 3 * 60 * 60 * 1000

function getTimestamp(value: string): number {
  const timestamp = new Date(value).getTime()
  return Number.isFinite(timestamp) ? timestamp : Number.POSITIVE_INFINITY
}

function sortClimbsChronologically<TClimb extends EnrichedClimb>(climbs: readonly TClimb[]): TClimb[] {
  return [...climbs].sort((left, right) => {
    const timeDelta = getTimestamp(left.loggedAt) - getTimestamp(right.loggedAt)
    return timeDelta || left.id.localeCompare(right.id)
  })
}

function createSession<TClimb extends EnrichedClimb>(climb: TClimb): EnrichedSession<TClimb> {
  return {
    id: `${climb.gymId ?? "unknown"}:${climb.id}`,
    gymId: climb.gymId,
    gymName: climb.gymName,
    startAt: climb.loggedAt,
    endAt: climb.loggedAt,
    climbIds: [climb.id],
    climbs: [climb],
  }
}

function appendClimbToSession<TClimb extends EnrichedClimb>(session: EnrichedSession<TClimb>, climb: TClimb): void {
  session.climbIds.push(climb.id)
  session.climbs.push(climb)
  session.startAt = session.climbs[0].loggedAt
  session.endAt = climb.loggedAt
}

export function buildImplicitSessions<TClimb extends EnrichedClimb>(
  climbs: readonly TClimb[],
  thresholdMs = DEFAULT_IMPLICIT_SESSION_THRESHOLD_MS,
): EnrichedSession<TClimb>[] {
  const sortedClimbs = sortClimbsChronologically(climbs)
  const safeThresholdMs = Number.isFinite(thresholdMs) && thresholdMs >= 0 ? thresholdMs : DEFAULT_IMPLICIT_SESSION_THRESHOLD_MS

  return sortedClimbs.reduce<Array<EnrichedSession<TClimb>>>((sessions, climb) => {
    const previousSession = sessions.at(-1)

    if (!previousSession) {
      sessions.push(createSession(climb))
      return sessions
    }

    const lastClimb = previousSession.climbs.at(-1)
    const withinSameGym = previousSession.gymId === climb.gymId
    const withinThreshold =
      lastClimb !== undefined && getTimestamp(climb.loggedAt) - getTimestamp(lastClimb.loggedAt) <= safeThresholdMs

    if (withinSameGym && withinThreshold) {
      appendClimbToSession(previousSession, climb)
      return sessions
    }

    sessions.push(createSession(climb))
    return sessions
  }, [])
}
