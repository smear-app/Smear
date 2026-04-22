import { buildImplicitSessions, filterSentClimbs, getGradeIndexes, type EnrichedClimb } from "../primitives"
import { calculateSessionMetrics, type SessionsMetrics } from "../calculators/sessions"
import type { StatsPipelineValidationIssue } from "./validateStatsPipeline"

export type SessionMetricsValidationResult = {
  ok: boolean
  summary: {
    inputClimbs: number
    sessionCount: number
    sessionClimbCount: number
    uniqueSessionClimbCount: number
    hasBaseline: boolean
  }
  issues: StatsPipelineValidationIssue[]
  metrics: SessionsMetrics
}

type ValidateSessionMetricsOptions = {
  thresholdMs?: number
}

function getTimestamp(value: string): number {
  const timestamp = new Date(value).getTime()
  return Number.isFinite(timestamp) ? timestamp : Number.POSITIVE_INFINITY
}

function isFiniteOrNull(value: number | null): boolean {
  return value === null || Number.isFinite(value)
}

export function validateSessionMetrics(
  climbs: readonly EnrichedClimb[],
  options: ValidateSessionMetricsOptions = {},
): SessionMetricsValidationResult {
  const metrics = calculateSessionMetrics(climbs, options)
  const primitiveSessions = buildImplicitSessions(climbs, options.thresholdMs)
  const primitiveSessionClimbIds = primitiveSessions.flatMap((session) => session.climbIds)
  const uniquePrimitiveSessionClimbIds = new Set(primitiveSessionClimbIds)
  const issues: StatsPipelineValidationIssue[] = []

  if (primitiveSessionClimbIds.length !== climbs.length) {
    issues.push({
      code: "session-calculator-climb-count-mismatch",
      message: "Implicit sessions do not contain exactly the input climb count.",
      details: { sessionClimbCount: primitiveSessionClimbIds.length, inputClimbs: climbs.length },
    })
  }

  if (uniquePrimitiveSessionClimbIds.size !== primitiveSessionClimbIds.length) {
    issues.push({
      code: "session-calculator-duplicate-climb",
      message: "A climb appears more than once across implicit sessions.",
    })
  }

  if (metrics.sessions.length !== primitiveSessions.length) {
    issues.push({
      code: "session-calculator-session-count-mismatch",
      message: "Calculated session count does not match primitive session count.",
      details: { calculatedSessions: metrics.sessions.length, primitiveSessions: primitiveSessions.length },
    })
  }

  if (metrics.sessions.length === 0 && metrics.allTimeBaseline !== null) {
    issues.push({
      code: "session-calculator-unexpected-baseline",
      message: "Baseline should be null when there are no sessions.",
    })
  }

  if (metrics.sessions.length > 0 && metrics.allTimeBaseline === null) {
    issues.push({
      code: "session-calculator-missing-baseline",
      message: "Baseline should exist when sessions exist.",
    })
  }

  for (let index = 0; index < metrics.sessions.length; index += 1) {
    const sessionWithComparison = metrics.sessions[index]
    const session = sessionWithComparison.session
    const primitiveSession = primitiveSessions[index]

    if (index > 0 && getTimestamp(session.startAt) < getTimestamp(metrics.sessions[index - 1].session.startAt)) {
      issues.push({
        code: "session-calculator-sort-order",
        message: "Calculated sessions are not sorted chronologically.",
      })
    }

    if (session.totalClimbs !== session.totalSentClimbs + session.totalAttemptClimbs) {
      issues.push({
        code: "session-calculator-total-mismatch",
        message: "Session total climbs does not equal sent plus attempts.",
        details: {
          sessionId: session.sessionId,
          totalClimbs: session.totalClimbs,
          totalSentClimbs: session.totalSentClimbs,
          totalAttemptClimbs: session.totalAttemptClimbs,
        },
      })
    }

    if (session.totalFlashClimbs > session.totalSentClimbs) {
      issues.push({
        code: "session-calculator-flash-exceeds-sent",
        message: "Session flash climbs exceed sent climbs.",
        details: { sessionId: session.sessionId },
      })
    }

    if (session.durationMs !== null && session.durationMs < 0) {
      issues.push({
        code: "session-calculator-negative-duration",
        message: "Session duration is negative.",
        details: { sessionId: session.sessionId, durationMs: session.durationMs },
      })
    }

    if (!isFiniteOrNull(session.highestGrade) || !isFiniteOrNull(session.averageSentGrade) || !isFiniteOrNull(session.workingGrade)) {
      issues.push({
        code: "session-calculator-invalid-grade-metric",
        message: "Session has a non-finite grade metric.",
        details: { sessionId: session.sessionId },
      })
    }

    if (primitiveSession) {
      const sentSourceClimbs = filterSentClimbs(primitiveSession.climbs)
      const sentGradeCount = getGradeIndexes(sentSourceClimbs).length

      if (sentGradeCount === 0 && (session.highestGrade !== null || session.averageSentGrade !== null || session.workingGrade !== null)) {
        issues.push({
          code: "session-calculator-attempt-grade-leak",
          message: "Session grade metrics are non-null despite no sent climbs with valid grades.",
          details: { sessionId: session.sessionId },
        })
      }
    }

    if (metrics.allTimeBaseline && sessionWithComparison.comparisonToAllTimeBaseline === null) {
      issues.push({
        code: "session-calculator-missing-comparison",
        message: "Session comparison should exist when all-time baseline exists.",
        details: { sessionId: session.sessionId },
      })
    }
  }

  return {
    ok: issues.length === 0,
    summary: {
      inputClimbs: climbs.length,
      sessionCount: metrics.sessions.length,
      sessionClimbCount: primitiveSessionClimbIds.length,
      uniqueSessionClimbCount: uniquePrimitiveSessionClimbIds.size,
      hasBaseline: metrics.allTimeBaseline !== null,
    },
    issues,
    metrics,
  }
}
