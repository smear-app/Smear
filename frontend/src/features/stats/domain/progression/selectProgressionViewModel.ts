import type { ProgressionMetrics } from "../calculators/progression"
import { getLocalWeekStart, toLocalDateKey } from "../primitives"
import type { ProgressionChartPoint, ProgressionViewModel } from "./types"

export type ProgressionViewModelOptions = {
  visibleStartAt?: Date | string | null
  visibleEndAt?: Date | string | null
  firstHistoryStartAt?: Date | string | null
}

function formatWeekLabel(startAt: string): string {
  const date = new Date(startAt)

  if (!Number.isFinite(date.getTime())) {
    return ""
  }

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

function formatTickLabel(startAt: string, previousStartAt: string | null): string {
  const date = new Date(startAt)

  if (!Number.isFinite(date.getTime())) {
    return ""
  }

  if (previousStartAt === null) {
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
  }

  const previousDate = new Date(previousStartAt)

  if (!Number.isFinite(previousDate.getTime()) || previousDate.getMonth() !== date.getMonth()) {
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
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

function getOptionalLocalWeekStart(value: Date | string | null | undefined): Date | null {
  return value === null || value === undefined ? null : getLocalWeekStart(value)
}

function getVisibleWeekStarts(metrics: ProgressionMetrics, options: ProgressionViewModelOptions): Date[] {
  const metricStarts = metrics.weekly.flatMap((bucket) => {
    const weekStart = getLocalWeekStart(bucket.startAt)
    return weekStart ? [weekStart] : []
  })
  const naturalStart = getOptionalLocalWeekStart(options.visibleStartAt ?? metricStarts[0] ?? options.visibleEndAt ?? new Date())
  const firstHistoryStart = getOptionalLocalWeekStart(options.firstHistoryStartAt ?? metricStarts[0])
  const end = getOptionalLocalWeekStart(options.visibleEndAt ?? metrics.weekly.at(-1)?.startAt ?? options.visibleStartAt ?? new Date())

  if (!end) {
    return []
  }

  if (!firstHistoryStart) {
    return [new Date(end)]
  }

  const startCandidates = [naturalStart, firstHistoryStart].flatMap((date) => (date ? [date] : []))
  const start = startCandidates.length > 0
    ? new Date(Math.max(...startCandidates.map((date) => date.getTime())))
    : new Date(end)

  if (start.getTime() > end.getTime()) {
    return [new Date(end)]
  }

  const weeks: Date[] = []
  const cursor = new Date(start)

  while (cursor.getTime() <= end.getTime()) {
    weeks.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 7)
  }

  return weeks
}

function selectChartPoints(metrics: ProgressionMetrics, options: ProgressionViewModelOptions): ProgressionChartPoint[] {
  const bucketsByKey = new Map(metrics.weekly.map((bucket) => [bucket.key, bucket]))
  const weeks = getVisibleWeekStarts(metrics, options)

  return weeks.map((weekStart, index) => {
    const key = toLocalDateKey(weekStart)
    const bucket = bucketsByKey.get(key)
    const startAt = bucket?.startAt ?? weekStart.toISOString()
    const previousStartAt = index > 0 ? (bucketsByKey.get(toLocalDateKey(weeks[index - 1]))?.startAt ?? weeks[index - 1].toISOString()) : null

    return {
      label: formatWeekLabel(startAt),
      tickLabel: formatTickLabel(startAt, previousStartAt),
      climbs: bucket?.totalClimbs ?? 0,
      barClimbs: bucket?.totalSentClimbs ?? 0,
      avgGrade: bucket && bucket.totalClimbs > 0 ? bucket.workingGrade : null,
      gradeLabel: formatGradeLabel(bucket?.workingGrade ?? null),
    }
  })
}

function selectExistingChartPoints(metrics: ProgressionMetrics): ProgressionChartPoint[] {
  return metrics.weekly.map((bucket, index, buckets) => ({
    label: formatWeekLabel(bucket.startAt),
    tickLabel: formatTickLabel(bucket.startAt, buckets[index - 1]?.startAt ?? null),
    climbs: bucket.totalClimbs,
    barClimbs: bucket.totalSentClimbs,
    avgGrade: bucket.totalClimbs === 0 ? null : bucket.workingGrade,
    gradeLabel: formatGradeLabel(bucket.workingGrade),
  }))
}

export function selectProgressionViewModel(
  metrics: ProgressionMetrics,
  options: ProgressionViewModelOptions = {},
): ProgressionViewModel {
  const shouldFillEmptyWeeks = options.visibleStartAt !== undefined || options.visibleEndAt !== undefined

  return {
    insight: "",
    chartPoints: shouldFillEmptyWeeks ? selectChartPoints(metrics, options) : selectExistingChartPoints(metrics),
    metrics: [],
    milestones: [],
  }
}
