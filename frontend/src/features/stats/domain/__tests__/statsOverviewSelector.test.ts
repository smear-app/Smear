import { describe, expect, it } from "vitest"
import { selectStatsOverviewViewModel } from "../overview/selectStatsOverviewViewModel"
import { canonicalTags, climb, tag } from "./fixtures"

const NOW = "2026-04-22T12:00:00.000Z"

function daysAgo(days: number) {
  return new Date(new Date(NOW).getTime() - days * 24 * 60 * 60 * 1000).toISOString()
}

describe("stats overview selector", () => {
  it("returns sensible fallbacks with no climbs", () => {
    const view = selectStatsOverviewViewModel([], { now: NOW })

    expect(view.tiles.sessions).toMatchObject({
      descriptor: "No sessions yet",
      primaryMetric: "0 sessions",
      secondaryText: "0.0 hrs on wall",
    })
    expect(view.tiles.progression.descriptor).toBe("Building baseline")
    expect(view.tiles.performance.descriptor).toBe("Log more climbs")
    expect(view.tiles.performance.primaryMetric).toBe("-")
    expect(view.tiles.performance.secondaryText).toBe("last 30 days")
    expect(view.tiles.archetype.descriptor).toBe("Log more climbs")
    expect(view.tiles.archetype.primaryMetric).toBe("")
    expect(view.tiles.archetype.secondaryText).toBe("last 30 days")
    expect(view.visuals.progression).toMatchObject({ kind: "sparkline", muted: true })
    expect(view.visuals.performance).toMatchObject({ kind: "conversionRing", active: false, percent: 0 })
    expect(view.visuals.archetype).toMatchObject({ kind: "radar", state: "empty" })
    expect(view.visuals.sessions).toMatchObject({ kind: "dailyBars" })
  })

  it("handles climbs with no sends in performance and progression", () => {
    const view = selectStatsOverviewViewModel(
      Array.from({ length: 8 }, (_, index) =>
        climb({
          id: `attempt-${index}`,
          outcome: "attempt",
          gradeIndex: 4,
          loggedAt: daysAgo(index + 1),
        }),
      ),
      { now: NOW },
    )

    expect(view.tiles.performance).toMatchObject({
      descriptor: "Working moves",
      primaryMetric: "Send rate 0%",
      secondaryText: "last 30 days",
    })
    expect(view.visuals.performance).toMatchObject({ kind: "conversionRing", active: true, percent: 0 })
    expect(view.tiles.progression.descriptor).toBe("Building baseline")
  })

  it("does not show a send-rate metric before the performance sample threshold", () => {
    const view = selectStatsOverviewViewModel(
      Array.from({ length: 7 }, (_, index) =>
        climb({
          id: `small-sample-${index}`,
          outcome: index < 4 ? "send" : "attempt",
          gradeIndex: 4,
          loggedAt: daysAgo(index + 1),
        }),
      ),
      { now: NOW },
    )

    expect(view.tiles.performance).toMatchObject({
      descriptor: "Log more climbs",
      primaryMetric: "-",
      secondaryText: "last 30 days",
    })
    expect(view.visuals.performance).toMatchObject({ kind: "conversionRing", active: false, percent: 0 })
  })

  it("detects progression trend over rolling thirty-day halves", () => {
    const view = selectStatsOverviewViewModel(
      [
        climb({ id: "previous-low", outcome: "send", gradeIndex: 3, loggedAt: daysAgo(20) }),
        climb({ id: "recent-high", outcome: "send", gradeIndex: 5, loggedAt: daysAgo(4) }),
      ],
      { now: NOW },
    )

    expect(view.tiles.progression).toMatchObject({
      descriptor: "Trending up",
      primaryMetric: "+2.0 working grade",
      secondaryText: "last 30 days",
    })
    expect(view.visuals.progression).toMatchObject({ kind: "sparkline", muted: false })
    if (view.visuals.progression.kind !== "sparkline") {
      throw new Error("Expected progression sparkline")
    }
    expect(view.visuals.progression.points).toHaveLength(6)
    expect(view.visuals.progression.points[5].yPercent).toBeLessThan(view.visuals.progression.points[0].yPercent)
  })

  it("keeps progression preview direction aligned with the displayed delta", () => {
    const view = selectStatsOverviewViewModel(
      [
        climb({ id: "previous-slightly-higher", outcome: "send", gradeIndex: 4.3, loggedAt: daysAgo(20) }),
        climb({ id: "recent-slightly-lower", outcome: "send", gradeIndex: 4, loggedAt: daysAgo(4) }),
      ],
      { now: NOW },
    )

    expect(view.tiles.progression).toMatchObject({
      descriptor: "Holding steady",
      primaryMetric: "-0.3 working grade",
      secondaryText: "last 30 days",
    })
    expect(view.visuals.progression).toMatchObject({ kind: "sparkline", muted: false })
    if (view.visuals.progression.kind !== "sparkline") {
      throw new Error("Expected progression sparkline")
    }
    expect(view.visuals.progression.points).toHaveLength(6)
    expect(view.visuals.progression.points[5].yPercent).toBeGreaterThan(view.visuals.progression.points[0].yPercent)
  })

  it("falls back for balanced archetype profiles", () => {
    const view = selectStatsOverviewViewModel(
      [
        climb({
          id: "slab-1",
          outcome: "send",
          gradeIndex: 4,
          loggedAt: daysAgo(2),
          canonicalTags: canonicalTags({ terrain: [tag("slab", "terrain")] }),
        }),
        climb({
          id: "slab-2",
          outcome: "send",
          gradeIndex: 4,
          loggedAt: daysAgo(3),
          canonicalTags: canonicalTags({ terrain: [tag("slab", "terrain")] }),
        }),
        climb({
          id: "vertical-1",
          outcome: "send",
          gradeIndex: 4,
          loggedAt: daysAgo(4),
          canonicalTags: canonicalTags({ terrain: [tag("vertical", "terrain")] }),
        }),
        climb({
          id: "vertical-2",
          outcome: "send",
          gradeIndex: 4,
          loggedAt: daysAgo(5),
          canonicalTags: canonicalTags({ terrain: [tag("vertical", "terrain")] }),
        }),
        climb({
          id: "overhang-1",
          outcome: "send",
          gradeIndex: 4,
          loggedAt: daysAgo(6),
          canonicalTags: canonicalTags({ terrain: [tag("overhang", "terrain")] }),
        }),
        climb({
          id: "overhang-2",
          outcome: "send",
          gradeIndex: 4,
          loggedAt: daysAgo(7),
          canonicalTags: canonicalTags({ terrain: [tag("overhang", "terrain")] }),
        }),
      ],
      { now: NOW },
    )

    expect(view.tiles.archetype).toMatchObject({
      descriptor: "Well-rounded lately",
      primaryMetric: "",
      secondaryText: "last 30 days",
    })
    expect(view.visuals.archetype).toMatchObject({ kind: "radar", state: "balanced" })
    if (view.visuals.archetype.kind !== "radar") {
      throw new Error("Expected archetype radar")
    }
    expect(new Set(view.visuals.archetype.axes.map((axis) => axis.value)).size).toBe(1)
  })

  it("selects a clear archetype tendency from uneven tagged volume", () => {
    const overhangClimbs = Array.from({ length: 6 }, (_, index) =>
      climb({
        id: `overhang-${index}`,
        outcome: index < 4 ? "send" : "attempt",
        gradeIndex: 5,
        loggedAt: daysAgo(index + 1),
        canonicalTags: canonicalTags({ terrain: [tag("overhang", "terrain")] }),
      }),
    )
    const view = selectStatsOverviewViewModel(
      [
        ...overhangClimbs,
        climb({
          id: "slab-one",
          outcome: "send",
          gradeIndex: 5,
          loggedAt: daysAgo(8),
          canonicalTags: canonicalTags({ terrain: [tag("slab", "terrain")] }),
        }),
      ],
      { now: NOW },
    )

    expect(view.tiles.archetype).toMatchObject({
      descriptor: "Powerful / Overhang",
      primaryMetric: "",
      secondaryText: "powerful steep terrain lately",
    })
    expect(view.visuals.archetype).toMatchObject({ kind: "radar", state: "active" })
  })

  it("renders the archetype preview shape from the same dimension as the selected label", () => {
    const crimpClimbs = Array.from({ length: 6 }, (_, index) =>
      climb({
        id: `crimp-${index}`,
        outcome: index < 4 ? "send" : "attempt",
        gradeIndex: 5,
        loggedAt: daysAgo(index + 1),
        canonicalTags: canonicalTags({ holdType: [tag("crimp", "holdType")] }),
      }),
    )
    const view = selectStatsOverviewViewModel(
      [
        ...crimpClimbs,
        climb({
          id: "sloper-one",
          outcome: "send",
          gradeIndex: 5,
          loggedAt: daysAgo(8),
          canonicalTags: canonicalTags({ holdType: [tag("sloper", "holdType")] }),
        }),
      ],
      { now: NOW },
    )

    expect(view.tiles.archetype).toMatchObject({
      descriptor: "Precise / Crimp",
      secondaryText: "precise finger-driven climbing lately",
    })
    if (view.visuals.archetype.kind !== "radar") {
      throw new Error("Expected archetype radar")
    }
    expect(view.visuals.archetype.axes.map((axis) => axis.label)).toEqual([
      "Crimp",
      "Sloper",
      "Pinch",
      "Pocket",
      "Jug",
      "Volume",
      "Undercling",
    ])
  })

  it("builds seven session bars from the rolling seven-day window", () => {
    const view = selectStatsOverviewViewModel(
      [
        climb({ id: "day-1-a", loggedAt: daysAgo(1) }),
        climb({ id: "day-1-b", loggedAt: new Date(new Date(NOW).getTime() - 1 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString() }),
        climb({ id: "day-3", loggedAt: daysAgo(3) }),
      ],
      { now: NOW },
    )

    if (view.visuals.sessions.kind !== "dailyBars") {
      throw new Error("Expected session bars")
    }

    expect(view.visuals.sessions.bars).toHaveLength(7)
    expect(view.visuals.sessions.bars.map((bar) => bar.label)).toEqual(["T", "F", "S", "S", "M", "T", "W"])
    expect(view.visuals.sessions.bars.some((bar) => bar.active)).toBe(true)
    expect(view.visuals.sessions.bars.some((bar) => !bar.active && bar.heightPercent === 8)).toBe(true)
  })

  it("assigns session preview climbs to their calendar day labels", () => {
    const view = selectStatsOverviewViewModel([climb({ id: "monday-evening", loggedAt: "2026-04-20T18:00:00.000Z" })], {
      now: NOW,
    })

    if (view.visuals.sessions.kind !== "dailyBars") {
      throw new Error("Expected session bars")
    }

    expect(view.visuals.sessions.bars.map((bar) => bar.label)).toEqual(["T", "F", "S", "S", "M", "T", "W"])
    expect(view.visuals.sessions.bars[4]).toMatchObject({ label: "M", active: true })
    expect(view.visuals.sessions.bars[5]).toMatchObject({ label: "T", active: false })
  })
})
