export type PerformanceRange = "10-weeks" | "6-months" | "all-time"

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
}

export type PerformancePyramidBand = {
  label: string
  count: number
}

export type PerformanceViewModel = {
  periodLabel: string
  hero: PerformanceHero
  pyramid: PerformancePyramidBand[]
  outcomes: PerformanceOutcomeItem[]
  metrics: PerformanceMetric[]
  gradeBands: PerformanceGradeBand[]
  insight: string
}
