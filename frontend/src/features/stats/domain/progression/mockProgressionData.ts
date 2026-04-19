import type { ProgressionRange, ProgressionRangeOption, ProgressionViewModel } from "./types"

export const progressionRangeOptions: ProgressionRangeOption[] = [
  { value: "10-weeks", label: "10 Weeks" },
  { value: "6-months", label: "6 Months" },
  { value: "all-time", label: "All Time" },
]

export const defaultProgressionRange: ProgressionRange = "10-weeks"

export const progressionMockData: Record<ProgressionRange, ProgressionViewModel> = {
  "10-weeks": {
    insight: "Avg grade is trending upward while volume remains steady.",
    chartPoints: [
      { label: "Week 1", tickLabel: "Feb", climbs: 11, avgGrade: 4.1 },
      { label: "Week 2", tickLabel: "", climbs: 13, avgGrade: 4.2 },
      { label: "Week 3", tickLabel: "", climbs: 12, avgGrade: 4.3 },
      { label: "Week 4", tickLabel: "", climbs: 15, avgGrade: 4.4 },
      { label: "Week 5", tickLabel: "", climbs: 14, avgGrade: 4.5 },
      { label: "Week 6", tickLabel: "Mar", climbs: 12, avgGrade: 4.6 },
      { label: "Week 7", tickLabel: "", climbs: 13, avgGrade: 4.7 },
      { label: "Week 8", tickLabel: "", climbs: 14, avgGrade: 4.9 },
      { label: "Week 9", tickLabel: "Apr", climbs: 15, avgGrade: 5.0 },
      { label: "Week 10", tickLabel: "", climbs: 13, avgGrade: 5.1 },
    ],
    metrics: [
      { label: "Working Grade Change", value: "+0.6 V", description: "over last 10 weeks" },
      { label: "Working Grade", value: "V4-V5", description: "most climbed range" },
      { label: "Consistency", value: "3.2 / week", description: "avg sessions per week" },
      { label: "Highest Grade", value: "V6", description: "highest this period" },
    ],
    milestones: [
      {
        id: "10w-first-v5-send",
        title: "First V5 send",
        achievedAt: "2026-02-28T12:00:00Z",
        metadata: { grade: "V5", category: "send" },
      },
      {
        id: "10w-best-volume-session",
        title: "Best session by volume",
        achievedAt: "2026-03-22T12:00:00Z",
        metadata: { climbs: 9 },
      },
      {
        id: "10w-highest-average-grade-week",
        title: "Highest working grade week",
        achievedAt: "2026-04-12T12:00:00Z",
        metadata: { averageGrade: 5.1 },
      },
      {
        id: "10w-three-week-streak",
        title: "Three-week consistency streak",
        achievedAt: "2026-03-08T12:00:00Z",
        metadata: { weeks: 3 },
      },
      {
        id: "10w-first-v6-attempt",
        title: "First V6 attempt logged",
        achievedAt: "2026-04-02T12:00:00Z",
        metadata: { grade: "V6", category: "attempt" },
      },
    ],
  },
  "6-months": {
    insight: "You’re climbing more and gradually pushing into higher grades.",
    chartPoints: [
      { label: "Nov", tickLabel: "Nov", climbs: 39, avgGrade: 3.9 },
      { label: "Dec", tickLabel: "Dec", climbs: 42, avgGrade: 4.1 },
      { label: "Jan", tickLabel: "Jan", climbs: 45, avgGrade: 4.2 },
      { label: "Feb", tickLabel: "Feb", climbs: 47, avgGrade: 4.5 },
      { label: "Mar", tickLabel: "Mar", climbs: 51, avgGrade: 4.7 },
      { label: "Apr", tickLabel: "Apr", climbs: 49, avgGrade: 4.9 },
    ],
    metrics: [
      { label: "Working Grade Change", value: "+1.0 V", description: "over last 6 months" },
      { label: "Working Grade", value: "V4-V5", description: "most climbed range" },
      { label: "Consistency", value: "3.0 / week", description: "avg sessions per week" },
      { label: "Highest Grade", value: "V7", description: "highest this period" },
    ],
    milestones: [
      {
        id: "6m-first-v6-flash",
        title: "First V6 flash",
        achievedAt: "2026-02-03T12:00:00Z",
        metadata: { grade: "V6", category: "flash" },
      },
      {
        id: "6m-most-active-month",
        title: "Most active month",
        achievedAt: "2026-03-13T12:00:00Z",
        metadata: { month: "March" },
      },
      {
        id: "6m-best-sustained-grade-block",
        title: "Best sustained grade block",
        achievedAt: "2026-04-16T12:00:00Z",
        metadata: { weeks: 6, averageGrade: 4.5 },
      },
      {
        id: "6m-first-v7-send",
        title: "First V7 send",
        achievedAt: "2026-01-24T12:00:00Z",
        metadata: { grade: "V7", category: "send" },
      },
      {
        id: "6m-100-climb-period",
        title: "100 climbs in range",
        achievedAt: "2026-03-30T12:00:00Z",
        metadata: { climbs: 100 },
      },
    ],
  },
  "all-time": {
    insight: "Your biggest jumps came when volume stayed healthy and working grade moved with it.",
    chartPoints: [
      { label: "2022", tickLabel: "2022", climbs: 118, avgGrade: 2.8 },
      { label: "2023", tickLabel: "2023", climbs: 164, avgGrade: 3.4 },
      { label: "2024", tickLabel: "2024", climbs: 201, avgGrade: 4.0 },
      { label: "2025", tickLabel: "2025", climbs: 228, avgGrade: 4.6 },
      { label: "2026", tickLabel: "2026", climbs: 96, avgGrade: 5.0 },
    ],
    metrics: [
      { label: "Working Grade Change", value: "+2.2 V", description: "over tracked history" },
      { label: "Working Grade", value: "V3-V5", description: "most climbed range" },
      { label: "Consistency", value: "2.8 / week", description: "avg sessions per week" },
      { label: "Highest Grade", value: "V8", description: "highest this period" },
    ],
    milestones: [
      {
        id: "all-time-first-v4-block",
        title: "First V4 block",
        achievedAt: "2025-05-20T12:00:00Z",
        metadata: { grade: "V4" },
      },
      {
        id: "all-time-breakthrough-year",
        title: "Breakthrough year",
        achievedAt: "2025-10-03T12:00:00Z",
        metadata: { year: 2025 },
      },
      {
        id: "all-time-current-peak-trend",
        title: "Current peak trend",
        achievedAt: "2026-03-29T12:00:00Z",
        metadata: { year: 2026 },
      },
      {
        id: "all-time-500-climbs-logged",
        title: "500 climbs logged",
        achievedAt: "2025-12-14T12:00:00Z",
        metadata: { climbs: 500 },
      },
      {
        id: "all-time-first-v8-send",
        title: "First V8 send",
        achievedAt: "2026-04-06T12:00:00Z",
        metadata: { grade: "V8", category: "send" },
      },
    ],
  },
}
