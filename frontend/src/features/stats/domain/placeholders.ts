import type { StatsAreaId, StatsAreaPlaceholder } from "./types"

export const statsPreviewPlaceholders: Record<StatsAreaId, StatsAreaPlaceholder> = {
  progression: {
    descriptor: "Trending up",
    primaryMetric: "+0.6 working grade",
    secondaryText: "over the last 8 weeks",
  },
  archetype: {
    descriptor: "Style profile",
    primaryMetric: "Technical / Vertical",
    secondaryText: "balance, feet, and controlled movement",
  },
  performance: {
    descriptor: "Strong send rate",
    primaryMetric: "Flash rate 38%",
    secondaryText: "quality and outcome snapshot",
  },
  sessions: {
    descriptor: "Consistent",
    primaryMetric: "3 sessions",
    secondaryText: "this week - 5.2 hrs on wall",
  },
}
