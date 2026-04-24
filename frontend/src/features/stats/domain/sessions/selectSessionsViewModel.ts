import type { SessionMetrics, SessionsMetrics } from "../calculators/sessions"
import { average } from "../calculators/shared"
import {
  classifySessionInsight,
  INVALID_SESSION_INSIGHT,
  isValidInsightSession,
  selectSessionInsightBaseline,
  type SessionInsightLabel,
  type SessionInsightResult,
} from "./sessionInsightClassifier"
import { formatVGrade } from "../primitives"
import type {
  SessionDetail,
  SessionGradeDistributionItem,
  SessionOutcomeItem,
  SessionSummaryStat,
  SessionTrendMetric,
  SessionTrendPoint,
  SessionsViewModel,
} from "./types"

const MAX_TREND_SESSIONS = 5
const SESSION_INSIGHT_LABELS = new Set<SessionInsightLabel>([
  "Building baseline",
  "Performance session",
  "Volume session",
  "Projecting session",
  "Efficiency session",
  "Exploration session",
  "Consistent session",
])

function formatDate(value: string): string {
  const date = new Date(value)

  if (!Number.isFinite(date.getTime())) {
    return "-"
  }

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

function formatTickDate(value: string): string {
  const date = new Date(value)

  if (!Number.isFinite(date.getTime())) {
    return ""
  }

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

function formatGymName(value: string | null): string {
  return value?.trim() || "Unknown gym"
}

function formatDuration(durationMs: number | null): string {
  if (durationMs === null || !Number.isFinite(durationMs) || durationMs <= 0) {
    return "-"
  }

  const totalMinutes = Math.max(1, Math.round(durationMs / (60 * 1000)))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours === 0) {
    return `${minutes}m`
  }

  if (minutes === 0) {
    return `${hours}h`
  }

  return `${hours}h ${minutes}m`
}

function formatGrade(grade: number | null): string {
  return formatVGrade(grade, "None")
}

function formatAverage(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return "-"
  }

  return value.toFixed(1)
}

function formatPercent(value: number): string {
  return `${Math.round(value)}%`
}

function safePercentage(count: number, total: number): number {
  return total <= 0 ? 0 : (count / total) * 100
}

function toPersistedIdentity(session: SessionMetrics): SessionInsightResult | null {
  const persistedInsight = session.persistedInsight

  if (!persistedInsight || !SESSION_INSIGHT_LABELS.has(persistedInsight.label as SessionInsightLabel)) {
    return null
  }

  return {
    label: persistedInsight.label as SessionInsightLabel,
    reason: persistedInsight.reason,
  }
}

function toDisplayIdentity(identity: SessionInsightResult) {
  if (identity.label === INVALID_SESSION_INSIGHT.label) {
    return {
      ...identity,
      displayMode: "system" as const,
      message: "Not enough climbs",
    }
  }

  return {
    ...identity,
    displayMode: "insight" as const,
  }
}

function selectSessionIdentity(session: SessionMetrics, sessions: readonly SessionMetrics[]): SessionInsightResult {
  if (!isValidInsightSession(session)) {
    return INVALID_SESSION_INSIGHT
  }

  const persistedIdentity = toPersistedIdentity(session)

  if (persistedIdentity) {
    return persistedIdentity
  }

  return classifySessionInsight(session, selectSessionInsightBaseline(session, sessions))
}

function toSummaryStats(session: SessionMetrics): SessionSummaryStat[] {
  return [
    { label: "Total Climbs", value: String(session.totalClimbs) },
    { label: "Duration", value: formatDuration(session.durationMs) },
    { label: "Max Grade", value: formatGrade(session.highestGrade) },
    { label: "Working Grade", value: formatGrade(session.workingGrade) },
  ]
}

function toGradeDistribution(session: SessionMetrics): SessionGradeDistributionItem[] {
  const maxCount = Math.max(0, ...session.gradeHistogram.map((bucket) => bucket.count))

  return [...session.gradeHistogram]
    .sort((left, right) => right.gradeIndex - left.gradeIndex)
    .map((bucket) => {
      const outcomeCounts = bucket.outcomeCounts ?? { flash: 0, send: 0, attempt: bucket.count }

      return {
        label: formatGrade(bucket.gradeIndex),
        count: bucket.count,
        widthPercent: maxCount === 0 ? 0 : (bucket.count / maxCount) * 100,
        segments: ([
          { tone: "flash", count: outcomeCounts.flash },
          { tone: "send", count: outcomeCounts.send },
          { tone: "unfinished", count: outcomeCounts.attempt },
        ] satisfies Array<Pick<SessionGradeDistributionItem["segments"][number], "tone" | "count">>).map((segment) => ({
          ...segment,
          percentage: safePercentage(segment.count, bucket.count),
        })),
      }
    })
}

