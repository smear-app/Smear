import type { SessionGradeDistributionItem, SessionIdentity, SessionOutcomeItem, SessionsViewModel } from "./types"

const TEMPORARY_SESSION_IDENTITIES: Record<string, SessionIdentity> = {
  "session-1": { label: "Volume session", reason: "+22% climbs" },
  "session-2": { label: "Projecting session", reason: "-18% send rate" },
  "session-3": { label: "Hard session", reason: "+0.6 avg grade" },
}

function getTemporarySessionIdentity(sessionId: string): SessionIdentity {
  return TEMPORARY_SESSION_IDENTITIES[sessionId] ?? { label: "Balanced session", reason: "Near average" }
}

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

function toGradeDistributionItem(
  label: string,
  count: number,
  widthPercent: number,
  counts: Record<SessionOutcomeItem["tone"], number>,
): SessionGradeDistributionItem {
  return {
    label,
    count,
    widthPercent,
    segments: ([
      { tone: "flash", count: counts.flash },
      { tone: "send", count: counts.send },
      { tone: "unfinished", count: counts.unfinished },
    ] satisfies Array<Pick<SessionGradeDistributionItem["segments"][number], "tone" | "count">>).map((segment) => ({
      ...segment,
      percentage: count <= 0 ? 0 : (segment.count / count) * 100,
    })),
  }
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
      identity: getTemporarySessionIdentity("session-1"),
      summary: [
        { label: "Total Climbs", value: "18" },
        { label: "Duration", value: "1h 45m" },
        { label: "Max Grade", value: "V6" },
        { label: "Working Grade", value: "V4.8" },
      ],
      outcomes: toSessionOutcomeItems({ flash: 4, send: 8, unfinished: 6 }),
      outcomeTotalCount: 18,
      gradeDistribution: [
        toGradeDistributionItem("V3", 4, (4 / 7) * 100, { flash: 1, send: 2, unfinished: 1 }),
        toGradeDistributionItem("V4", 7, 100, { flash: 2, send: 3, unfinished: 2 }),
        toGradeDistributionItem("V5", 5, (5 / 7) * 100, { flash: 1, send: 2, unfinished: 2 }),
        toGradeDistributionItem("V6", 2, (2 / 7) * 100, { flash: 0, send: 1, unfinished: 1 }),
      ],
      insight: "Balanced session with strong conversion in your working range and a couple of successful V6 attempts.",
    },
    {
      id: "session-2",
      selectorLabel: "Apr 03 · East Bloc",
      selectorMeta: "Previous session",
      identity: getTemporarySessionIdentity("session-2"),
      summary: [
        { label: "Total Climbs", value: "14" },
        { label: "Duration", value: "1h 32m" },
        { label: "Max Grade", value: "V6" },
        { label: "Working Grade", value: "V4.6" },
      ],
      outcomes: toSessionOutcomeItems({ flash: 3, send: 5, unfinished: 6 }),
      outcomeTotalCount: 14,
      gradeDistribution: [
        toGradeDistributionItem("V3", 3, (3 / 5) * 100, { flash: 1, send: 1, unfinished: 1 }),
        toGradeDistributionItem("V4", 5, 100, { flash: 1, send: 2, unfinished: 2 }),
        toGradeDistributionItem("V5", 4, (4 / 5) * 100, { flash: 1, send: 1, unfinished: 2 }),
        toGradeDistributionItem("V6", 2, (2 / 5) * 100, { flash: 0, send: 1, unfinished: 1 }),
      ],
      insight: "Focused heavily on V5 projecting with fewer easy warmup climbs than usual.",
    },
    {
      id: "session-3",
      selectorLabel: "Mar 12 · Movement Gym",
      selectorMeta: "Mid-March session",
      identity: getTemporarySessionIdentity("session-3"),
      summary: [
        { label: "Total Climbs", value: "18" },
        { label: "Duration", value: "1h 58m" },
        { label: "Max Grade", value: "V6" },
        { label: "Working Grade", value: "V4.8" },
      ],
      outcomes: toSessionOutcomeItems({ flash: 5, send: 7, unfinished: 6 }),
      outcomeTotalCount: 18,
      gradeDistribution: [
        toGradeDistributionItem("V3", 4, (4 / 6) * 100, { flash: 1, send: 2, unfinished: 1 }),
        toGradeDistributionItem("V4", 6, 100, { flash: 2, send: 2, unfinished: 2 }),
        toGradeDistributionItem("V5", 6, 100, { flash: 2, send: 2, unfinished: 2 }),
        toGradeDistributionItem("V6", 2, (2 / 6) * 100, { flash: 0, send: 1, unfinished: 1 }),
      ],
      insight: "High-volume session with a lower working grade than usual early, then stronger conversion once you settled into V5s.",
    },
  ],
}
