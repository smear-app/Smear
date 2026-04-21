import { describe, expect, it } from "vitest"
import {
  buildGradeHistogram,
  buildImplicitSessions,
  buildOutcomeCounts,
  buildTagCounts,
  bucketClimbsByWeek,
  filterAttemptClimbs,
  filterCompletedClimbs,
  filterFlashClimbs,
  filterSentClimbs,
  getAverageGrade,
  getHighestGrade,
  getMedianGrade,
  getWorkingGrade,
} from "../primitives"
import { climb, richStatsClimbs, tag } from "./fixtures"

describe("stats primitives", () => {
  it("filters sent, flash, attempt, and completed climbs consistently", () => {
    expect(filterSentClimbs(richStatsClimbs).map((item) => item.outcome)).toEqual(["flash", "send", "send", "send"])
    expect(filterFlashClimbs(richStatsClimbs)).toHaveLength(1)
    expect(filterAttemptClimbs(richStatsClimbs).map((item) => item.id)).toEqual([
      "week1-attempt-v8-crimp-dyno",
      "week2-attempt-null",
    ])
    expect(filterCompletedClimbs(richStatsClimbs)).toHaveLength(4)
  })

  it("ignores null grades and computes grade aggregates", () => {
    const climbs = [
      climb({ id: "v4", outcome: "send", gradeIndex: 4 }),
      climb({ id: "v6", outcome: "send", gradeIndex: 6 }),
      climb({ id: "null", outcome: "send", gradeIndex: null }),
    ]

    expect(getHighestGrade(climbs)).toBe(6)
    expect(getAverageGrade(climbs)).toBe(5)
    expect(getMedianGrade(climbs)).toBe(5)
    expect(getMedianGrade([...climbs, climb({ id: "v8", outcome: "send", gradeIndex: 8 })])).toBe(6)
  })

  it("computes working grade from sent climbs using top 40 percent true median", () => {
    const climbs = [
      climb({ id: "flash-v4", outcome: "flash", gradeIndex: 4 }),
      climb({ id: "send-v6-a", outcome: "send", gradeIndex: 6 }),
      climb({ id: "send-v6-b", outcome: "send", gradeIndex: 6 }),
      climb({ id: "send-v5", outcome: "send", gradeIndex: 5 }),
      climb({ id: "attempt-v9", outcome: "attempt", gradeIndex: 9 }),
    ]

    expect(getWorkingGrade(climbs, 40)).toBe(6)
    expect(getWorkingGrade(climbs.slice(0, 3), 40)).toBe(6)
    expect(getWorkingGrade([climb({ id: "only", outcome: "send", gradeIndex: 7 })], 40)).toBe(7)
    expect(getWorkingGrade([climb({ id: "attempt-only", outcome: "attempt", gradeIndex: 9 })], 40)).toBeNull()
  })

  it("uses a true midpoint median for even-sized working-grade subsets", () => {
    const climbs = [
      climb({ id: "v6", outcome: "send", gradeIndex: 6 }),
      climb({ id: "v5", outcome: "send", gradeIndex: 5 }),
      climb({ id: "v4", outcome: "send", gradeIndex: 4 }),
      climb({ id: "v3", outcome: "send", gradeIndex: 3 }),
      climb({ id: "v2", outcome: "send", gradeIndex: 2 }),
    ]

    expect(getWorkingGrade(climbs, 40)).toBe(5.5)
  })

  it("groups implicit sessions chronologically by gym and threshold", () => {
    const climbs = [
      climb({ id: "late", loggedAt: "2026-04-01T16:30:00.000Z", gymId: "gym-1" }),
      climb({ id: "first", loggedAt: "2026-04-01T10:00:00.000Z", gymId: "gym-1" }),
      climb({ id: "same-session", loggedAt: "2026-04-01T12:00:00.000Z", gymId: "gym-1" }),
      climb({ id: "other-gym", loggedAt: "2026-04-01T12:30:00.000Z", gymId: "gym-2" }),
    ]

    const sessions = buildImplicitSessions(climbs, 3 * 60 * 60 * 1000)
    expect(sessions.map((session) => session.climbIds)).toEqual([["first", "same-session"], ["other-gym"], ["late"]])
    expect(new Set(sessions.flatMap((session) => session.climbIds)).size).toBe(climbs.length)
    expect(sessions.every((session) => session.climbs.length > 0)).toBe(true)
  })

  it("builds grade histograms and outcome counts", () => {
    expect(buildGradeHistogram(richStatsClimbs).map((bucket) => [bucket.gradeIndex, bucket.count])).toEqual([
      [4, 1],
      [5, 1],
      [6, 1],
      [8, 1],
    ])
    expect(buildOutcomeCounts(richStatsClimbs)).toEqual({ flash: 1, send: 3, attempt: 2 })
  })

  it("buckets climbs by Monday-start weeks", () => {
    const buckets = bucketClimbsByWeek(richStatsClimbs)
    expect(buckets.map((bucket) => bucket.key)).toEqual(["2026-03-30", "2026-04-06"])
    expect(buckets.map((bucket) => bucket.climbs.length)).toEqual([3, 3])
    expect(bucketClimbsByWeek([])).toEqual([])
  })

  it("assigns all climbs in a session to the week of the local session start", () => {
    const sessionStartedAt = new Date(2026, 3, 19, 23, 30).toISOString()
    const climbs = [
      climb({
        id: "late-night-start",
        sessionId: "session-late",
        sessionStartedAt,
        loggedAt: sessionStartedAt,
        outcome: "send",
        gradeIndex: 4,
      }),
      climb({
        id: "after-midnight",
        sessionId: "session-late",
        sessionStartedAt,
        loggedAt: new Date(2026, 3, 20, 0, 30).toISOString(),
        outcome: "send",
        gradeIndex: 5,
      }),
    ]

    const buckets = bucketClimbsByWeek(climbs)

    expect(buckets).toHaveLength(1)
    expect(buckets[0].key).toBe("2026-04-13")
    expect(buckets[0].climbs.map((item) => item.id)).toEqual(["late-night-start", "after-midnight"])
  })

  it("uses session start rather than individual climb timestamps for weekly assignment", () => {
    const climbs = [
      climb({
        id: "session-start-week",
        sessionId: "session-spans-weeks",
        sessionStartedAt: new Date(2026, 3, 19, 22, 30).toISOString(),
        loggedAt: new Date(2026, 3, 19, 22, 30).toISOString(),
      }),
      climb({
        id: "next-week-climb",
        sessionId: "session-spans-weeks",
        sessionStartedAt: new Date(2026, 3, 19, 22, 30).toISOString(),
        loggedAt: new Date(2026, 3, 20, 1, 15).toISOString(),
      }),
    ]

    const buckets = bucketClimbsByWeek(climbs)

    expect(buckets.map((bucket) => bucket.key)).toEqual(["2026-04-13"])
    expect(buckets[0].climbs.map((item) => item.id)).toEqual(["session-start-week", "next-week-climb"])
  })

  it("uses local week boundaries instead of UTC week boundaries for session starts", () => {
    const sessionStartedAt = new Date(2026, 3, 19, 18, 0).toISOString()
    const buckets = bucketClimbsByWeek([
      climb({
        id: "local-sunday-evening",
        sessionId: "session-local-sunday",
        sessionStartedAt,
        loggedAt: sessionStartedAt,
      }),
    ])

    expect(buckets[0].key).toBe("2026-04-13")
  })

  it("counts tags by category and de-duplicates duplicate tags on one climb", () => {
    const counts = buildTagCounts(richStatsClimbs)
    expect(counts.find((item) => item.id === "crimp")).toMatchObject({ count: 3, category: "holdType" })
    expect(counts.find((item) => item.id === "sloper")).toMatchObject({ count: 1, category: "holdType" })
    expect(buildTagCounts([climb({ id: "no-tags", tags: [] })])).toEqual([])
    expect(buildTagCounts([climb({ id: "dupe", tags: [tag("crimp", "holdType"), tag("crimp", "holdType")] })])[0].count).toBe(1)
  })
})
