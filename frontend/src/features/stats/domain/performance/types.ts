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
  tone: "flash" | "send" | "project" | "unfinished"
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

export type PerformanceViewModel = {
  hero: PerformanceHero
  outcomes: PerformanceOutcomeItem[]
  metrics: PerformanceMetric[]
  gradeBands: PerformanceGradeBand[]
  insight: string
}
