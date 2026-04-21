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
  percentageLabel?: string
  tone: "flash" | "send" | "unfinished"
}

export type SessionGradeDistributionItem = {
  label: string
  count: number
  widthPercent: number
}

export type SessionSummaryStat = {
  label: string
  value: string
}

export type SessionIdentity = {
  label: string
  reason: string
}

export type SessionDetail = {
  id: string
  selectorLabel: string
  selectorMeta: string
  identity: SessionIdentity
  summary: SessionSummaryStat[]
  outcomes: SessionOutcomeItem[]
  outcomeTotalCount: number
  gradeDistribution: SessionGradeDistributionItem[]
  insight: string
}

export type SessionsViewModel = {
  trendPoints: SessionTrendPoint[]
  trendMetrics: SessionTrendMetric[]
  sessions: SessionDetail[]
}
