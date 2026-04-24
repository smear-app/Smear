import { describe, expect, it } from "vitest"
import type { SessionsMetrics } from "../calculators/sessions"
import { selectSessionsViewModel } from "../sessions/selectSessionsViewModel"

function makeSession(
  id: string,
  startAt: string,
  overrides: Partial<SessionsMetrics["sessions"][number]["session"]> = {},
): SessionsMetrics["sessions"][number] {
  const endAt = overrides.endAt ?? startAt

  return {
    session: {
      sessionId: id,
      gymId: overrides.gymId ?? "gym-1",
      gymName: overrides.gymName ?? "Test Gym",
      startAt,
      endAt,
      durationMs: overrides.durationMs ?? 60 * 60 * 1000,
      totalClimbs: overrides.totalClimbs ?? 10,
      totalSentClimbs: overrides.totalSentClimbs ?? 6,
      totalFlashClimbs: overrides.totalFlashClimbs ?? 2,
      totalAttemptClimbs: overrides.totalAttemptClimbs ?? 4,
      flashRate: overrides.flashRate ?? 1 / 3,
      sentRate: overrides.sentRate ?? 0.6,
      highestGrade: overrides.highestGrade ?? 6,
      averageSentGrade: overrides.averageSentGrade ?? 4.5,
      medianSentGrade: overrides.medianSentGrade ?? 5,
      workingGrade: overrides.workingGrade ?? 5.5,
      gradeHistogram: overrides.gradeHistogram ?? [
        { gradeIndex: 4, count: 2, outcomeCounts: { flash: 0, send: 1, attempt: 1 } },
        { gradeIndex: 5, count: 3, outcomeCounts: { flash: 1, send: 1, attempt: 1 } },
        { gradeIndex: 6, count: 1, outcomeCounts: { flash: 1, send: 0, attempt: 0 } },
      ],
      outcomeCounts: overrides.outcomeCounts ?? { flash: 2, send: 4, attempt: 4 },
      attemptsPerSend: overrides.attemptsPerSend ?? 10 / 6,
      completionRate: overrides.completionRate ?? 0.6,
      distinctStyleCount: overrides.distinctStyleCount ?? 3,
      persistedInsight: overrides.persistedInsight ?? null,
      ...overrides,
    },
    comparisonToAllTimeBaseline: null,
  }
}

