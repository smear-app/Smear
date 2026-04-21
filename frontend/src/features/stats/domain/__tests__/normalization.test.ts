import { describe, expect, it } from "vitest"
import {
  normalizeCanonicalTagGroups,
  normalizeClimb,
  normalizeGrade,
  normalizeOutcome,
  normalizeTags,
  prepareEnrichedClimbs,
} from "../base"
import type { RawStatsClimb, StatsBaseData } from "../base"

const rawClimb: RawStatsClimb = {
  id: "raw-1",
  user_id: "user-1",
  gym_id: "gym-1",
  gym_name: null,
  gym_grade: "V5",
  gym_grade_value: 5,
  personal_grade: null,
  personal_grade_value: null,
  send_type: "flash",
  tags: ["Crimp", "Slab", "Unknown Tag"],
  photo_url: null,
  hold_color: "blue",
  notes: "good climb",
  canonical_climb_id: "canonical-1",
  canonical_tags: ["Crimp", "Slab", "Balance"],
  session_id: "session-1",
  session_started_at: "2026-04-01T09:30:00.000Z",
  created_at: "2026-04-01T10:00:00.000Z",
}

describe("stats normalization", () => {
  it("normalizes outcome flags from raw send_type", () => {
    expect(normalizeOutcome("flash")).toEqual({
      outcome: "flash",
      isSend: true,
      isFlash: true,
      isAttempt: false,
      isCompleted: true,
    })
    expect(normalizeOutcome("send")).toMatchObject({ outcome: "send", isSend: true, isFlash: false })
    expect(normalizeOutcome("anything-else")).toMatchObject({
      outcome: "attempt",
      isSend: false,
      isAttempt: true,
      isCompleted: false,
    })
  })

  it("normalizes grades without turning unknown grades into V0", () => {
    expect(normalizeGrade("V6", 6)).toEqual({ gradeLabel: "V6", gradeIndex: 6 })
    expect(normalizeGrade("V10+", null)).toEqual({ gradeLabel: "V10+", gradeIndex: 11 })
    expect(normalizeGrade("mystery", null)).toEqual({ gradeLabel: "mystery", gradeIndex: null })
    expect(normalizeGrade(null, null)).toEqual({ gradeLabel: null, gradeIndex: null })
  })

  it("normalizes tags with category metadata and preserves unknown tags as uncategorized", () => {
    expect(normalizeTags(["Crimp", "Slab", "Crimp", "Mystery"])).toEqual([
      { id: "crimp", name: "crimp", category: "holdType" },
      { id: "slab", name: "slab", category: "terrain" },
      { id: "mystery", name: "mystery", category: null },
    ])
  })

  it("normalizes canonical tags into grouped top-tag attribution", () => {
    expect(normalizeCanonicalTagGroups(["Crimp", "Slab", "Balance", "Unknown"])).toEqual({
      holdType: [{ id: "crimp", name: "crimp", category: "holdType" }],
      movement: [],
      terrain: [{ id: "slab", name: "slab", category: "terrain" }],
      mechanics: [{ id: "balance", name: "balance", category: "mechanics" }],
    })
  })

  it("normalizes raw climbs into EnrichedClimb using lightweight gym fallback data", () => {
    const enriched = normalizeClimb(rawClimb, new Map([["gym-1", "Fallback Gym"]]))

    expect(enriched).toMatchObject({
      id: "raw-1",
      userId: "user-1",
      gymId: "gym-1",
      gymName: "Fallback Gym",
      canonicalClimbId: "canonical-1",
      sessionId: "session-1",
      sessionStartedAt: "2026-04-01T09:30:00.000Z",
      loggedAt: "2026-04-01T10:00:00.000Z",
      completedAt: "2026-04-01T10:00:00.000Z",
      gradeLabel: "V5",
      gradeIndex: 5,
      color: "blue",
      outcome: "flash",
      isSend: true,
      isFlash: true,
      isAttempt: false,
      isCompleted: true,
      canonicalTags: {
        holdType: [{ id: "crimp", name: "crimp", category: "holdType" }],
        movement: [],
        terrain: [{ id: "slab", name: "slab", category: "terrain" }],
        mechanics: [{ id: "balance", name: "balance", category: "mechanics" }],
      },
      notes: "good climb",
    })
  })

  it("prepares enriched climbs from stats base data", () => {
    const statsBase: StatsBaseData = {
      climbs: [rawClimb],
      gyms: [{ id: "gym-1", name: "Fallback Gym" }],
    }

    expect(prepareEnrichedClimbs(statsBase)[0].gymName).toBe("Fallback Gym")
  })
})
