export type ProgressionRange = "10-weeks" | "6-months" | "all-time"

export type ProgressionChartPoint = {
  label: string
  tickLabel: string
  climbs: number
  avgGrade: number
}

export type ProgressionMetric = {
  label: string
  value: string
  description: string
}

export type ProgressionMilestone = {
  title: string
  detail: string
  periodLabel: string
}

export type ProgressionRangeOption = {
  value: ProgressionRange
  label: string
}

export type ProgressionViewModel = {
  insight: string
  chartPoints: ProgressionChartPoint[]
  metrics: ProgressionMetric[]
  milestones: ProgressionMilestone[]
}
