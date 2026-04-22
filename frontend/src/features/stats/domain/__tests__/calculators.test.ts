import { describe, expect, it } from "vitest"
import { calculateArchetypeMetrics, calculatePerformanceMetrics, calculateProgressionMetrics, calculateSessionMetrics } from "../calculators"
import { canonicalTags, climb, richStatsClimbs, tag } from "./fixtures"

describe("stats calculators", () => {
  it("computes performance metrics from sent climbs where appropriate", () => {
    const metrics = calculatePerformanceMetrics(richStatsClimbs)

    expect(metrics.totalClimbs).toBe(6)
    expect(metrics.totalAttempts).toBe(6)
    expect(metrics.totalSentClimbs).toBe(4)
    expect(metrics.totalFlashClimbs).toBe(1)
    expect(metrics.totalAttemptClimbs).toBe(2)
    expect(metrics.flashRate).toBe(0.25)
    expect(metrics.averageAttemptsPerSend).toBe(1.5)
    expect(metrics.highestGrade).toBe(6)
    expect(metrics.highestFlashGrade).toBe(4)
    expect(metrics.averageSentGrade).toBe(5)
    expect(metrics.medianSentGrade).toBe(5)
    expect(metrics.workingGrade).toBe(5.5)
    expect(metrics.gradeHistogram.map((bucket) => [bucket.gradeIndex, bucket.count])).toEqual([
      [4, 1],
      [5, 1],
      [6, 1],
    ])
    expect(metrics.gradePerformance.map((bucket) => [bucket.gradeIndex, bucket.totalClimbs, bucket.sentClimbs, bucket.sendRate])).toEqual([
      [4, 1, 1, 1],
      [5, 1, 1, 1],
      [6, 1, 1, 1],
      [8, 1, 0, 0],
    ])
    expect(metrics.outcomeCounts).toEqual({ flash: 1, send: 3, attempt: 2 })
  })

  it("handles performance zero denominators and only-attempt datasets", () => {
    const metrics = calculatePerformanceMetrics([climb({ id: "attempt", outcome: "attempt", gradeIndex: 9 })])

    expect(metrics.flashRate).toBe(0)
    expect(metrics.averageAttemptsPerSend).toBe(0)
    expect(metrics.highestGrade).toBeNull()
    expect(metrics.highestFlashGrade).toBeNull()
    expect(metrics.workingGrade).toBeNull()
    expect(metrics.gradeHistogram).toEqual([])
  })

  it("computes weekly progression metrics without synthesizing empty weeks", () => {
    const metrics = calculateProgressionMetrics(richStatsClimbs)

    expect(metrics.weekly).toHaveLength(2)
    expect(metrics.weekly.map((bucket) => bucket.key)).toEqual(["2026-03-30", "2026-04-06"])
    expect(metrics.weekly[0]).toMatchObject({
      totalClimbs: 3,
      totalSentClimbs: 2,
      totalSessions: 1,
      highestSentGrade: 6,
      averageSentGrade: 5,
      workingGrade: 6,
    })
    expect(metrics.weekly[1]).toMatchObject({
      totalClimbs: 3,
      totalSentClimbs: 2,
      totalSessions: 2,
      highestSentGrade: 5,
      averageSentGrade: 5,
      workingGrade: 5,
    })
  })

  it("counts progression sessions from explicit session ids and implicit no-id sessions", () => {
    const metrics = calculateProgressionMetrics([
      climb({
        id: "explicit-a",
        sessionId: "session-1",
        sessionStartedAt: "2026-04-06T18:00:00.000Z",
        loggedAt: "2026-04-06T18:10:00.000Z",
      }),
      climb({
        id: "explicit-b",
        sessionId: "session-1",
        sessionStartedAt: "2026-04-06T18:00:00.000Z",
        loggedAt: "2026-04-06T18:20:00.000Z",
      }),
      climb({
        id: "implicit-a",
        loggedAt: "2026-04-07T18:00:00.000Z",
      }),
      climb({
        id: "implicit-b",
        loggedAt: "2026-04-07T19:00:00.000Z",
      }),
      climb({
        id: "implicit-late",
        loggedAt: "2026-04-08T00:00:00.000Z",
      }),
    ])

    expect(metrics.weekly).toHaveLength(1)
    expect(metrics.weekly[0]).toMatchObject({
      totalClimbs: 5,
      totalSessions: 3,
    })
  })

  it("computes session metrics, baselines, and comparisons", () => {
    const metrics = calculateSessionMetrics(richStatsClimbs)

    expect(metrics.sessions).toHaveLength(3)
    expect(metrics.allTimeBaseline).toMatchObject({
      averageTotalClimbs: 2,
      averageSentClimbs: 4 / 3,
      averageSentRate: (2 / 3 + 1 + 0) / 3,
    })
    expect(metrics.sessions[0].session).toMatchObject({
      totalClimbs: 3,
      totalSentClimbs: 2,
      totalFlashClimbs: 1,
      totalAttemptClimbs: 1,
      flashRate: 0.5,
      sentRate: 2 / 3,
      highestGrade: 6,
      averageSentGrade: 5,
      medianSentGrade: 5,
      workingGrade: 6,
      durationMs: 2 * 60 * 60 * 1000,
    })
    expect(metrics.sessions[0].comparisonToAllTimeBaseline?.totalClimbsDelta).toBe(1)
    expect(metrics.sessions[0].comparisonToAllTimeBaseline?.sentClimbsDelta).toBeCloseTo(2 / 3)
  })

  it("handles session empty input and zero baselines safely", () => {
    expect(calculateSessionMetrics([])).toEqual({ allTimeBaseline: null, sessions: [] })

    const metrics = calculateSessionMetrics([climb({ id: "attempt", outcome: "attempt", gradeIndex: null })])
    expect(metrics.allTimeBaseline?.averageSentClimbs).toBe(0)
    expect(metrics.sessions[0].comparisonToAllTimeBaseline?.sentClimbsDeltaRatio).toBeNull()
  })

  it("computes raw archetype metrics with volume and sent-grade signals separated", () => {
    const metrics = calculateArchetypeMetrics(richStatsClimbs)
    const crimp = metrics.holdType.find((metric) => metric.tagKey === "crimp")
    const sloper = metrics.holdType.find((metric) => metric.tagKey === "sloper")
    const dyno = metrics.mechanics.find((metric) => metric.tagKey === "dyno")

    expect(Object.keys(metrics)).toEqual(["holdType", "movement", "terrain", "mechanics"])
    expect(metrics.holdType).toHaveLength(7)
    expect(crimp).toMatchObject({
      climbCount: 3,
      climbShare: 0.75,
      sentCount: 2,
      averageSentGrade: 5,
      medianSentGrade: 5,
      workingGrade: 6,
    })
    expect(sloper).toMatchObject({ climbCount: 1, climbShare: 0.25, sentCount: 1, workingGrade: 6 })
    expect(dyno).toMatchObject({
      climbCount: 1,
      sentCount: 0,
      averageSentGrade: null,
      medianSentGrade: null,
      workingGrade: null,
    })
  })

  it("handles multi-tag category attribution and untagged climbs", () => {
    const metrics = calculateArchetypeMetrics([
      climb({
        id: "multi",
        outcome: "send",
        gradeIndex: 5,
        tags: [tag("crimp", "holdType"), tag("sloper", "holdType")],
        canonicalTags: canonicalTags({
          holdType: [tag("crimp", "holdType"), tag("sloper", "holdType")],
        }),
      }),
      climb({ id: "untagged", outcome: "send", gradeIndex: 7, tags: [] }),
    ])

    expect(metrics.holdType.find((metric) => metric.tagKey === "crimp")?.climbShare).toBe(0.5)
    expect(metrics.holdType.find((metric) => metric.tagKey === "sloper")?.climbShare).toBe(0.5)
    expect(metrics.movement.every((metric) => metric.climbCount === 0 && metric.climbShare === 0)).toBe(true)
  })

  it("uses canonical tags for archetype attribution instead of user-entered log tags", () => {
    const metrics = calculateArchetypeMetrics([
      climb({
        id: "canonical-overrides-user-tags",
        outcome: "send",
        gradeIndex: 5,
        tags: [tag("jug", "holdType"), tag("cave", "terrain")],
        canonicalTags: canonicalTags({
          holdType: [tag("crimp", "holdType")],
          terrain: [tag("slab", "terrain")],
        }),
      }),
    ])

    expect(metrics.holdType.find((metric) => metric.tagKey === "crimp")?.climbCount).toBe(1)
    expect(metrics.holdType.find((metric) => metric.tagKey === "jug")?.climbCount).toBe(0)
    expect(metrics.terrain.find((metric) => metric.tagKey === "slab")?.climbCount).toBe(1)
    expect(metrics.terrain.find((metric) => metric.tagKey === "cave")?.climbCount).toBe(0)
  })

  it("falls back to logged tags when canonical archetype tags are empty", () => {
    const metrics = calculateArchetypeMetrics([
      climb({
        id: "logged-tags-only",
        outcome: "send",
        gradeIndex: 4,
        tags: [tag("crimp", "holdType"), tag("slab", "terrain")],
        canonicalTags: canonicalTags(),
      }),
    ])

    expect(metrics.holdType.find((metric) => metric.tagKey === "crimp")).toMatchObject({
      climbCount: 1,
      sentCount: 1,
      workingGrade: 4,
    })
    expect(metrics.terrain.find((metric) => metric.tagKey === "slab")).toMatchObject({
      climbCount: 1,
      sentCount: 1,
      workingGrade: 4,
    })
  })
})
