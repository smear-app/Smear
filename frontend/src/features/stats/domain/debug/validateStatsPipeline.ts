import {
  buildGradeHistogram,
  buildImplicitSessions,
  buildTagCounts,
  bucketClimbsByWeek,
  filterAttemptClimbs,
  filterFlashClimbs,
  filterSentClimbs,
  getAverageGrade,
  getGradeIndexes,
  getHighestGrade,
  getMedianGrade,
  getWorkingGrade,
  type ClimbOutcome,
  type EnrichedClimb,
  type TagCategory,
} from "../primitives"

const VALID_OUTCOMES = new Set<ClimbOutcome>(["flash", "send", "attempt"])
const VALID_TAG_CATEGORIES = new Set<TagCategory>(["holdType", "movement", "terrain", "mechanics"])

export type StatsPipelineValidationIssue = {
  code: string
  message: string
  climbId?: string
  details?: Record<string, unknown>
}

export type StatsPipelineValidationSection<TSummary> = {
  summary: TSummary
  issues: StatsPipelineValidationIssue[]
  ok: boolean
}

export type StatsPipelineValidationResult = {
  ok: boolean
  checkedAt: string
  outcome: StatsPipelineValidationSection<{
    totalClimbs: number
    totalSentClimbs: number
    totalFlashClimbs: number
    totalAttemptClimbs: number
  }>
  grades: StatsPipelineValidationSection<{
    validGradeCount: number
    nullGradeCount: number
    highestSentGrade: number | null
    averageSentGrade: number | null
    medianSentGrade: number | null
    workingGrade: number | null
  }>
  histogram: StatsPipelineValidationSection<{
    binCount: number
    histogramClimbCount: number
    sentClimbsWithValidGrades: number
  }>
  sessions: StatsPipelineValidationSection<{
    sessionCount: number
    sessionClimbCount: number
    uniqueSessionClimbCount: number
  }>
  tags: StatsPipelineValidationSection<{
    tagCount: number
  }>
  weeklyBuckets: StatsPipelineValidationSection<{
    bucketCount: number
    bucketClimbCount: number
  }>
}

type ValidationOptions = {
  thresholdMs?: number
  checkedAt?: string
}

function section<TSummary>(
  summary: TSummary,
  issues: readonly StatsPipelineValidationIssue[],
): StatsPipelineValidationSection<TSummary> {
  return {
    summary,
    issues: [...issues],
    ok: issues.length === 0,
  }
}

function getTimestamp(value: string): number {
  const timestamp = new Date(value).getTime()
  return Number.isFinite(timestamp) ? timestamp : Number.POSITIVE_INFINITY
}

function validateOutcome(climbs: readonly EnrichedClimb[]) {
  const sentClimbs = filterSentClimbs(climbs)
  const flashClimbs = filterFlashClimbs(climbs)
  const attemptClimbs = filterAttemptClimbs(climbs)
  const issues: StatsPipelineValidationIssue[] = []

  for (const climb of climbs) {
    if (!VALID_OUTCOMES.has(climb.outcome)) {
      issues.push({
        code: "invalid-outcome",
        message: "Climb has an unsupported normalized outcome.",
        climbId: climb.id,
        details: { outcome: climb.outcome },
      })
    }

    if (climb.isFlash && (!climb.isSend || climb.isAttempt || !climb.isCompleted || climb.outcome !== "flash")) {
      issues.push({
        code: "contradictory-flash-flags",
        message: "Flash climb flags are internally inconsistent.",
        climbId: climb.id,
      })
    }

    if (climb.outcome === "send" && (!climb.isSend || climb.isFlash || climb.isAttempt || !climb.isCompleted)) {
      issues.push({
        code: "contradictory-send-flags",
        message: "Send climb flags are internally inconsistent.",
        climbId: climb.id,
      })
    }

    if (climb.outcome === "attempt" && (climb.isSend || climb.isFlash || !climb.isAttempt || climb.isCompleted)) {
      issues.push({
        code: "contradictory-attempt-flags",
        message: "Attempt climb flags are internally inconsistent.",
        climbId: climb.id,
      })
    }
  }

  if (sentClimbs.length < flashClimbs.length) {
    issues.push({
      code: "sent-less-than-flash",
      message: "Sent climb count is lower than flash climb count.",
      details: { sentClimbs: sentClimbs.length, flashClimbs: flashClimbs.length },
    })
  }

  if (climbs.length !== sentClimbs.length + attemptClimbs.length) {
    issues.push({
      code: "outcome-total-mismatch",
      message: "Total climbs does not equal sent plus attempt climbs.",
      details: {
        totalClimbs: climbs.length,
        sentClimbs: sentClimbs.length,
        attemptClimbs: attemptClimbs.length,
      },
    })
  }

  return section(
    {
      totalClimbs: climbs.length,
      totalSentClimbs: sentClimbs.length,
      totalFlashClimbs: flashClimbs.length,
      totalAttemptClimbs: attemptClimbs.length,
    },
    issues,
  )
}

