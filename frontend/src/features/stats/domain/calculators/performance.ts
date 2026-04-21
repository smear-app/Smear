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
  totalSentClimbs: number
  totalFlashClimbs: number
  totalAttemptClimbs: number
  flashRate: number
  highestGrade: number | null
  averageSentGrade: number | null
  medianSentGrade: number | null
  workingGrade: number | null
  gradeHistogram: GradeHistogramBucket[]
  outcomeCounts: OutcomeCounts
}

export function calculatePerformanceMetrics(climbs: readonly EnrichedClimb[]): PerformanceMetrics {
  const sentClimbs = filterSentClimbs(climbs)
  const flashClimbs = filterFlashClimbs(climbs)
  const attemptClimbs = filterAttemptClimbs(climbs)

  return {
    totalClimbs: climbs.length,
    totalSentClimbs: sentClimbs.length,
    totalFlashClimbs: flashClimbs.length,
    totalAttemptClimbs: attemptClimbs.length,
    flashRate: safeDivide(flashClimbs.length, sentClimbs.length),
    highestGrade: getHighestGrade(sentClimbs),
    averageSentGrade: getAverageGrade(sentClimbs),
    medianSentGrade: getMedianGrade(sentClimbs),
    workingGrade: calculateTopFortyPercentMedianWorkingGrade(sentClimbs),
    gradeHistogram: buildGradeHistogram(sentClimbs),
    outcomeCounts: buildOutcomeCounts(climbs),
  }
}
