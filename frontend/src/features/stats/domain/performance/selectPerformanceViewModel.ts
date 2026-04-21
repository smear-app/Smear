import type { PerformanceMetrics } from "../calculators/performance"
import type {
  PerformanceGradeBand,
  PerformanceOutcomeItem,
  PerformancePyramidBand,
  PerformanceTimeframeKey,
  PerformanceViewModel,
} from "./types"

const TIMEFRAME_LABELS: Record<PerformanceTimeframeKey, string> = {
  "10w": "last 10 weeks",
  "6m": "last 6 months",
  all: "all time",
}

function formatGrade(gradeIndex: number | null): string {
  if (gradeIndex === null) {
    return "None"
  }

  if (Number.isInteger(gradeIndex)) {
    return `V${gradeIndex}`
  }

  return `V${Math.floor(gradeIndex)}–V${Math.ceil(gradeIndex)}`
}

function formatPercent(value: number): string {
  if (!Number.isFinite(value)) {
    return "0%"
  }

  return `${Math.round(value * 100)}%`
}

function toPercentValue(value: number): number {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.round(value * 100)
}

function formatDecimal(value: number): string {
  if (!Number.isFinite(value)) {
    return "0.0"
  }

  return value.toFixed(1)
}

function selectGradePyramid(metrics: PerformanceMetrics): PerformancePyramidBand[] {
  return [...metrics.gradeHistogram]
    .sort((left, right) => right.gradeIndex - left.gradeIndex)
    .map((bucket) => ({
      label: formatGrade(bucket.gradeIndex),
      count: bucket.count,
    }))
}

function selectOutcomeBreakdown(metrics: PerformanceMetrics): PerformanceOutcomeItem[] {
  const totalClimbs = metrics.totalClimbs
  const outcomeItems = [
    { label: "Flash", count: metrics.outcomeCounts.flash, tone: "flash" },
    { label: "Send", count: metrics.outcomeCounts.send, tone: "send" },
    { label: "Unfinished", count: metrics.outcomeCounts.attempt, tone: "unfinished" },
  ] satisfies Array<Pick<PerformanceOutcomeItem, "label" | "count" | "tone">>

  return outcomeItems.map((item) => {
    const percentage = totalClimbs === 0 ? 0 : Math.round((item.count / totalClimbs) * 100)

    return {
      ...item,
      percentage,
      percentageLabel: `${percentage}%`,
    }
  })
}

function selectGradeBandPerformance(metrics: PerformanceMetrics): PerformanceGradeBand[] {
  return metrics.gradePerformance.map((bucket) => {
    const sendRate = toPercentValue(bucket.sendRate)

    return {
      label: formatGrade(bucket.gradeIndex),
      sendRate,
      sendRateLabel: `${sendRate}% send`,
    }
  })
}

export function selectPerformanceViewModel(
  metrics: PerformanceMetrics,
  timeframe: PerformanceTimeframeKey,
): PerformanceViewModel {
  return {
    periodLabel: TIMEFRAME_LABELS[timeframe],
    pyramid: selectGradePyramid(metrics),
    outcomes: selectOutcomeBreakdown(metrics),
    outcomeTotalCount: metrics.totalClimbs,
    metrics: [
      {
        label: "Flash Rate",
        value: formatPercent(metrics.flashRate),
        description: "",
      },
      {
        label: "Avg Attempts / Send",
        value: formatDecimal(metrics.averageAttemptsPerSend),
        description: "",
      },
      {
        label: "Hardest Send",
        value: formatGrade(metrics.highestGrade),
        description: "",
      },
      {
        label: "Hardest Flash",
        value: formatGrade(metrics.highestFlashGrade),
        description: "",
      },
    ],
    gradeBands: selectGradeBandPerformance(metrics),
    insight: null,
  }
}
