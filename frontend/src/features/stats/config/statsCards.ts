import { statsPreviewPlaceholders } from "../domain/placeholders"
import type { StatsAreaId, StatsCardConfig } from "../domain/types"

export const statsCards: StatsCardConfig[] = [
  {
    id: "progression",
    title: "Progression",
    path: "/stats/progression",
    meaning: "Improvement and grade trends over time",
    detailDescription: "Improvement trends, grade movement, and long-term climbing trajectory will live here.",
    tone: "ember",
    ...statsPreviewPlaceholders.progression,
  },
  {
    id: "archetype",
    title: "Archetype",
    path: "/stats/archetype",
    meaning: "Climbing style and profile identity",
    detailDescription: "Style identity, preferred terrain, and movement profile breakdowns will live here.",
    tone: "ember",
    ...statsPreviewPlaceholders.archetype,
  },
  {
    id: "performance",
    title: "Performance",
    path: "/stats/performance",
    meaning: "Current ability, outcomes, and climb quality",
    detailDescription: "Send quality, attempt efficiency, and current ability indicators will live here.",
    tone: "gold",
    ...statsPreviewPlaceholders.performance,
  },
  {
    id: "sessions",
    title: "Sessions",
    path: "/stats/sessions",
    meaning: "Session summaries and activity patterns",
    detailDescription: "Session cadence, recent activity, and weekly climbing patterns will live here.",
    tone: "slate",
    ...statsPreviewPlaceholders.sessions,
  },
]

export function getStatsCard(areaId: StatsAreaId) {
  const card = statsCards.find((candidate) => candidate.id === areaId)

  if (!card) {
    throw new Error(`Unknown stats area: ${areaId}`)
  }

  return card
}
