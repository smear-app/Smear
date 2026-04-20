import type { SessionOutcomeItem, SessionsViewModel } from "./types"

function toSessionOutcomeItems(counts: Record<SessionOutcomeItem["tone"], number>): SessionOutcomeItem[] {
  const outcomes = [
    { label: "Flash", tone: "flash", count: counts.flash },
    { label: "Send", tone: "send", count: counts.send },
    { label: "Unfinished", tone: "unfinished", count: counts.unfinished },
  ] satisfies Array<Omit<SessionOutcomeItem, "percentage">>
  const totalCount = outcomes.reduce((sum, item) => sum + item.count, 0)

  if (totalCount === 0) {
    return outcomes.map((item) => ({ ...item, percentage: 0 }))
  }

  const outcomePercentages = outcomes.map((item) => {
    const exactPercentage = (item.count / totalCount) * 100

    return {
      ...item,
      percentage: Math.floor(exactPercentage),
      remainder: exactPercentage % 1,
    }
  })
  const remainingPercentage = 100 - outcomePercentages.reduce((sum, item) => sum + item.percentage, 0)
  const outcomeIndexesByRemainder = outcomePercentages
    .map((item, index) => ({ index, remainder: item.remainder }))
    .sort((first, second) => second.remainder - first.remainder)

  for (let index = 0; index < remainingPercentage; index += 1) {
    outcomePercentages[outcomeIndexesByRemainder[index].index].percentage += 1
  }

  return outcomePercentages.map((item) => ({
    label: item.label,
    count: item.count,
    percentage: item.percentage,
    tone: item.tone,
  }))
}

export const sessionsMockData: SessionsViewModel = {
  trendPoints: [
    { sessionId: "session-5", label: "Mar 02", tickLabel: "Mar 2", climbs: 11, avgGrade: 4.2 },
    { sessionId: "session-4", label: "Mar 06", tickLabel: "Mar 6", climbs: 16, avgGrade: 4.4 },
    { sessionId: "session-3", label: "Mar 12", tickLabel: "Mar 12", climbs: 18, avgGrade: 4.8 },
    { sessionId: "session-2", label: "Apr 03", tickLabel: "Apr 3", climbs: 14, avgGrade: 4.6 },
    { sessionId: "session-1", label: "Apr 10", tickLabel: "Apr 10", climbs: 20, avgGrade: 4.9 },
  ],
  trendMetrics: [
    { label: "Avg Climbs / Session", value: "14", description: "across recent sessions" },
    { label: "Working Grade", value: "V4.6", description: "working session intensity" },
    { label: "Best Session Volume", value: "22 climbs", description: "most climbs in one session" },
    { label: "Best Session Grade", value: "V6 working", description: "strongest session working grade" },
  ],
  sessions: [
    {
      id: "session-1",
      selectorLabel: "Apr 10 · Movement Gym",
      selectorMeta: "Latest session",
      summary: [
        { label: "Total Climbs", value: "18" },
        { label: "Working Grade", value: "V4.8" },
        { label: "Max Grade", value: "V6" },
        { label: "Duration", value: "1h 45m" },
      ],
      outcomes: toSessionOutcomeItems({ flash: 4, send: 8, unfinished: 6 }),
      gradeDistribution: [
        { label: "V3", count: 4 },
        { label: "V4", count: 7 },
        { label: "V5", count: 5 },
        { label: "V6", count: 2 },
      ],
      insight: "Balanced session with strong conversion in your working range and a couple of successful V6 attempts.",
    },
    {
      id: "session-2",
      selectorLabel: "Apr 03 · East Bloc",
      selectorMeta: "Previous session",
      summary: [
        { label: "Total Climbs", value: "14" },
        { label: "Working Grade", value: "V4.6" },
        { label: "Max Grade", value: "V6" },
        { label: "Duration", value: "1h 32m" },
      ],
      outcomes: toSessionOutcomeItems({ flash: 3, send: 5, unfinished: 6 }),
      gradeDistribution: [
        { label: "V3", count: 3 },
        { label: "V4", count: 5 },
        { label: "V5", count: 4 },
        { label: "V6", count: 2 },
      ],
      insight: "Focused heavily on V5 projecting with fewer easy warmup climbs than usual.",
    },
    {
      id: "session-3",
      selectorLabel: "Mar 12 · Movement Gym",
      selectorMeta: "Mid-March session",
      summary: [
        { label: "Total Climbs", value: "18" },
        { label: "Working Grade", value: "V4.8" },
        { label: "Max Grade", value: "V6" },
        { label: "Duration", value: "1h 58m" },
      ],
      outcomes: toSessionOutcomeItems({ flash: 5, send: 7, unfinished: 6 }),
      gradeDistribution: [
        { label: "V3", count: 4 },
        { label: "V4", count: 6 },
        { label: "V5", count: 6 },
        { label: "V6", count: 2 },
      ],
      insight: "High-volume session with a lower working grade than usual early, then stronger conversion once you settled into V5s.",
    },
  ],
}
