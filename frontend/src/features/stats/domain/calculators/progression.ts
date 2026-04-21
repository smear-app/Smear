import {
  buildImplicitSessions,
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
  totalSessions: number
  highestSentGrade: number | null
  averageSentGrade: number | null
  workingGrade: number | null
}

export type ProgressionMetrics = {
  weekly: ProgressionBucketMetrics[]
}

function countSessions(climbs: readonly EnrichedClimb[]): number {
  const explicitSessionIds = new Set(climbs.flatMap((climb) => (climb.sessionId ? [climb.sessionId] : [])))
  const climbsWithoutSessionId = climbs.filter((climb) => !climb.sessionId)

  return explicitSessionIds.size + buildImplicitSessions(climbsWithoutSessionId).length
}

function calculateProgressionBucketMetrics(bucket: {
  key: string
  startAt: string
  endAt: string
  climbs: readonly EnrichedClimb[]
}): ProgressionBucketMetrics {
  const sentClimbs = filterSentClimbs(bucket.climbs)
  const sentGradeIndexes = sentClimbs.flatMap((climb) =>
    typeof climb.gradeIndex === "number" && Number.isFinite(climb.gradeIndex) ? [climb.gradeIndex] : [],
  )

  return {
    key: bucket.key,
    startAt: bucket.startAt,
    endAt: bucket.endAt,
    totalClimbs: bucket.climbs.length,
    totalSentClimbs: sentClimbs.length,
    totalSessions: countSessions(bucket.climbs),
    highestSentGrade: sentGradeIndexes.length === 0 ? null : Math.max(...sentGradeIndexes),
    averageSentGrade: getAverageGrade(sentClimbs),
    workingGrade: calculateTopFortyPercentMedianWorkingGrade(sentClimbs),
  }
}

export function calculateProgressionMetrics(climbs: readonly EnrichedClimb[]): ProgressionMetrics {
  return {
    weekly: bucketClimbsByWeek(climbs).map(calculateProgressionBucketMetrics),
  }
}
