import {
  buildGradeHistogram,
  buildImplicitSessions,
  buildOutcomeCounts,
  filterAttemptClimbs,
  filterFlashClimbs,
  filterSentClimbs,
  getAverageGrade,
  getHighestGrade,
  getMedianGrade,
  type EnrichedClimb,
  type EnrichedSession,
  type GradeHistogramBucket,
  type OutcomeCounts,
} from "../primitives"
import {
  averageNonNull,
  calculateDurationMs,
  calculateTopFortyPercentMedianWorkingGrade,
  safeDivide,
  safeRatioDelta,
} from "./shared"

export type SessionMetrics = {
  sessionId: string
  gymId: string | null
  gymName: string | null
  startAt: string
  endAt: string
  durationMs: number | null
  totalClimbs: number
  totalSentClimbs: number
  totalFlashClimbs: number
  totalAttemptClimbs: number
  flashRate: number
  sentRate: number
  highestGrade: number | null
  averageSentGrade: number | null
  medianSentGrade: number | null
  workingGrade: number | null
  gradeHistogram: Array<Pick<GradeHistogramBucket, "gradeIndex" | "count"> & { outcomeCounts: OutcomeCounts }>
  outcomeCounts: OutcomeCounts
  attemptsPerSend: number
  completionRate: number
  distinctStyleCount: number
  persistedInsight: {
    label: string
    reason: string
    classifierVersion: string | null
  } | null
}

export type SessionBaselineMetrics = {
  averageTotalClimbs: number | null
  averageSentClimbs: number | null
  averageFlashRate: number | null
  averageSentRate: number | null
  averageHighestGrade: number | null
  averageSentGrade: number | null
  averageWorkingGrade: number | null
  averageDurationMs: number | null
}

export type SessionComparisonMetrics = {
  totalClimbsDelta: number | null
  totalClimbsDeltaRatio: number | null
  sentClimbsDelta: number | null
  sentClimbsDeltaRatio: number | null
  flashRateDelta: number | null
  flashRateDeltaRatio: number | null
  sentRateDelta: number | null
  sentRateDeltaRatio: number | null
  highestGradeDelta: number | null
  averageSentGradeDelta: number | null
  workingGradeDelta: number | null
  durationMsDelta: number | null
  durationMsDeltaRatio: number | null
}

export type SessionWithComparison = {
  session: SessionMetrics
  comparisonToAllTimeBaseline: SessionComparisonMetrics | null
}

export type SessionsMetrics = {
  allTimeBaseline: SessionBaselineMetrics | null
  sessions: SessionWithComparison[]
}

export type CalculateSessionMetricsOptions = {
  thresholdMs?: number
}

function subtractNullable(value: number | null, baseline: number | null): number | null {
  return value === null || baseline === null ? null : value - baseline
}

function getTimestamp(value: string): number {
  const timestamp = new Date(value).getTime()
  return Number.isFinite(timestamp) ? timestamp : Number.POSITIVE_INFINITY
}

function getSessionStartAt(climbs: readonly EnrichedClimb[]): string {
  const sessionStartedAt = climbs.find((climb) => climb.sessionStartedAt)?.sessionStartedAt

  return sessionStartedAt ?? climbs[0]?.loggedAt ?? ""
}

function getSessionPersistedInsight(climbs: readonly EnrichedClimb[]): SessionMetrics["persistedInsight"] {
  const source = climbs.find((climb) => climb.sessionInsightLabel && climb.sessionInsightReason)

  if (!source?.sessionInsightLabel || !source.sessionInsightReason) {
    return null
  }

  return {
    label: source.sessionInsightLabel,
    reason: source.sessionInsightReason,
    classifierVersion: source.sessionInsightClassifierVersion,
  }
}

function buildExplicitSession(sessionId: string, climbs: readonly EnrichedClimb[]): EnrichedSession {
  const sortedClimbs = [...climbs].sort((left, right) => getTimestamp(left.loggedAt) - getTimestamp(right.loggedAt))

  return {
    id: sessionId,
    gymId: sortedClimbs[0]?.gymId ?? null,
    gymName: sortedClimbs[0]?.gymName ?? null,
    startAt: getSessionStartAt(sortedClimbs),
    endAt: sortedClimbs.at(-1)?.loggedAt ?? getSessionStartAt(sortedClimbs),
    climbIds: sortedClimbs.map((climb) => climb.id),
    climbs: sortedClimbs,
  }
}

function buildSessions(climbs: readonly EnrichedClimb[], thresholdMs?: number): EnrichedSession[] {
  const explicitClimbsBySessionId = new Map<string, EnrichedClimb[]>()
  const implicitClimbs: EnrichedClimb[] = []

  for (const climb of climbs) {
    if (climb.sessionId) {
      explicitClimbsBySessionId.set(climb.sessionId, [...(explicitClimbsBySessionId.get(climb.sessionId) ?? []), climb])
    } else {
      implicitClimbs.push(climb)
    }
  }

  return [
    ...[...explicitClimbsBySessionId.entries()].map(([sessionId, sessionClimbs]) => buildExplicitSession(sessionId, sessionClimbs)),
    ...buildImplicitSessions(implicitClimbs, thresholdMs),
  ].sort((left, right) => getTimestamp(left.startAt) - getTimestamp(right.startAt))
}

