import type { SessionMetrics } from "../calculators/sessions"
import { average } from "../calculators/shared"

export type SessionInsightLabel =
  | "Building baseline"
  | "Performance session"
  | "Volume session"
  | "Projecting session"
  | "Efficiency session"
  | "Exploration session"
  | "Consistent session"

export type SessionInsightDisplayLabel = SessionInsightLabel | "Not enough activity"

export type SessionInsightResult = {
  label: SessionInsightDisplayLabel
  reason: string
}

export const SESSION_INSIGHT_CLASSIFIER_VERSION = "session-insight-v1"
export const INVALID_SESSION_INSIGHT: SessionInsightResult = {
  label: "Not enough activity",
  reason: "More climbs needed for insight",
}

const VALID_SESSION_MIN_CLIMBS = 3
const BASELINE_LOOKBACK_DAYS = 90
const BASELINE_MIN_SESSIONS = 5
const BASELINE_TARGET_SESSIONS = 10
const PERFORMANCE_WORKING_GRADE_THRESHOLD = 0.65
const PERFORMANCE_NEW_MAX_BONUS_THRESHOLD = 0.5
const PERFORMANCE_NEW_MAX_BONUS = 0.25
const VOLUME_RATIO_THRESHOLD = 0.2
const PROJECTING_ATTEMPTS_PER_SEND_THRESHOLD = 0.55
const EFFICIENCY_COMPLETION_RATE_THRESHOLD = 0.15
const EXPLORATION_STYLE_DELTA_THRESHOLD = 3
const EXPLORATION_STYLE_FLOOR = 5

type BaselineMetrics = {
  averageTotalClimbs: number
  averageWorkingGrade: number | null
  highestGrade: number | null
  averageAttemptsPerSend: number
  averageCompletionRate: number
  averageDistinctStyleCount: number
}

type Candidate = {
  label: Exclude<SessionInsightLabel, "Building baseline" | "Consistent session">
  reason: string
  score: number
}

function getTimestamp(value: string): number {
  const timestamp = new Date(value).getTime()
  return Number.isFinite(timestamp) ? timestamp : Number.NEGATIVE_INFINITY
}

function formatSignedDecimal(value: number, suffix: string): string {
  const sign = value >= 0 ? "+" : ""
  return `${sign}${value.toFixed(1)} ${suffix}`
}

function formatSignedPercent(value: number, suffix: string): string {
  const sign = value >= 0 ? "+" : ""
  return `${sign}${Math.round(value * 100)}% ${suffix}`
}

function formatSignedInteger(value: number, suffix: string): string {
  const sign = value >= 0 ? "+" : ""
  return `${sign}${Math.round(value)} ${suffix}`
}

export function isValidInsightSession(session: SessionMetrics): boolean {
  return session.totalClimbs >= VALID_SESSION_MIN_CLIMBS
}

export function selectSessionInsightBaseline(
  session: SessionMetrics,
  sessions: readonly SessionMetrics[],
): SessionMetrics[] {
  const sessionStart = getTimestamp(session.startAt)
  const lookbackStart = sessionStart - BASELINE_LOOKBACK_DAYS * 24 * 60 * 60 * 1000

  return sessions
    .filter((candidate) => {
      const candidateStart = getTimestamp(candidate.startAt)
      return candidate.sessionId !== session.sessionId
        && isValidInsightSession(candidate)
        && candidateStart < sessionStart
        && candidateStart >= lookbackStart
    })
    .sort((left, right) => getTimestamp(right.startAt) - getTimestamp(left.startAt))
    .slice(0, BASELINE_TARGET_SESSIONS)
}

export function aggregateSessionInsightBaseline(sessions: readonly SessionMetrics[]): BaselineMetrics | null {
  if (sessions.length < BASELINE_MIN_SESSIONS) {
    return null
  }

  const workingGrades = sessions.flatMap((session) =>
    session.workingGrade === null || !Number.isFinite(session.workingGrade) ? [] : [session.workingGrade],
  )
  const highestGrades = sessions.flatMap((session) =>
    session.highestGrade === null || !Number.isFinite(session.highestGrade) ? [] : [session.highestGrade],
  )

  return {
    averageTotalClimbs: average(sessions.map((session) => session.totalClimbs)) ?? 0,
    averageWorkingGrade: average(workingGrades),
    highestGrade: highestGrades.length === 0 ? null : Math.max(...highestGrades),
    averageAttemptsPerSend: average(sessions.map((session) => session.attemptsPerSend)) ?? 0,
    averageCompletionRate: average(sessions.map((session) => session.completionRate)) ?? 0,
    averageDistinctStyleCount: average(sessions.map((session) => session.distinctStyleCount)) ?? 0,
  }
}

function getPerformanceCandidate(session: SessionMetrics, baseline: BaselineMetrics): Candidate | null {
  if (session.workingGrade === null || baseline.averageWorkingGrade === null) {
    return null
  }

  const workingGradeDelta = session.workingGrade - baseline.averageWorkingGrade
  const newMaxBonus =
    session.highestGrade !== null && baseline.highestGrade !== null && session.highestGrade - baseline.highestGrade >= PERFORMANCE_NEW_MAX_BONUS_THRESHOLD
      ? PERFORMANCE_NEW_MAX_BONUS
      : 0
  const score = workingGradeDelta + newMaxBonus

  if (score < PERFORMANCE_WORKING_GRADE_THRESHOLD) {
    return null
  }

  return {
    label: "Performance session",
    reason: formatSignedDecimal(workingGradeDelta, "V working grade"),
    score: score / PERFORMANCE_WORKING_GRADE_THRESHOLD,
  }
}

