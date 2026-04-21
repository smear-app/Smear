import type { CanonicalTagGroups, ClimbOutcome, EnrichedClimb, EnrichedTag, TagCategory } from "../primitives"

export function tag(id: string, category: TagCategory): EnrichedTag {
  return { id, name: id, category }
}

export function canonicalTags(overrides: Partial<CanonicalTagGroups> = {}): CanonicalTagGroups {
  return {
    holdType: [],
    movement: [],
    terrain: [],
    mechanics: [],
    ...overrides,
  }
}

export function climb(overrides: Partial<EnrichedClimb> & Pick<EnrichedClimb, "id">): EnrichedClimb {
  const outcome: ClimbOutcome = overrides.outcome ?? "send"
  const isFlash = outcome === "flash"
  const isSend = outcome === "send" || isFlash
  const loggedAt = overrides.loggedAt ?? "2026-04-01T10:00:00.000Z"

  return {
    id: overrides.id,
    userId: overrides.userId ?? "user-1",
    gymId: overrides.gymId ?? "gym-1",
    gymName: overrides.gymName ?? "Test Gym",
    canonicalClimbId: overrides.canonicalClimbId ?? null,
    sessionId: overrides.sessionId ?? null,
    sessionStartedAt: overrides.sessionStartedAt ?? null,
    loggedAt,
    completedAt: overrides.completedAt ?? (isSend ? loggedAt : null),
    gradeLabel: overrides.gradeLabel ?? (typeof overrides.gradeIndex === "number" ? `V${overrides.gradeIndex}` : null),
    gradeIndex: overrides.gradeIndex ?? null,
    color: overrides.color ?? null,
    outcome,
    isSend,
    isFlash,
    isAttempt: outcome === "attempt",
    isCompleted: isSend,
    tags: overrides.tags ?? [],
    canonicalTags: overrides.canonicalTags ?? canonicalTags(),
    notes: overrides.notes ?? null,
  }
}

export const richStatsClimbs: EnrichedClimb[] = [
  climb({
    id: "week1-flash-v4-crimp-slab",
    outcome: "flash",
    gradeIndex: 4,
    loggedAt: "2026-04-01T10:00:00.000Z",
    tags: [tag("crimp", "holdType"), tag("slab", "terrain")],
    canonicalTags: canonicalTags({
      holdType: [tag("crimp", "holdType")],
      terrain: [tag("slab", "terrain")],
    }),
  }),
  climb({
    id: "week1-send-v6-crimp-sloper-overhang",
    outcome: "send",
    gradeIndex: 6,
    loggedAt: "2026-04-01T11:00:00.000Z",
    tags: [tag("crimp", "holdType"), tag("sloper", "holdType"), tag("overhang", "terrain")],
    canonicalTags: canonicalTags({
      holdType: [tag("crimp", "holdType"), tag("sloper", "holdType")],
      terrain: [tag("overhang", "terrain")],
    }),
  }),
  climb({
    id: "week1-attempt-v8-crimp-dyno",
    outcome: "attempt",
    gradeIndex: 8,
    loggedAt: "2026-04-01T12:00:00.000Z",
    tags: [tag("crimp", "holdType"), tag("dyno", "mechanics")],
    canonicalTags: canonicalTags({
      holdType: [tag("crimp", "holdType")],
      mechanics: [tag("dyno", "mechanics")],
    }),
  }),
  climb({
    id: "week2-send-v5-dynamic",
    outcome: "send",
    gradeIndex: 5,
    loggedAt: "2026-04-08T10:00:00.000Z",
    tags: [tag("dynamic", "movement")],
    canonicalTags: canonicalTags({
      movement: [tag("dynamic", "movement")],
    }),
  }),
  climb({
    id: "week2-send-null",
    outcome: "send",
    gradeIndex: null,
    loggedAt: "2026-04-08T11:00:00.000Z",
  }),
  climb({
    id: "week2-attempt-null",
    outcome: "attempt",
    gradeIndex: null,
    loggedAt: "2026-04-08T12:00:00.000Z",
    gymId: "gym-2",
    gymName: "Other Gym",
  }),
]
