import { describe, expect, it } from "vitest"
import type { SessionMetrics } from "../calculators/sessions"
import { classifySessionInsight, selectSessionInsightBaseline } from "../sessions/sessionInsightClassifier"

function session(
  id: string,
  day: number,
  overrides: Partial<SessionMetrics> = {},
): SessionMetrics {
  const totalClimbs = overrides.totalClimbs ?? 10
  const totalSentClimbs = overrides.totalSentClimbs ?? 6

  return {
    sessionId: id,
    gymId: "gym-1",
    gymName: "Test Gym",
    startAt: `2026-04-${String(day).padStart(2, "0")}T10:00:00.000Z`,
    endAt: `2026-04-${String(day).padStart(2, "0")}T11:00:00.000Z`,
    durationMs: 60 * 60 * 1000,
    totalClimbs,
    totalSentClimbs,
    totalFlashClimbs: overrides.totalFlashClimbs ?? 2,
    totalAttemptClimbs: overrides.totalAttemptClimbs ?? totalClimbs - totalSentClimbs,
    flashRate: overrides.flashRate ?? 1 / 3,
    sentRate: overrides.sentRate ?? totalSentClimbs / totalClimbs,
    highestGrade: overrides.highestGrade ?? 6,
    averageSentGrade: overrides.averageSentGrade ?? 4.8,
    medianSentGrade: overrides.medianSentGrade ?? 5,
    workingGrade: overrides.workingGrade ?? 5,
    gradeHistogram: overrides.gradeHistogram ?? [],
    outcomeCounts: overrides.outcomeCounts ?? { flash: 2, send: totalSentClimbs - 2, attempt: totalClimbs - totalSentClimbs },
    attemptsPerSend: overrides.attemptsPerSend ?? totalClimbs / totalSentClimbs,
    completionRate: overrides.completionRate ?? totalSentClimbs / totalClimbs,
    distinctStyleCount: overrides.distinctStyleCount ?? 3,
    persistedInsight: overrides.persistedInsight ?? null,
    ...overrides,
  }
}

function baseline(overrides: Partial<SessionMetrics> = {}) {
  return Array.from({ length: 5 }, (_, index) =>
    session(`baseline-${index}`, index + 1, {
      totalClimbs: 10,
      totalSentClimbs: 6,
      workingGrade: 5,
      highestGrade: 6,
      attemptsPerSend: 10 / 6,
      completionRate: 0.6,
      distinctStyleCount: 3,
      ...overrides,
    }),
  )
}

function classify(target: SessionMetrics, prior = baseline()) {
  return classifySessionInsight(target, selectSessionInsightBaseline(target, [...prior, target]))
}

describe("session insight classifier", () => {
  it("uses invalid-session insight when the selected session has one climb", () => {
    const target = session("target", 6, { totalClimbs: 1, totalSentClimbs: 1 })

    expect(classify(target)).toEqual({
      label: "Not enough activity",
      reason: "More climbs needed for insight",
    })
  })

  it("uses invalid-session insight when the selected session has two climbs", () => {
    const target = session("target", 6, { totalClimbs: 2, totalSentClimbs: 1 })

    expect(classify(target)).toEqual({
      label: "Not enough activity",
      reason: "More climbs needed for insight",
    })
  })

  it("uses building baseline for a valid selected session with fewer than five prior valid sessions", () => {
    const target = session("target", 6, { totalClimbs: 12 })

    expect(classify(target, baseline().slice(0, 4))).toEqual({
      label: "Building baseline",
      reason: "More sessions needed",
    })
  })

  it("classifies high-climb sessions as volume", () => {
    expect(classify(session("target", 6, { totalClimbs: 13, totalSentClimbs: 8 }))).toMatchObject({
      label: "Volume session",
      reason: "+30% climbs",
    })
  })

  it("classifies high working grade without a new max as performance", () => {
    expect(classify(session("target", 6, { workingGrade: 5.8, highestGrade: 6 }))).toMatchObject({
      label: "Performance session",
      reason: "+0.8 V working grade",
    })
  })

  it("classifies moderate working-grade increase with a genuine new max as performance", () => {
    expect(classify(session("target", 6, { workingGrade: 5.5, highestGrade: 7 }))).toMatchObject({
      label: "Performance session",
      reason: "+0.5 V working grade",
    })
  })

  it("classifies high attempts per send as projecting", () => {
    expect(classify(session("target", 6, { attemptsPerSend: 2.4, completionRate: 0.42 }))).toMatchObject({
      label: "Projecting session",
      reason: "+0.7 attempts/send",
    })
  })

  it("classifies high completion rate as efficiency", () => {
    expect(classify(session("target", 6, { totalClimbs: 10, totalSentClimbs: 8, completionRate: 0.8 }))).toMatchObject({
      label: "Efficiency session",
      reason: "+20% completion rate",
    })
  })

  it("classifies genuinely broader style variety as exploration", () => {
    expect(classify(session("target", 6, { distinctStyleCount: 6 }))).toMatchObject({
      label: "Exploration session",
      reason: "+3 styles",
    })
  })

  it("falls back to consistent when no signal clears threshold", () => {
    expect(classify(session("target", 6, { totalClimbs: 10, workingGrade: 5.1, distinctStyleCount: 3 }))).toMatchObject({
      label: "Consistent session",
      reason: "Near baseline",
    })
  })
})
