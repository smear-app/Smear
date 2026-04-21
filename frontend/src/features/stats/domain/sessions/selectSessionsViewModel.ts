import type { SessionMetrics, SessionsMetrics } from "../calculators/sessions"
import type {
  SessionDetail,
  SessionGradeDistributionItem,
  SessionOutcomeItem,
  SessionSummaryStat,
  SessionTrendPoint,
  SessionsViewModel,
} from "./types"

const MAX_TREND_SESSIONS = 5

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
  if (grade === null || !Number.isFinite(grade)) {
    return "None"
  }

  if (Number.isInteger(grade)) {
    return `V${grade}`
  }

  return `V${Math.floor(grade)}–V${Math.ceil(grade)}`
}

function formatPercent(value: number): string {
  return `${Math.round(value)}%`
}

function safePercentage(count: number, total: number): number {
  return total <= 0 ? 0 : (count / total) * 100
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

  return session.gradeHistogram.map((bucket) => ({
    label: formatGrade(bucket.gradeIndex),
    count: bucket.count,
    widthPercent: maxCount === 0 ? 0 : (bucket.count / maxCount) * 100,
  }))
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
): SessionDetail {
  const session = sessionWithComparison.session

  return {
    id: session.sessionId,
    selectorLabel: `${formatDate(session.startAt)} · ${formatGymName(session.gymName)}`,
    selectorMeta: index === 0 ? "Latest session" : "Previous session",
    identity: { label: "-", reason: "-" },
    summary: toSummaryStats(session),
    outcomes: toOutcomeItems(session),
    outcomeTotalCount: session.totalClimbs,
    gradeDistribution: toGradeDistribution(session),
    insight: "",
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

export function selectSessionsViewModel(metrics: SessionsMetrics): SessionsViewModel {
  const sessionsNewestFirst = [...metrics.sessions]
    .sort((left, right) => new Date(right.session.startAt).getTime() - new Date(left.session.startAt).getTime())
  const trendSessions = sessionsNewestFirst.slice(0, MAX_TREND_SESSIONS).reverse()

  return {
    trendPoints: trendSessions.map(toTrendPoint),
    trendMetrics: [],
    sessions: sessionsNewestFirst.map(toSessionDetail),
  }
}
