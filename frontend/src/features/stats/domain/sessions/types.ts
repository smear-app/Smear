export type SessionTrendPoint = {
  sessionId: string
  label: string
  tickLabel: string
  climbs: number
  avgGrade: number
}

export type SessionTrendMetric = {
  label: string
  value: string
  description: string
}

export type SessionOutcomeItem = {
  label: string
  count: number
  percentage: number
  tone: "flash" | "send" | "project" | "unfinished"
}

export type SessionGradeDistributionItem = {
  label: string
  count: number
}

export type SessionSummaryStat = {
  label: string
  value: string
}

export type SessionDetail = {
  id: string
  selectorLabel: string
  selectorMeta: string
  summary: SessionSummaryStat[]
  outcomes: SessionOutcomeItem[]
  gradeDistribution: SessionGradeDistributionItem[]
  insight: string
}

export type SessionsViewModel = {
  trendPoints: SessionTrendPoint[]
  trendMetrics: SessionTrendMetric[]
  sessions: SessionDetail[]
}