function toOutcomeItems(session: SessionMetrics): SessionOutcomeItem[] {
  const totalClimbs = session.totalClimbs
  const outcomes = [
    { label: "Flash", count: session.outcomeCounts.flash, tone: "flash" },
    { label: "Send", count: session.outcomeCounts.send, tone: "send" },
    { label: "Unfinished", count: session.outcomeCounts.attempt, tone: "unfinished" },
  ] satisfies Array<Omit<SessionOutcomeItem, "percentage" | "percentageLabel">>

  return outcomes.map((outcome) => {
    const percentage = safePercentage(outcome.count, totalClimbs)

    return {
      ...outcome,
      percentage,
      percentageLabel: formatPercent(percentage),
    }
  })
}

function toSessionDetail(
  sessionWithComparison: SessionsMetrics["sessions"][number],
  index: number,
  identity: SessionInsightResult,
): SessionDetail {
  const session = sessionWithComparison.session

  return {
    id: session.sessionId,
    selectorLabel: `${formatDate(session.startAt)} · ${formatGymName(session.gymName)}`,
    selectorMeta: index === 0 ? "Latest session" : "Previous session",
    identity: toDisplayIdentity(identity),
    summary: toSummaryStats(session),
    outcomes: toOutcomeItems(session),
    outcomeTotalCount: session.totalClimbs,
    gradeDistribution: toGradeDistribution(session),
    insight: identity.label === INVALID_SESSION_INSIGHT.label ? "Not enough climbs" : `${identity.label} · ${identity.reason}`,
  }
}

function toTrendPoint(sessionWithComparison: SessionsMetrics["sessions"][number]): SessionTrendPoint {
  const session = sessionWithComparison.session

  return {
    sessionId: session.sessionId,
    label: formatDate(session.startAt),
    tickLabel: formatTickDate(session.startAt),
    climbs: session.totalClimbs,
    avgGrade: session.workingGrade,
  }
}

function toTrendMetrics(trendSessions: readonly SessionsMetrics["sessions"][number][]): SessionTrendMetric[] {
  const sessions = trendSessions.map((entry) => entry.session)
  const averageClimbs = average(sessions.map((session) => session.totalClimbs))
  const validWorkingGrades = sessions.flatMap((session) =>
    session.workingGrade === null || !Number.isFinite(session.workingGrade) ? [] : [session.workingGrade],
  )
  const averageWorkingGrade = average(validWorkingGrades)
  const bestSessionVolume = sessions.length === 0 ? null : Math.max(...sessions.map((session) => session.totalClimbs))
  const bestSessionGrade = validWorkingGrades.length === 0 ? null : Math.max(...validWorkingGrades)

  return [
    {
      label: "Avg Climbs / Session",
      value: formatAverage(averageClimbs),
      description: "",
    },
    {
      label: "Working Grade",
      value: formatGrade(averageWorkingGrade),
      description: "",
    },
    {
      label: "Best Session Volume",
      value: bestSessionVolume === null ? "-" : `${bestSessionVolume} climbs`,
      description: "",
    },
    {
      label: "Best Session Grade",
      value: formatGrade(bestSessionGrade),
      description: "",
    },
  ]
}

export function selectSessionsViewModel(metrics: SessionsMetrics): SessionsViewModel {
  const sessionsChronological = [...metrics.sessions].sort(
    (left, right) => new Date(left.session.startAt).getTime() - new Date(right.session.startAt).getTime(),
  )
  const sessionMetricsChronological = sessionsChronological.map((entry) => entry.session)
  const identitiesBySessionId = new Map(
    sessionsChronological.map((entry) => {
      return [entry.session.sessionId, selectSessionIdentity(entry.session, sessionMetricsChronological)] as const
    }),
  )
  const sessionsNewestFirst = [...sessionsChronological]
    .sort((left, right) => new Date(right.session.startAt).getTime() - new Date(left.session.startAt).getTime())
  const trendSessions = sessionsNewestFirst.slice(0, MAX_TREND_SESSIONS).reverse()

  return {
    trendPoints: trendSessions.map(toTrendPoint),
    trendMetrics: toTrendMetrics(trendSessions),
    sessions: sessionsNewestFirst.map((entry, index) =>
      toSessionDetail(entry, index, identitiesBySessionId.get(entry.session.sessionId) ?? { label: "Building baseline", reason: "More sessions needed" }),
    ),
  }
}
