import { bucketClimbsByWeek, filterSentClimbs, getGradeIndexes, type EnrichedClimb } from "../primitives"
import { calculateProgressionMetrics, type ProgressionMetrics } from "../calculators/progression"
import type { StatsPipelineValidationIssue } from "./validateStatsPipeline"

export type ProgressionMetricsValidationResult = {
  ok: boolean
  summary: {
    inputClimbs: number
    weeklyBuckets: number
    weeklyClimbCount: number
    weeklySentClimbCount: number
  }
  issues: StatsPipelineValidationIssue[]
  metrics: ProgressionMetrics
}

export function validateProgressionMetrics(climbs: readonly EnrichedClimb[]): ProgressionMetricsValidationResult {
  const metrics = calculateProgressionMetrics(climbs)
  const issues: StatsPipelineValidationIssue[] = []
  const weeklyClimbCount = metrics.weekly.reduce((sum, bucket) => sum + bucket.totalClimbs, 0)
  const weeklySentClimbCount = metrics.weekly.reduce((sum, bucket) => sum + bucket.totalSentClimbs, 0)
  const expectedSentClimbCount = filterSentClimbs(climbs).length
  const sourceBucketsByKey = new Map(bucketClimbsByWeek(climbs).map((bucket) => [bucket.key, bucket]))

  if (weeklyClimbCount !== climbs.length) {
    issues.push({
      code: "progression-weekly-total-mismatch",
      message: "Progression weekly climb totals do not sum to input climb count.",
      details: { weeklyClimbCount, inputClimbs: climbs.length },
    })
  }

  if (weeklySentClimbCount !== expectedSentClimbCount) {
    issues.push({
      code: "progression-weekly-sent-total-mismatch",
      message: "Progression weekly sent totals do not sum to sent input climb count.",
      details: { weeklySentClimbCount, expectedSentClimbCount },
    })
  }

  for (let index = 0; index < metrics.weekly.length; index += 1) {
    const bucket = metrics.weekly[index]
    const previousBucket = metrics.weekly[index - 1]

    if (previousBucket && bucket.startAt < previousBucket.startAt) {
      issues.push({
        code: "progression-weekly-sort-order",
        message: "Progression weekly metrics are not sorted by start time.",
      })
    }

    if (bucket.totalSentClimbs > bucket.totalClimbs) {
      issues.push({
        code: "progression-sent-exceeds-total",
        message: "A progression bucket has more sent climbs than total climbs.",
        details: { bucketKey: bucket.key, totalClimbs: bucket.totalClimbs, totalSentClimbs: bucket.totalSentClimbs },
      })
    }

    if (bucket.totalSentClimbs === 0 && (bucket.averageSentGrade !== null || bucket.workingGrade !== null)) {
      issues.push({
        code: "progression-unexpected-grade-metric",
        message: "A progression bucket without sent climbs has non-null grade metrics.",
        details: { bucketKey: bucket.key },
      })
    }

    const sourceClimbs = sourceBucketsByKey.get(bucket.key)?.climbs ?? []
    const sentSourceClimbs = filterSentClimbs(sourceClimbs)
    const sentGradeCount = getGradeIndexes(sentSourceClimbs).length

    if (sentGradeCount === 0 && (bucket.averageSentGrade !== null || bucket.workingGrade !== null)) {
      issues.push({
        code: "progression-unexpected-null-grade-metric",
        message: "A progression bucket without valid sent grades has non-null grade metrics.",
        details: { bucketKey: bucket.key },
      })
    }
  }

  return {
    ok: issues.length === 0,
    summary: {
      inputClimbs: climbs.length,
      weeklyBuckets: metrics.weekly.length,
      weeklyClimbCount,
      weeklySentClimbCount,
    },
    issues,
    metrics,
  }
}