function validateGrades(climbs: readonly EnrichedClimb[]) {
  const sentClimbs = filterSentClimbs(climbs)
  const gradeIndexes = getGradeIndexes(climbs)
  const sentGradeIndexes = getGradeIndexes(sentClimbs)
  const issues: StatsPipelineValidationIssue[] = []

  for (const climb of climbs) {
    if (typeof climb.gradeIndex === "number" && !Number.isFinite(climb.gradeIndex)) {
      issues.push({
        code: "invalid-grade-index",
        message: "Climb has a non-finite numeric grade index.",
        climbId: climb.id,
        details: { gradeIndex: climb.gradeIndex },
      })
    }
  }

  const highestSentGrade = getHighestGrade(sentClimbs)
  const averageSentGrade = getAverageGrade(sentClimbs)
  const medianSentGrade = getMedianGrade(sentClimbs)
  const workingGrade = getWorkingGrade(sentClimbs, 40)

  if (sentGradeIndexes.length > 0 && highestSentGrade === null) {
    issues.push({
      code: "missing-highest-sent-grade",
      message: "Sent climbs have valid grades, but highest grade is null.",
    })
  }

  if (sentGradeIndexes.length === 0 && [highestSentGrade, averageSentGrade, medianSentGrade, workingGrade].some(Boolean)) {
    issues.push({
      code: "unexpected-grade-metric",
      message: "Grade metrics should be null when no sent climbs have valid grades.",
    })
  }

  return section(
    {
      validGradeCount: gradeIndexes.length,
      nullGradeCount: climbs.length - gradeIndexes.length,
      highestSentGrade,
      averageSentGrade,
      medianSentGrade,
      workingGrade,
    },
    issues,
  )
}

function validateHistogram(climbs: readonly EnrichedClimb[]) {
  const sentClimbs = filterSentClimbs(climbs)
  const histogram = buildGradeHistogram(sentClimbs)
  const sentClimbsWithValidGrades = getGradeIndexes(sentClimbs).length
  const histogramClimbCount = histogram.reduce((sum, bucket) => sum + bucket.count, 0)
  const issues: StatsPipelineValidationIssue[] = []

  if (histogramClimbCount !== sentClimbsWithValidGrades) {
    issues.push({
      code: "histogram-count-mismatch",
      message: "Histogram counts do not sum to sent climbs with valid grades.",
      details: { histogramClimbCount, sentClimbsWithValidGrades },
    })
  }

  for (let index = 0; index < histogram.length; index += 1) {
    const bucket = histogram[index]
    const previousBucket = histogram[index - 1]

    if (bucket.count < 0) {
      issues.push({
        code: "negative-histogram-count",
        message: "Histogram bucket count is negative.",
        details: { gradeIndex: bucket.gradeIndex, count: bucket.count },
      })
    }

    if (previousBucket && bucket.gradeIndex < previousBucket.gradeIndex) {
      issues.push({
        code: "histogram-sort-order",
        message: "Histogram buckets are not sorted ascending by grade.",
      })
    }
  }

  return section(
    {
      binCount: histogram.length,
      histogramClimbCount,
      sentClimbsWithValidGrades,
    },
    issues,
  )
}

