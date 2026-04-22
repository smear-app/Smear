import type { ProgressionMetrics } from "../calculators/progression"
import { safeDivide } from "../calculators/shared"
import { formatVGrade, getLocalWeekStart, toLocalDateKey } from "../primitives"
import type { ProgressionChartPoint, ProgressionRange, ProgressionViewModel } from "./types"

export type ProgressionViewModelOptions = {
  range?: ProgressionRange
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
  return formatVGrade(grade, "-")
}

function formatChartGradeLabel(grade: number | null): string {
  const label = formatGradeLabel(grade)
  return label === "-" ? "None" : label
}

function formatAverage(value: number): string {
  return Number.isFinite(value) ? value.toFixed(1) : "-"
}

function formatGradeDelta(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return "-"
  }

  const sign = value >= 0 ? "+" : ""
  return `${sign}${value.toFixed(1)} V`
}

function averageValues(values: readonly number[]): number | null {
  if (values.length === 0) {
    return null
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length
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
      gradeLabel: formatChartGradeLabel(bucket?.workingGrade ?? null),
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
    gradeLabel: formatChartGradeLabel(bucket.workingGrade),
  }))
}

function getComparisonWeekCount(range: ProgressionRange | undefined): number {
  if (range === "6-months") {
    return 4
  }

  if (range === "all-time") {
    return 6
  }

  return 2
}

function selectWorkingGradeDelta(metrics: ProgressionMetrics, options: ProgressionViewModelOptions): number | null {
  const comparisonWeekCount = getComparisonWeekCount(options.range)
  const end = getOptionalLocalWeekStart(options.visibleEndAt ?? metrics.weekly.at(-1)?.startAt ?? new Date())

  if (!end) {
    return null
  }

  const validWorkingGrades = metrics.weekly.flatMap((bucket) => {
    const weekStart = getLocalWeekStart(bucket.startAt)

    if (!weekStart || weekStart.getTime() > end.getTime() || bucket.workingGrade === null) {
      return []
    }

    return [bucket.workingGrade]
  })

  if (validWorkingGrades.length < comparisonWeekCount * 2) {
    return null
  }

  const recent = validWorkingGrades.slice(-comparisonWeekCount)
  const previous = validWorkingGrades.slice(-(comparisonWeekCount * 2), -comparisonWeekCount)
  const recentAverage = averageValues(recent)
  const previousAverage = averageValues(previous)

  if (recentAverage === null || previousAverage === null) {
    return null
  }

  return recentAverage - previousAverage
}

function selectSupportingMetrics(
  metrics: ProgressionMetrics,
  options: ProgressionViewModelOptions,
) {
  const bucketsByKey = new Map(metrics.weekly.map((bucket) => [bucket.key, bucket]))
  const visibleBuckets = getVisibleWeekStarts(metrics, options).map((weekStart) => bucketsByKey.get(toLocalDateKey(weekStart)) ?? null)
  const visibleBucketCount = visibleBuckets.length
  const highestSentGrade = visibleBuckets.reduce<number | null>((highestGrade, bucket) => {
    if (bucket?.highestSentGrade === null || bucket?.highestSentGrade === undefined) {
      return highestGrade
    }

    return highestGrade === null ? bucket.highestSentGrade : Math.max(highestGrade, bucket.highestSentGrade)
  }, null)
  const latestWorkingGrade = [...visibleBuckets]
    .reverse()
    .find((bucket) => bucket?.workingGrade !== null && bucket?.workingGrade !== undefined)?.workingGrade ?? null
  const totalClimbs = visibleBuckets.reduce((sum, bucket) => sum + (bucket?.totalClimbs ?? 0), 0)
  const totalSessions = visibleBuckets.reduce((sum, bucket) => sum + (bucket?.totalSessions ?? 0), 0)

  return [
    {
      label: "Highest Grade",
      value: formatGradeLabel(highestSentGrade),
      description: "highest this period",
    },
    {
      label: "Working Range",
      value: formatGradeLabel(latestWorkingGrade),
      description: formatGradeDelta(selectWorkingGradeDelta(metrics, options)),
    },
    {
      label: "Avg Climbs / Week",
      value: formatAverage(safeDivide(totalClimbs, visibleBucketCount)),
      description: "visible chart window",
    },
    {
      label: "Sessions / Week",
      value: formatAverage(safeDivide(totalSessions, visibleBucketCount)),
      description: "visible chart window",
    },
  ]
}

export function selectProgressionViewModel(
  metrics: ProgressionMetrics,
  options: ProgressionViewModelOptions = {},
): ProgressionViewModel {
  const shouldFillEmptyWeeks = options.visibleStartAt !== undefined || options.visibleEndAt !== undefined

  return {
    insight: "",
    chartPoints: shouldFillEmptyWeeks ? selectChartPoints(metrics, options) : selectExistingChartPoints(metrics),
    metrics: selectSupportingMetrics(metrics, options),
    milestones: [],
  }
}