function getDistinctStyleCount(climbs: readonly EnrichedClimb[]): number {
  const styleIds = new Set<string>()

  for (const climb of climbs) {
    for (const tag of climb.tags) {
      styleIds.add(tag.id)
    }

    for (const tags of Object.values(climb.canonicalTags)) {
      for (const tag of tags) {
        styleIds.add(tag.id)
      }
    }
  }

  return styleIds.size
}

function calculateSingleSessionMetrics(session: EnrichedSession): SessionMetrics {
  const climbs = session.climbs
  const sentClimbs = filterSentClimbs(climbs)
  const flashClimbs = filterFlashClimbs(climbs)
  const attemptClimbs = filterAttemptClimbs(climbs)

  return {
    sessionId: session.id,
    gymId: session.gymId,
    gymName: session.gymName,
    startAt: session.startAt,
    endAt: session.endAt,
    durationMs: calculateDurationMs(session.startAt, session.endAt),
    totalClimbs: climbs.length,
    totalSentClimbs: sentClimbs.length,
    totalFlashClimbs: flashClimbs.length,
    totalAttemptClimbs: attemptClimbs.length,
    flashRate: safeDivide(flashClimbs.length, sentClimbs.length),
    sentRate: safeDivide(sentClimbs.length, climbs.length),
    highestGrade: getHighestGrade(sentClimbs),
    averageSentGrade: getAverageGrade(sentClimbs),
    medianSentGrade: getMedianGrade(sentClimbs),
    workingGrade: calculateTopFortyPercentMedianWorkingGrade(sentClimbs),
    gradeHistogram: buildGradeHistogram(climbs).map(({ gradeIndex, climbs: bucketClimbs, count }) => ({
      gradeIndex,
      count,
      outcomeCounts: buildOutcomeCounts(bucketClimbs),
    })),
    outcomeCounts: buildOutcomeCounts(climbs),
    attemptsPerSend: safeDivide(climbs.length, sentClimbs.length),
    completionRate: safeDivide(sentClimbs.length, climbs.length),
    distinctStyleCount: getDistinctStyleCount(climbs),
    persistedInsight: getSessionPersistedInsight(climbs),
  }
}

function calculateAllTimeBaseline(sessions: readonly SessionMetrics[]): SessionBaselineMetrics | null {
  if (sessions.length === 0) {
    return null
  }

  return {
    averageTotalClimbs: averageNonNull(sessions.map((session) => session.totalClimbs)),
    averageSentClimbs: averageNonNull(sessions.map((session) => session.totalSentClimbs)),
    averageFlashRate: averageNonNull(sessions.map((session) => session.flashRate)),
    averageSentRate: averageNonNull(sessions.map((session) => session.sentRate)),
    averageHighestGrade: averageNonNull(sessions.map((session) => session.highestGrade)),
    averageSentGrade: averageNonNull(sessions.map((session) => session.averageSentGrade)),
    averageWorkingGrade: averageNonNull(sessions.map((session) => session.workingGrade)),
    averageDurationMs: averageNonNull(sessions.map((session) => session.durationMs)),
  }
}

function compareSessionToBaseline(
  session: SessionMetrics,
  baseline: SessionBaselineMetrics | null,
): SessionComparisonMetrics | null {
  if (!baseline) {
    return null
  }

  const totalClimbsDelta = subtractNullable(session.totalClimbs, baseline.averageTotalClimbs)
  const sentClimbsDelta = subtractNullable(session.totalSentClimbs, baseline.averageSentClimbs)
  const flashRateDelta = subtractNullable(session.flashRate, baseline.averageFlashRate)
  const sentRateDelta = subtractNullable(session.sentRate, baseline.averageSentRate)
  const durationMsDelta = subtractNullable(session.durationMs, baseline.averageDurationMs)

  return {
    totalClimbsDelta,
    totalClimbsDeltaRatio: safeRatioDelta(totalClimbsDelta, baseline.averageTotalClimbs),
    sentClimbsDelta,
    sentClimbsDeltaRatio: safeRatioDelta(sentClimbsDelta, baseline.averageSentClimbs),
    flashRateDelta,
    flashRateDeltaRatio: safeRatioDelta(flashRateDelta, baseline.averageFlashRate),
    sentRateDelta,
    sentRateDeltaRatio: safeRatioDelta(sentRateDelta, baseline.averageSentRate),
    highestGradeDelta: subtractNullable(session.highestGrade, baseline.averageHighestGrade),
    averageSentGradeDelta: subtractNullable(session.averageSentGrade, baseline.averageSentGrade),
    workingGradeDelta: subtractNullable(session.workingGrade, baseline.averageWorkingGrade),
    durationMsDelta,
    durationMsDeltaRatio: safeRatioDelta(durationMsDelta, baseline.averageDurationMs),
  }
}

export function calculateSessionMetrics(
  climbs: readonly EnrichedClimb[],
  options: CalculateSessionMetricsOptions = {},
): SessionsMetrics {
  const sessionMetrics = buildSessions(climbs, options.thresholdMs).map(calculateSingleSessionMetrics)
  const allTimeBaseline = calculateAllTimeBaseline(sessionMetrics)

  return {
    allTimeBaseline,
    sessions: sessionMetrics.map((session) => ({
      session,
      comparisonToAllTimeBaseline: compareSessionToBaseline(session, allTimeBaseline),
    })),
  }
}
