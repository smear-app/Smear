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
        { gradeIndex: 4, count: 2 },
        { gradeIndex: 5, count: 3 },
        { gradeIndex: 6, count: 1 },
      ],
      outcomeCounts: overrides.outcomeCounts ?? { flash: 2, send: 4, attempt: 4 },
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
      { label: "Working Grade", value: "V5–V6" },
    ])
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
            { gradeIndex: 3, count: 2 },
            { gradeIndex: 4, count: 5 },
            { gradeIndex: 6, count: 3 },
          ],
          outcomeCounts: { flash: 2, send: 5, attempt: 3 },
        }),
      ],
    })

    expect(viewModel.sessions[0].gradeDistribution).toEqual([
      { label: "V3", count: 2, widthPercent: 40 },
      { label: "V4", count: 5, widthPercent: 100 },
      { label: "V6", count: 3, widthPercent: 60 },
    ])
    expect(viewModel.sessions[0].outcomeTotalCount).toBe(10)
    expect(viewModel.sessions[0].outcomes).toEqual([
      { label: "Flash", count: 2, percentage: 20, percentageLabel: "20%", tone: "flash" },
      { label: "Send", count: 5, percentage: 50, percentageLabel: "50%", tone: "send" },
      { label: "Unfinished", count: 3, percentage: 30, percentageLabel: "30%", tone: "unfinished" },
    ])
  })
})
