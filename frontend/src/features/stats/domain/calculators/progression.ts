import {
  bucketClimbsByWeek,
  filterSentClimbs,
  getAverageGrade,
  type EnrichedClimb,
} from "../primitives"
import { calculateTopFortyPercentMedianWorkingGrade } from "./shared"

export type ProgressionBucketMetrics = {
  key: string
  startAt: string
  endAt: string
  totalClimbs: number
  totalSentClimbs: number
  averageSentGrade: number | null
  workingGrade: number | null
}

export type ProgressionMetrics = {
  weekly: ProgressionBucketMetrics[]
}

function calculateProgressionBucketMetrics(bucket: {
  key: string
  startAt: string
  endAt: string
  climbs: readonly EnrichedClimb[]
}): ProgressionBucketMetrics {
  const sentClimbs = filterSentClimbs(bucket.climbs)

  return {
    key: bucket.key,
    startAt: bucket.startAt,
    endAt: bucket.endAt,
    totalClimbs: bucket.climbs.length,
    totalSentClimbs: sentClimbs.length,
    averageSentGrade: getAverageGrade(sentClimbs),
    workingGrade: calculateTopFortyPercentMedianWorkingGrade(sentClimbs),
  }
}

export function calculateProgressionMetrics(climbs: readonly EnrichedClimb[]): ProgressionMetrics {
  return {
    weekly: bucketClimbsByWeek(climbs).map(calculateProgressionBucketMetrics),
  }
}
