export type StatsAreaId = "progression" | "archetype" | "performance" | "sessions"

export type StatsPreviewTone = "ember" | "lichen" | "slate" | "gold"

export type StatsPreviewVisualKind = "trend" | "profile" | "outcome" | "cadence"

export type StatsPreviewTrendPoint = {
  id: string
  heightPercent: number
}

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
  visualKind: StatsPreviewVisualKind
}
