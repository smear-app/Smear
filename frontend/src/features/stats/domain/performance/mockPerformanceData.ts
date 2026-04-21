import type { PerformanceRange, PerformanceRangeOption, PerformanceViewModel } from "./types"

export const performanceRangeOptions: PerformanceRangeOption[] = [
  { value: "10-weeks", label: "10 Weeks" },
  { value: "6-months", label: "6 Months" },
  { value: "all-time", label: "All Time" },
]

export const performanceMockData: Record<PerformanceRange, PerformanceViewModel> = {
  "10-weeks": {
    periodLabel: "last 10 weeks",
    pyramid: [
      { label: "V6", count: 2 },
      { label: "V5", count: 6 },
      { label: "V4", count: 11 },
      { label: "V3", count: 15 },
      { label: "V2", count: 18 },
    ],
    outcomes: [
      { label: "Flash", count: 12, percentage: 28, percentageLabel: "28%", tone: "flash" },
      { label: "Send", count: 15, percentage: 34, percentageLabel: "34%", tone: "send" },
      { label: "Unfinished", count: 7, percentage: 15, percentageLabel: "15%", tone: "unfinished" },
    ],
    metrics: [
      { label: "Flash Rate", value: "28%", description: "of logged attempts this period" },
      { label: "Avg Attempts / Send", value: "2.3", description: "before successful send" },
      { label: "Hardest Send", value: "V6", description: "highest in last 10 weeks" },
      { label: "Hardest Flash", value: "V5", description: "best first-go send this period" },
    ],
    gradeBands: [
      { label: "V3", sendRate: 78, sendRateLabel: "78% send" },
      { label: "V4", sendRate: 61, sendRateLabel: "61% send" },
      { label: "V5", sendRate: 34, sendRateLabel: "34% send" },
      { label: "V6", sendRate: 12, sendRateLabel: "12% send" },
    ],
    insight:
      "You convert most climbs in your working range efficiently, but success drops sharply above V5 this period.",
  },
  "6-months": {
    periodLabel: "last 6 months",
    pyramid: [
      { label: "V6", count: 5 },
      { label: "V5", count: 12 },
      { label: "V4", count: 22 },
      { label: "V3", count: 27 },
      { label: "V2", count: 32 },
    ],
    outcomes: [
      { label: "Flash", count: 24, percentage: 25, percentageLabel: "25%", tone: "flash" },
      { label: "Send", count: 31, percentage: 33, percentageLabel: "33%", tone: "send" },
      { label: "Unfinished", count: 16, percentage: 18, percentageLabel: "18%", tone: "unfinished" },
    ],
    metrics: [
      { label: "Flash Rate", value: "25%", description: "of logged attempts this period" },
      { label: "Avg Attempts / Send", value: "2.6", description: "before successful send" },
      { label: "Hardest Send", value: "V7", description: "highest in last 6 months" },
      { label: "Hardest Flash", value: "V5", description: "best first-go send this period" },
    ],
    gradeBands: [
      { label: "V3", sendRate: 81, sendRateLabel: "81% send" },
      { label: "V4", sendRate: 63, sendRateLabel: "63% send" },
      { label: "V5", sendRate: 39, sendRateLabel: "39% send" },
      { label: "V6", sendRate: 18, sendRateLabel: "18% send" },
    ],
    insight:
      "Strong execution through your working grades over the last 6 months, with most misses concentrated on stretch attempts.",
  },
  "all-time": {
    periodLabel: "all time",
    pyramid: [
      { label: "V6", count: 9 },
      { label: "V5", count: 24 },
      { label: "V4", count: 43 },
      { label: "V3", count: 54 },
      { label: "V2", count: 61 },
    ],
    outcomes: [
      { label: "Flash", count: 48, percentage: 22, percentageLabel: "22%", tone: "flash" },
      { label: "Send", count: 73, percentage: 33, percentageLabel: "33%", tone: "send" },
      { label: "Unfinished", count: 40, percentage: 18, percentageLabel: "18%", tone: "unfinished" },
    ],
    metrics: [
      { label: "Flash Rate", value: "22%", description: "of logged attempts overall" },
      { label: "Avg Attempts / Send", value: "2.8", description: "before successful send" },
      { label: "Hardest Send", value: "V7", description: "highest across full history" },
      { label: "Hardest Flash", value: "V6", description: "best first-go send overall" },
    ],
    gradeBands: [
      { label: "V3", sendRate: 84, sendRateLabel: "84% send" },
      { label: "V4", sendRate: 66, sendRateLabel: "66% send" },
      { label: "V5", sendRate: 42, sendRateLabel: "42% send" },
      { label: "V6", sendRate: 19, sendRateLabel: "19% send" },
    ],
    insight:
      "Across your full history, you execute efficiently in familiar grades, but conversion drops fast once you move into high-stretch territory.",
  },
}
