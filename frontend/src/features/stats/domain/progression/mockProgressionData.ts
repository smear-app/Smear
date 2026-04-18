import type { ProgressionRange, ProgressionRangeOption, ProgressionViewModel } from "./types"

export const progressionRangeOptions: ProgressionRangeOption[] = [
  { value: "10-weeks", label: "10 Weeks" },
  { value: "6-months", label: "6 Months" },
  { value: "all-time", label: "All Time" },
]

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
      { label: "Avg Grade Change", value: "+0.6 V", description: "over last 10 weeks" },
      { label: "Working Grade", value: "V4-V5", description: "most climbed range" },
      { label: "Consistency", value: "3.2 / week", description: "avg sessions per week" },
      { label: "Highest Grade", value: "V6", description: "highest this period" },
    ],
    milestones: [
      {
        title: "First V5 send",
        detail: "You broke into V5 after three straight weeks of steady volume.",
        occurredAt: "2026-02-28T12:00:00Z",
      },
      {
        title: "Best session by volume",
        detail: "Logged 9 climbs in one session without a dip in average grade.",
        occurredAt: "2026-03-22T12:00:00Z",
      },
      {
        title: "Highest average grade week",
        detail: "Your strongest week balanced fewer attempts with better outcomes.",
        occurredAt: "2026-04-12T12:00:00Z",
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
      { label: "Avg Grade Change", value: "+1.0 V", description: "over last 6 months" },
      { label: "Working Grade", value: "V4-V5", description: "most climbed range" },
      { label: "Consistency", value: "3.0 / week", description: "avg sessions per week" },
      { label: "Highest Grade", value: "V7", description: "highest this period" },
    ],
    milestones: [
      {
        title: "First V6 flash",
        detail: "A standout session that raised your ceiling without a spike in volume.",
        occurredAt: "2026-02-03T12:00:00Z",
      },
      {
        title: "Most active month",
        detail: "March paired your highest monthly volume with a stronger average grade.",
        occurredAt: "2026-03-13T12:00:00Z",
      },
      {
        title: "Best sustained grade block",
        detail: "The last six weeks held your average grade above V4.5.",
        occurredAt: "2026-04-16T12:00:00Z",
      },
    ],
  },
  "all-time": {
    insight: "Your biggest jumps came when volume stayed healthy and average grade moved with it.",
    chartPoints: [
      { label: "2022", tickLabel: "2022", climbs: 118, avgGrade: 2.8 },
      { label: "2023", tickLabel: "2023", climbs: 164, avgGrade: 3.4 },
      { label: "2024", tickLabel: "2024", climbs: 201, avgGrade: 4.0 },
      { label: "2025", tickLabel: "2025", climbs: 228, avgGrade: 4.6 },
      { label: "2026", tickLabel: "2026", climbs: 96, avgGrade: 5.0 },
    ],
    metrics: [
      { label: "Avg Grade Change", value: "+2.2 V", description: "over tracked history" },
      { label: "Working Grade", value: "V3-V5", description: "most climbed range" },
      { label: "Consistency", value: "2.8 / week", description: "avg sessions per week" },
      { label: "Highest Grade", value: "V8", description: "highest this period" },
    ],
    milestones: [
      {
        title: "First V4 block",
        detail: "The first sustained stretch where your average week hovered around V4.",
        occurredAt: "2025-05-20T12:00:00Z",
      },
      {
        title: "Breakthrough year",
        detail: "The strongest combined jump in volume and average grade so far.",
        occurredAt: "2025-10-03T12:00:00Z",
      },
      {
        title: "Current peak trend",
        detail: "This year is tracking toward the highest average grade yet.",
        occurredAt: "2026-03-29T12:00:00Z",
      },
    ],
  },
}