describe("selectSessionsViewModel", () => {
  it("orders sessions newest first for the picker default", () => {
    const viewModel = selectSessionsViewModel({
      allTimeBaseline: null,
      sessions: [
        makeSession("older", "2026-04-01T10:00:00.000Z"),
        makeSession("latest", "2026-04-08T10:00:00.000Z"),
      ],
    })

    expect(viewModel.sessions.map((session) => session.id)).toEqual(["latest", "older"])
    expect(viewModel.sessions[0]).toMatchObject({
      selectorLabel: "Apr 8 · Test Gym",
      selectorMeta: "Latest session",
    })
  })

  it("formats selected-session summary values", () => {
    const viewModel = selectSessionsViewModel({
      allTimeBaseline: null,
      sessions: [
        makeSession("session", "2026-04-01T10:00:00.000Z", {
          durationMs: 105 * 60 * 1000,
          totalClimbs: 14,
          highestGrade: 6,
          workingGrade: 5.5,
        }),
      ],
    })

    expect(viewModel.sessions[0].summary).toEqual([
      { label: "Total Climbs", value: "14" },
      { label: "Duration", value: "1h 45m" },
      { label: "Max Grade", value: "V6" },
      { label: "Working Grade", value: "V5.5" },
    ])
  })

  it("uses persisted session insight when available", () => {
    const viewModel = selectSessionsViewModel({
      allTimeBaseline: null,
      sessions: [
        makeSession("session", "2026-04-01T10:00:00.000Z", {
          persistedInsight: {
            label: "Volume session",
            reason: "+22% climbs",
            classifierVersion: "session-insight-v1",
          },
        }),
      ],
    })

    expect(viewModel.sessions[0].identity).toEqual({
      label: "Volume session",
      reason: "+22% climbs",
      displayMode: "insight",
    })
    expect(viewModel.sessions[0].insight).toBe("Volume session · +22% climbs")
  })

  it("does not use persisted session insight when the selected session is too small", () => {
    const viewModel = selectSessionsViewModel({
      allTimeBaseline: null,
      sessions: [
        makeSession("session", "2026-04-01T10:00:00.000Z", {
          totalClimbs: 1,
          totalSentClimbs: 1,
          totalAttemptClimbs: 0,
          persistedInsight: {
            label: "Volume session",
            reason: "+22% climbs",
            classifierVersion: "session-insight-v1",
          },
        }),
      ],
    })

    expect(viewModel.sessions[0].identity).toEqual({
      label: "Not enough activity",
      reason: "More climbs needed for insight",
      displayMode: "system",
      message: "Not enough climbs",
    })
    expect(viewModel.sessions[0].insight).toBe("Not enough climbs")
  })

  it("handles empty and null session values safely", () => {
    const emptyViewModel = selectSessionsViewModel({ allTimeBaseline: null, sessions: [] })
    const nullGradeViewModel = selectSessionsViewModel({
      allTimeBaseline: null,
      sessions: [
        makeSession("session", "invalid-date", {
          durationMs: null,
          gymName: null,
          highestGrade: null,
          workingGrade: null,
        }),
      ],
    })

    expect(emptyViewModel.sessions).toEqual([])
    expect(nullGradeViewModel.sessions[0]).toMatchObject({
      selectorLabel: "- · Unknown gym",
      summary: [
        { label: "Total Climbs", value: "10" },
        { label: "Duration", value: "-" },
        { label: "Max Grade", value: "None" },
        { label: "Working Grade", value: "None" },
      ],
    })
  })

  it("shapes selected-session grade distribution and outcome breakdown", () => {
    const viewModel = selectSessionsViewModel({
      allTimeBaseline: null,
      sessions: [
        makeSession("session", "2026-04-01T10:00:00.000Z", {
          totalClimbs: 10,
          gradeHistogram: [
            { gradeIndex: 3, count: 2, outcomeCounts: { flash: 1, send: 1, attempt: 0 } },
            { gradeIndex: 4, count: 5, outcomeCounts: { flash: 1, send: 2, attempt: 2 } },
            { gradeIndex: 6, count: 3, outcomeCounts: { flash: 0, send: 2, attempt: 1 } },
          ],
          outcomeCounts: { flash: 2, send: 5, attempt: 3 },
        }),
      ],
    })

    expect(viewModel.sessions[0].gradeDistribution).toEqual([
      {
        label: "V6",
        count: 3,
        widthPercent: 60,
        segments: [
          { tone: "flash", count: 0, percentage: 0 },
          { tone: "send", count: 2, percentage: 66.66666666666666 },
          { tone: "unfinished", count: 1, percentage: 33.33333333333333 },
        ],
      },
      {
        label: "V4",
        count: 5,
        widthPercent: 100,
        segments: [
          { tone: "flash", count: 1, percentage: 20 },
          { tone: "send", count: 2, percentage: 40 },
          { tone: "unfinished", count: 2, percentage: 40 },
        ],
      },
      {
        label: "V3",
        count: 2,
        widthPercent: 40,
        segments: [
          { tone: "flash", count: 1, percentage: 50 },
          { tone: "send", count: 1, percentage: 50 },
          { tone: "unfinished", count: 0, percentage: 0 },
        ],
      },
    ])
    expect(viewModel.sessions[0].outcomeTotalCount).toBe(10)
    expect(viewModel.sessions[0].outcomes).toEqual([
      { label: "Flash", count: 2, percentage: 20, percentageLabel: "20%", tone: "flash" },
      { label: "Send", count: 5, percentage: 50, percentageLabel: "50%", tone: "send" },
      { label: "Unfinished", count: 3, percentage: 30, percentageLabel: "30%", tone: "unfinished" },
    ])
  })

  it("shapes the trend chart from the five most recent sessions in display order", () => {
    const viewModel = selectSessionsViewModel({
      allTimeBaseline: null,
      sessions: [
        makeSession("session-1", "2026-04-01T10:00:00.000Z", { totalClimbs: 1, workingGrade: 1 }),
        makeSession("session-2", "2026-04-02T10:00:00.000Z", { totalClimbs: 2, workingGrade: 2 }),
        makeSession("session-3", "2026-04-03T10:00:00.000Z", { totalClimbs: 3, workingGrade: 3 }),
        makeSession("session-4", "2026-04-04T10:00:00.000Z", { totalClimbs: 4, workingGrade: 4 }),
        makeSession("session-5", "2026-04-05T10:00:00.000Z", { totalClimbs: 5, workingGrade: 5 }),
        makeSession("session-6", "2026-04-06T10:00:00.000Z", { totalClimbs: 6, workingGrade: null }),
      ],
    })

    expect(viewModel.trendPoints).toEqual([
      { sessionId: "session-2", label: "Apr 2", tickLabel: "Apr 2", climbs: 2, avgGrade: 2 },
      { sessionId: "session-3", label: "Apr 3", tickLabel: "Apr 3", climbs: 3, avgGrade: 3 },
      { sessionId: "session-4", label: "Apr 4", tickLabel: "Apr 4", climbs: 4, avgGrade: 4 },
      { sessionId: "session-5", label: "Apr 5", tickLabel: "Apr 5", climbs: 5, avgGrade: 5 },
      { sessionId: "session-6", label: "Apr 6", tickLabel: "Apr 6", climbs: 6, avgGrade: null },
    ])
  })

  it("does not fabricate trend chart sessions when fewer than five exist", () => {
    const viewModel = selectSessionsViewModel({
      allTimeBaseline: null,
      sessions: [
        makeSession("older", "2026-04-01T10:00:00.000Z"),
        makeSession("latest", "2026-04-08T10:00:00.000Z"),
      ],
    })

    expect(viewModel.trendPoints).toHaveLength(2)
    expect(viewModel.trendPoints.map((point) => point.sessionId)).toEqual(["older", "latest"])
  })

  it("shapes trend summary metrics from the same recent-session window as the chart", () => {
    const viewModel = selectSessionsViewModel({
      allTimeBaseline: null,
      sessions: [
        makeSession("session-1", "2026-04-01T10:00:00.000Z", { totalClimbs: 100, workingGrade: 10 }),
        makeSession("session-2", "2026-04-02T10:00:00.000Z", { totalClimbs: 2, workingGrade: 2 }),
        makeSession("session-3", "2026-04-03T10:00:00.000Z", { totalClimbs: 4, workingGrade: null }),
        makeSession("session-4", "2026-04-04T10:00:00.000Z", { totalClimbs: 6, workingGrade: 4 }),
        makeSession("session-5", "2026-04-05T10:00:00.000Z", { totalClimbs: 8, workingGrade: 6 }),
        makeSession("session-6", "2026-04-06T10:00:00.000Z", { totalClimbs: 10, workingGrade: 8 }),
      ],
    })

    expect(viewModel.trendPoints.map((point) => point.sessionId)).toEqual([
      "session-2",
      "session-3",
      "session-4",
      "session-5",
      "session-6",
    ])
    expect(viewModel.trendMetrics).toEqual([
      { label: "Avg Climbs / Session", value: "6.0", description: "" },
      { label: "Working Grade", value: "V5", description: "" },
      { label: "Best Session Volume", value: "10 climbs", description: "" },
      { label: "Best Session Grade", value: "V8", description: "" },
    ])
  })

  it("shows safe trend summary fallbacks for empty or missing working-grade windows", () => {
    const emptyViewModel = selectSessionsViewModel({ allTimeBaseline: null, sessions: [] })
    const noGradeViewModel = selectSessionsViewModel({
      allTimeBaseline: null,
      sessions: [
        makeSession("session", "2026-04-01T10:00:00.000Z", { totalClimbs: 0, workingGrade: null }),
      ],
    })

    expect(emptyViewModel.trendMetrics).toEqual([
      { label: "Avg Climbs / Session", value: "-", description: "" },
      { label: "Working Grade", value: "None", description: "" },
      { label: "Best Session Volume", value: "-", description: "" },
      { label: "Best Session Grade", value: "None", description: "" },
    ])
    expect(noGradeViewModel.trendMetrics.find((metric) => metric.label === "Working Grade")?.value).toBe("None")
  })
})
