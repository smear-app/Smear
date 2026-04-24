import { describe, expect, it } from "vitest"
import type { Climb } from "../../../../lib/climbs"
import { buildSessionClimbsByStatsSessionId } from "../sessions/selectSessionClimbs"

function climb(id: string, overrides: Partial<Climb> = {}): Climb {
  return {
    id,
    user_id: "user-1",
    gym_id: "gym-1",
    gym_name: "Test Gym",
    gym_grade: "V4",
    gym_grade_value: 4,
    personal_grade: null,
    personal_grade_value: null,
    send_type: "send",
    tags: [],
    photo_url: null,
    climbColor: null,
    notes: null,
    canonical_climb_id: null,
    canonical_tags: [],
    session_id: null,
    session_started_at: null,
    created_at: "2026-04-01T10:00:00.000Z",
    ...overrides,
  }
}

describe("buildSessionClimbsByStatsSessionId", () => {
  it("groups explicit session climbs by the stats session id", () => {
    const climbs = Array.from({ length: 13 }, (_, index) =>
      climb(`explicit-${index}`, {
        session_id: "session-13",
        session_started_at: "2026-04-01T09:00:00.000Z",
        created_at: `2026-04-01T${String(10 + Math.floor(index / 2)).padStart(2, "0")}:${index % 2 === 0 ? "00" : "30"}:00.000Z`,
      }),
    )

    expect(buildSessionClimbsByStatsSessionId(climbs).get("session-13")?.map((entry) => entry.id)).toEqual(
      climbs.map((entry) => entry.id),
    )
  })

  it("keeps implicit fallback session ids for climbs without explicit sessions", () => {
    const climbs = [
      climb("implicit-1", { created_at: "2026-04-01T10:00:00.000Z" }),
      climb("implicit-2", { created_at: "2026-04-01T11:00:00.000Z" }),
    ]

    expect(buildSessionClimbsByStatsSessionId(climbs).get("gym-1:implicit-1")?.map((entry) => entry.id)).toEqual([
      "implicit-1",
      "implicit-2",
    ])
  })
})
