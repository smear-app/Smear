import { describe, expect, it } from "vitest"
import {
  archetypeTimeframeOptions,
  defaultArchetypeTimeframe,
  filterClimbsForArchetypeTimeframe,
} from "../archetype/timeframes"
import { climb } from "./fixtures"

const NOW = new Date("2026-04-22T12:00:00.000Z")

function daysAgo(days: number) {
  return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000).toISOString()
}

describe("archetype timeframes", () => {
  it("defaults to 30 days with exactly two options", () => {
    expect(defaultArchetypeTimeframe).toBe("30-days")
    expect(archetypeTimeframeOptions).toEqual([
      { value: "30-days", label: "30 Days" },
      { value: "all-time", label: "All Time" },
    ])
  })

  it("filters 30-day archetype climbs in memory", () => {
    const recent = climb({ id: "recent", loggedAt: daysAgo(5) })
    const boundary = climb({ id: "boundary", loggedAt: daysAgo(30) })
    const old = climb({ id: "old", loggedAt: daysAgo(31) })

    expect(filterClimbsForArchetypeTimeframe([recent, boundary, old], "30-days", NOW).map((item) => item.id)).toEqual([
      "recent",
      "boundary",
    ])
  })

  it("preserves all-time archetype input behavior", () => {
    const climbs = [
      climb({ id: "recent", loggedAt: daysAgo(5) }),
      climb({ id: "old", loggedAt: daysAgo(300) }),
    ]

    expect(filterClimbsForArchetypeTimeframe(climbs, "all-time", NOW)).toEqual(climbs)
  })
})
