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
  const sessionMetrics = buildImplicitSessions(climbs, options.thresholdMs).map(calculateSingleSessionMetrics)
  const allTimeBaseline = calculateAllTimeBaseline(sessionMetrics)

  return {
    allTimeBaseline,
    sessions: sessionMetrics.map((session) => ({
      session,
      comparisonToAllTimeBaseline: compareSessionToBaseline(session, allTimeBaseline),
    })),
  }
}
