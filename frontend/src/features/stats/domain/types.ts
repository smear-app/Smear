export type StatsAreaId = "progression" | "archetype" | "performance" | "sessions"

export type StatsPreviewTone = "ember" | "lichen" | "slate" | "gold"

export type StatsPreviewTrendPoint = {
  id: string
  heightPercent: number
}

export type StatsProgressionPreviewPoint = {
  id: string
  xPercent: number
  yPercent: number
  active: boolean
}

export type StatsProgressionPreviewVisual = {
  kind: "sparkline"
  muted: boolean
  points: StatsProgressionPreviewPoint[]
}

export type StatsArchetypePreviewAxis = {
  id: string
  label: string
  value: number
}

export type StatsArchetypePreviewVisual = {
  kind: "radar"
  state: "empty" | "balanced" | "active"
  axes: StatsArchetypePreviewAxis[]
}

export type StatsPerformancePreviewVisual = {
  kind: "conversionRing"
  percent: number
  active: boolean
}

export type StatsSessionsPreviewBar = {
  id: string
  label: string
  heightPercent: number
  active: boolean
}

export type StatsSessionsPreviewVisual = {
  kind: "dailyBars"
  bars: StatsSessionsPreviewBar[]
}

export type StatsPreviewVisualModel =
  | StatsProgressionPreviewVisual
  | StatsArchetypePreviewVisual
  | StatsPerformancePreviewVisual
  | StatsSessionsPreviewVisual

export type StatsAreaPlaceholder = {
  descriptor: string
  primaryMetric: string
  secondaryText: string
}

export type StatsCardConfig = StatsAreaPlaceholder & {
  id: StatsAreaId
  title: string
  path: string
  meaning: string
  detailDescription: string
  tone: StatsPreviewTone
}
