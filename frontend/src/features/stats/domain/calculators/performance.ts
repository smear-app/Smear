import {
  buildGradeHistogram,
  buildOutcomeCounts,
  filterAttemptClimbs,
  filterFlashClimbs,
  filterSentClimbs,
  getAverageGrade,
  getHighestGrade,
  getMedianGrade,
  type EnrichedClimb,
  type GradeHistogramBucket,
  type OutcomeCounts,
} from "../primitives"
import { calculateTopFortyPercentMedianWorkingGrade, safeDivide } from "./shared"

export type PerformanceMetrics = {
  totalClimbs: number
  totalAttempts: number
  totalSentClimbs: number
  totalFlashClimbs: number
  totalAttemptClimbs: number
  flashRate: number
  averageAttemptsPerSend: number
  highestGrade: number | null
  highestFlashGrade: number | null
  averageSentGrade: number | null
  medianSentGrade: number | null
  workingGrade: number | null
  gradeHistogram: GradeHistogramBucket[]
  gradePerformance: PerformanceGradePerformanceBucket[]
  outcomeCounts: OutcomeCounts
}

export type PerformanceGradePerformanceBucket = {
  gradeIndex: number
  totalClimbs: number
  sentClimbs: number
  sendRate: number
}

function buildGradePerformanceBuckets(climbs: readonly EnrichedClimb[]): PerformanceGradePerformanceBucket[] {
  const bucketsByGrade = new Map<number, { totalClimbs: number; sentClimbs: number }>()

  for (const climb of climbs) {
    if (typeof climb.gradeIndex !== "number" || !Number.isFinite(climb.gradeIndex)) {
      continue
    }

    const bucket = bucketsByGrade.get(climb.gradeIndex) ?? { totalClimbs: 0, sentClimbs: 0 }
    bucket.totalClimbs += 1

    if (climb.isSend) {
      bucket.sentClimbs += 1
    }

    bucketsByGrade.set(climb.gradeIndex, bucket)
  }

  return [...bucketsByGrade.entries()]
    .sort(([leftGrade], [rightGrade]) => leftGrade - rightGrade)
    .map(([gradeIndex, bucket]) => ({
      gradeIndex,
      totalClimbs: bucket.totalClimbs,
      sentClimbs: bucket.sentClimbs,
      sendRate: safeDivide(bucket.sentClimbs, bucket.totalClimbs),
    }))
}

export function calculatePerformanceMetrics(climbs: readonly EnrichedClimb[]): PerformanceMetrics {
  const sentClimbs = filterSentClimbs(climbs)
  const flashClimbs = filterFlashClimbs(climbs)
  const attemptClimbs = filterAttemptClimbs(climbs)

  return {
    totalClimbs: climbs.length,
    totalAttempts: climbs.length,
    totalSentClimbs: sentClimbs.length,
    totalFlashClimbs: flashClimbs.length,
    totalAttemptClimbs: attemptClimbs.length,
    flashRate: safeDivide(flashClimbs.length, sentClimbs.length),
    averageAttemptsPerSend: safeDivide(climbs.length, sentClimbs.length),
    highestGrade: getHighestGrade(sentClimbs),
    highestFlashGrade: getHighestGrade(flashClimbs),
    averageSentGrade: getAverageGrade(sentClimbs),
    medianSentGrade: getMedianGrade(sentClimbs),
    workingGrade: calculateTopFortyPercentMedianWorkingGrade(sentClimbs),
    gradeHistogram: buildGradeHistogram(sentClimbs),
    gradePerformance: buildGradePerformanceBuckets(climbs),
    outcomeCounts: buildOutcomeCounts(climbs),
  }
}