function validateSessions(climbs: readonly EnrichedClimb[], thresholdMs?: number) {
  const sessions = buildImplicitSessions(climbs, thresholdMs)
  const issues: StatsPipelineValidationIssue[] = []
  const sessionClimbIds = sessions.flatMap((session) => session.climbIds)
  const uniqueSessionClimbIds = new Set(sessionClimbIds)

  for (const session of sessions) {
    if (session.climbs.length === 0 || session.climbIds.length === 0) {
      issues.push({
        code: "empty-session",
        message: "Implicit session has no climbs.",
        details: { sessionId: session.id },
      })
    }
  }

  if (sessionClimbIds.length !== climbs.length) {
    issues.push({
      code: "session-climb-count-mismatch",
      message: "Total climbs across sessions does not equal input climb count.",
      details: { sessionClimbCount: sessionClimbIds.length, totalClimbs: climbs.length },
    })
  }

  if (uniqueSessionClimbIds.size !== sessionClimbIds.length) {
    issues.push({
      code: "duplicated-session-climb",
      message: "At least one climb appears in more than one implicit session.",
    })
  }

  for (const climb of climbs) {
    if (!uniqueSessionClimbIds.has(climb.id)) {
      issues.push({
        code: "missing-session-climb",
        message: "Input climb does not appear in any implicit session.",
        climbId: climb.id,
      })
    }
  }

  for (let index = 1; index < sessions.length; index += 1) {
    if (getTimestamp(sessions[index].startAt) < getTimestamp(sessions[index - 1].startAt)) {
      issues.push({
        code: "session-sort-order",
        message: "Implicit sessions are not chronologically ordered.",
      })
      break
    }
  }

  return section(
    {
      sessionCount: sessions.length,
      sessionClimbCount: sessionClimbIds.length,
      uniqueSessionClimbCount: uniqueSessionClimbIds.size,
    },
    issues,
  )
}

function validateTags(climbs: readonly EnrichedClimb[]) {
  const tagCounts = buildTagCounts(climbs)
  const issues: StatsPipelineValidationIssue[] = []

  for (const tagCount of tagCounts) {
    if (tagCount.count < 0) {
      issues.push({
        code: "negative-tag-count",
        message: "Tag count is negative.",
        details: { tagId: tagCount.id, count: tagCount.count },
      })
    }

    if (tagCount.category !== null && !VALID_TAG_CATEGORIES.has(tagCount.category)) {
      issues.push({
        code: "invalid-tag-category",
        message: "Tag has an unsupported category.",
        details: { tagId: tagCount.id, category: tagCount.category },
      })
    }
  }

  return section({ tagCount: tagCounts.length }, issues)
}

function validateWeeklyBuckets(climbs: readonly EnrichedClimb[]) {
  const buckets = bucketClimbsByWeek(climbs)
  const bucketClimbCount = buckets.reduce((sum, bucket) => sum + bucket.climbs.length, 0)
  const issues: StatsPipelineValidationIssue[] = []

  if (bucketClimbCount !== climbs.length) {
    issues.push({
      code: "weekly-bucket-count-mismatch",
      message: "Total climbs across weekly buckets does not equal input climb count.",
      details: { bucketClimbCount, totalClimbs: climbs.length },
    })
  }

  for (let index = 0; index < buckets.length; index += 1) {
    const bucket = buckets[index]
    const previousBucket = buckets[index - 1]

    if (bucket.climbs.length === 0) {
      issues.push({
        code: "empty-weekly-bucket",
        message: "Weekly bucket has no climbs.",
        details: { bucketKey: bucket.key },
      })
    }

    if (previousBucket && bucket.startAt < previousBucket.startAt) {
      issues.push({
        code: "weekly-bucket-sort-order",
        message: "Weekly buckets are not sorted ascending by start time.",
      })
    }
  }

  return section({ bucketCount: buckets.length, bucketClimbCount }, issues)
}

export function validateStatsPipeline(
  climbs: readonly EnrichedClimb[],
  options: ValidationOptions = {},
): StatsPipelineValidationResult {
  const outcome = validateOutcome(climbs)
  const grades = validateGrades(climbs)
  const histogram = validateHistogram(climbs)
  const sessions = validateSessions(climbs, options.thresholdMs)
  const tags = validateTags(climbs)
  const weeklyBuckets = validateWeeklyBuckets(climbs)
  const sections = [outcome, grades, histogram, sessions, tags, weeklyBuckets]

  return {
    ok: sections.every((validationSection) => validationSection.ok),
    checkedAt: options.checkedAt ?? new Date().toISOString(),
    outcome,
    grades,
    histogram,
    sessions,
    tags,
    weeklyBuckets,
  }
}
