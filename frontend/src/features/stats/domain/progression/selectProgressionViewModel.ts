import type { ProgressionMetrics } from "../calculators/progression"
import type { ProgressionChartPoint, ProgressionViewModel } from "./types"

function formatWeekLabel(startAt: string): string {
  const date = new Date(startAt)

  if (!Number.isFinite(date.getTime())) {
    return ""
  }

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" })
}

function formatTickLabel(startAt: string, previousStartAt: string | null): string {
  const date = new Date(startAt)

  if (!Number.isFinite(date.getTime())) {
    return ""
  }

  if (previousStartAt === null) {
    return date.toLocaleDateString(undefined, { month: "short", timeZone: "UTC" })
  }

  const previousDate = new Date(previousStartAt)

  if (!Number.isFinite(previousDate.getTime()) || previousDate.getUTCMonth() !== date.getUTCMonth()) {
    return date.toLocaleDateString(undefined, { month: "short", timeZone: "UTC" })
  }

  return ""
}

function formatGradeLabel(grade: number | null): string {
  if (grade === null || !Number.isFinite(grade)) {
    return "None"
  }

  if (Number.isInteger(grade)) {
    return `V${grade}`
  }

  return `V${Math.floor(grade)}–V${Math.ceil(grade)}`
}

function selectChartPoints(metrics: ProgressionMetrics): ProgressionChartPoint[] {
  return metrics.weekly.map((bucket, index, buckets) => ({
    label: formatWeekLabel(bucket.startAt),
    tickLabel: formatTickLabel(bucket.startAt, buckets[index - 1]?.startAt ?? null),
    climbs: bucket.totalClimbs,
    avgGrade: bucket.workingGrade,
    gradeLabel: formatGradeLabel(bucket.workingGrade),
  }))
}

export function selectProgressionViewModel(metrics: ProgressionMetrics): ProgressionViewModel {
  return {
    insight: "",
    chartPoints: selectChartPoints(metrics),
    metrics: [],
    milestones: [],
  }
}