function getVolumeCandidate(session: SessionMetrics, baseline: BaselineMetrics): Candidate | null {
  if (baseline.averageTotalClimbs <= 0) {
    return null
  }

  const climbRatioDelta = session.totalClimbs / baseline.averageTotalClimbs - 1

  if (climbRatioDelta < VOLUME_RATIO_THRESHOLD) {
    return null
  }

  return {
    label: "Volume session",
    reason: formatSignedPercent(climbRatioDelta, "climbs"),
    score: climbRatioDelta / VOLUME_RATIO_THRESHOLD,
  }
}

function getProjectingCandidate(session: SessionMetrics, baseline: BaselineMetrics): Candidate | null {
  const attemptsPerSendDelta = session.attemptsPerSend - baseline.averageAttemptsPerSend

  if (attemptsPerSendDelta < PROJECTING_ATTEMPTS_PER_SEND_THRESHOLD) {
    return null
  }

  return {
    label: "Projecting session",
    reason: formatSignedDecimal(attemptsPerSendDelta, "attempts/send"),
    score: attemptsPerSendDelta / PROJECTING_ATTEMPTS_PER_SEND_THRESHOLD,
  }
}

function getEfficiencyCandidate(session: SessionMetrics, baseline: BaselineMetrics): Candidate | null {
  const completionRateDelta = session.completionRate - baseline.averageCompletionRate

  if (completionRateDelta < EFFICIENCY_COMPLETION_RATE_THRESHOLD) {
    return null
  }

  return {
    label: "Efficiency session",
    reason: formatSignedPercent(completionRateDelta, "completion rate"),
    score: completionRateDelta / EFFICIENCY_COMPLETION_RATE_THRESHOLD,
  }
}

function getExplorationCandidate(session: SessionMetrics, baseline: BaselineMetrics): Candidate | null {
  const styleDelta = session.distinctStyleCount - baseline.averageDistinctStyleCount

  if (session.distinctStyleCount < EXPLORATION_STYLE_FLOOR || styleDelta < EXPLORATION_STYLE_DELTA_THRESHOLD) {
    return null
  }

  return {
    label: "Exploration session",
    reason: formatSignedInteger(styleDelta, "styles"),
    score: styleDelta / EXPLORATION_STYLE_DELTA_THRESHOLD,
  }
}

function getConsistentReason(session: SessionMetrics, baseline: BaselineMetrics): string {
  if (baseline.averageTotalClimbs <= 0) {
    return "Near baseline"
  }

  const climbRatioDelta = session.totalClimbs / baseline.averageTotalClimbs - 1

  if (Math.abs(climbRatioDelta) < 0.1) {
    return "Near baseline"
  }

  return formatSignedPercent(climbRatioDelta, "climbs")
}

export function classifySessionInsight(session: SessionMetrics, baselineSessions: readonly SessionMetrics[]): SessionInsightResult {
  if (!isValidInsightSession(session)) {
    return INVALID_SESSION_INSIGHT
  }

  const baseline = aggregateSessionInsightBaseline(baselineSessions)

  if (!baseline) {
    return { label: "Building baseline", reason: "More sessions needed" }
  }

  const candidates = [
    getPerformanceCandidate(session, baseline),
    getVolumeCandidate(session, baseline),
    getProjectingCandidate(session, baseline),
    getEfficiencyCandidate(session, baseline),
    getExplorationCandidate(session, baseline),
  ].flatMap((candidate) => (candidate ? [candidate] : []))

  const bestCandidate = candidates.sort((left, right) => right.score - left.score)[0]

  return bestCandidate ?? { label: "Consistent session", reason: getConsistentReason(session, baseline) }
}

export const SESSION_INSIGHT_THRESHOLDS = {
  validSessionMinClimbs: VALID_SESSION_MIN_CLIMBS,
  baselineLookbackDays: BASELINE_LOOKBACK_DAYS,
  baselineMinSessions: BASELINE_MIN_SESSIONS,
  baselineTargetSessions: BASELINE_TARGET_SESSIONS,
  performanceWorkingGradeThreshold: PERFORMANCE_WORKING_GRADE_THRESHOLD,
  performanceNewMaxBonusThreshold: PERFORMANCE_NEW_MAX_BONUS_THRESHOLD,
  performanceNewMaxBonus: PERFORMANCE_NEW_MAX_BONUS,
  volumeRatioThreshold: VOLUME_RATIO_THRESHOLD,
  projectingAttemptsPerSendThreshold: PROJECTING_ATTEMPTS_PER_SEND_THRESHOLD,
  efficiencyCompletionRateThreshold: EFFICIENCY_COMPLETION_RATE_THRESHOLD,
  explorationStyleDeltaThreshold: EXPLORATION_STYLE_DELTA_THRESHOLD,
  explorationStyleFloor: EXPLORATION_STYLE_FLOOR,
}
