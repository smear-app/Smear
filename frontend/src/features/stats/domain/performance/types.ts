export type PerformanceRange = "10-weeks" | "6-months" | "all-time"

export type PerformanceTimeframeKey = "10w" | "6m" | "all"

export type PerformanceRangeOption = {
  value: PerformanceRange
  label: string
}

export type PerformanceHero = {
  label: string
  value: number
  valueLabel: string
  description: string
}

export type PerformanceOutcomeItem = {
  label: string
  count: number
  percentage: number
  percentageLabel: string
  tone: "flash" | "send" | "unfinished"
}

export type PerformanceMetric = {
  label: string
  value: string
  description: string
}

export type PerformanceGradeBand = {
  label: string
  sendRate: number
  sendRateLabel: string
}

export type PerformancePyramidBand = {
  label: string
  count: number
}

export type PerformanceViewModel = {
  periodLabel: string
  pyramid: PerformancePyramidBand[]
  outcomes: PerformanceOutcomeItem[]
  metrics: PerformanceMetric[]
  gradeBands: PerformanceGradeBand[]
  insight: string | null
}
