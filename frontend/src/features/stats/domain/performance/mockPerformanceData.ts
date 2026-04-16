import type { PerformanceViewModel } from "./types"

export const performanceMockData: PerformanceViewModel = {
  hero: {
    label: "Send Rate",
    value: 62,
    valueLabel: "62%",
    description: "of logged attempts sent this period",
  },
  outcomes: [
    { label: "Flash", count: 12, percentage: 28, tone: "flash" },
    { label: "Send", count: 15, percentage: 34, tone: "send" },
    { label: "Project", count: 10, percentage: 23, tone: "project" },
    { label: "Unfinished", count: 7, percentage: 15, tone: "unfinished" },
  ],
  metrics: [
    { label: "Flash Rate", value: "28%", description: "of logged attempts" },
    { label: "Avg Attempts / Send", value: "2.3", description: "before successful send" },
    { label: "Hardest Send", value: "V6", description: "highest this period" },
    { label: "Hardest Flash", value: "V5", description: "strongest first-go send" },
  ],
  gradeBands: [
    { label: "V3", sendRate: 78 },
    { label: "V4", sendRate: 61 },
    { label: "V5", sendRate: 34 },
    { label: "V6", sendRate: 12 },
  ],
  insight: "You convert most climbs in your working range efficiently, but success drops sharply above V5.",
}
