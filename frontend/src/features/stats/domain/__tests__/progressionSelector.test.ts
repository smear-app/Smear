import { describe, expect, it } from "vitest"
import type { ProgressionMetrics } from "../calculators/progression"
import { selectProgressionViewModel } from "../progression/selectProgressionViewModel"

function makeWeeklyBucket(
  year: number,
  monthIndex: number,
  day: number,
  overrides: Partial<ProgressionMetrics["weekly"][number]> = {},
): ProgressionMetrics["weekly"][number] {
  const start = new Date(year, monthIndex, day)
  const end = new Date(start)
  end.setDate(end.getDate() + 7)

  return {
    key: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`,
    startAt: start.toISOString(),
    endAt: end.toISOString(),
    totalClimbs: 3,
    totalSentClimbs: 2,
    totalSessions: 1,
    highestSentGrade: 4,
    averageSentGrade: 4,
    workingGrade: 4.5,
    ...overrides,
  }
}

function makeWorkingGradeMetrics(workingGrades: readonly number[]): ProgressionMetrics {
  return {
    weekly: workingGrades.map((workingGrade, index) =>
      makeWeeklyBucket(2026, 0, 5 + index * 7, {
        workingGrade,
        highestSentGrade: workingGrade,
      }),
    ),
  }
}

describe("selectProgressionViewModel", () => {
  it("fills empty weekly chart bins across the visible range", () => {
    const metrics: ProgressionMetrics = {
      weekly: [makeWeeklyBucket(2026, 3, 6)],
    }

    const viewModel = selectProgressionViewModel(metrics, {
      visibleStartAt: new Date(2026, 3, 6),
      visibleEndAt: new Date(2026, 3, 21),
    })

    expect(viewModel.chartPoints).toHaveLength(3)
    expect(viewModel.chartPoints.map((point) => point.climbs)).toEqual([3, 0, 0])
    expect(viewModel.chartPoints.map((point) => point.barClimbs)).toEqual([2, 0, 0])
    expect(viewModel.chartPoints.map((point) => point.avgGrade)).toEqual([4.5, null, null])
  })

  it("does not backfill pre-history empty bins when the user has less than ten weeks of history", () => {
    const metrics: ProgressionMetrics = {
      weekly: [makeWeeklyBucket(2026, 3, 6)],
    }

    const viewModel = selectProgressionViewModel(metrics, {
      visibleStartAt: new Date(2026, 1, 9),
      visibleEndAt: new Date(2026, 3, 21),
      firstHistoryStartAt: new Date(2026, 3, 6),
    })

    expect(viewModel.chartPoints).toHaveLength(3)
    expect(viewModel.chartPoints[0]?.label).toBe("Apr 6")
    expect(viewModel.chartPoints.map((point) => point.climbs)).toEqual([3, 0, 0])
  })

  it("does not backfill pre-history empty bins when the user has less than six months of history", () => {
    const metrics: ProgressionMetrics = {
      weekly: [makeWeeklyBucket(2026, 3, 6)],
    }

    const viewModel = selectProgressionViewModel(metrics, {
      visibleStartAt: new Date(2025, 9, 21),
      visibleEndAt: new Date(2026, 3, 21),
      firstHistoryStartAt: new Date(2026, 3, 6),
    })

    expect(viewModel.chartPoints).toHaveLength(3)
    expect(viewModel.chartPoints[0]?.label).toBe("Apr 6")
    expect(viewModel.chartPoints.map((point) => point.climbs)).toEqual([3, 0, 0])
  })

  it("keeps empty bins inside the valid visible window without working-grade points", () => {
    const metrics: ProgressionMetrics = {
      weekly: [
        makeWeeklyBucket(2026, 3, 6, { totalClimbs: 2, totalSentClimbs: 2, workingGrade: 5 }),
        makeWeeklyBucket(2026, 3, 20, { totalClimbs: 1, totalSentClimbs: 1, workingGrade: 6 }),
      ],
    }

    const viewModel = selectProgressionViewModel(metrics, {
      visibleStartAt: new Date(2026, 3, 6),
      visibleEndAt: new Date(2026, 3, 21),
      firstHistoryStartAt: new Date(2026, 3, 6),
    })

    expect(viewModel.chartPoints.map((point) => point.climbs)).toEqual([2, 0, 1])
    expect(viewModel.chartPoints.map((point) => point.avgGrade)).toEqual([5, null, 6])
    expect(viewModel.chartPoints[1]).toMatchObject({
      barClimbs: 0,
      gradeLabel: "None",
    })
  })

  it("includes the current visible week even when there are no climbs", () => {
    const viewModel = selectProgressionViewModel({ weekly: [] }, {
      visibleStartAt: new Date(2026, 1, 9),
      visibleEndAt: new Date(2026, 3, 21),
      firstHistoryStartAt: null,
    })

    expect(viewModel.chartPoints).toHaveLength(1)
    expect(viewModel.chartPoints[0]).toMatchObject({
      climbs: 0,
      barClimbs: 0,
      avgGrade: null,
      gradeLabel: "None",
    })
  })

  it("includes the present bin when it is after the most recent real bucket", () => {
    const metrics: ProgressionMetrics = {
      weekly: [makeWeeklyBucket(2026, 3, 6)],
    }

    const viewModel = selectProgressionViewModel(metrics, {
      visibleStartAt: new Date(2026, 3, 6),
      visibleEndAt: new Date(2026, 3, 21),
      firstHistoryStartAt: new Date(2026, 3, 6),
    })

    expect(viewModel.chartPoints.at(-1)).toMatchObject({
      label: "Apr 20",
      climbs: 0,
      barClimbs: 0,
      avgGrade: null,
    })
  })

  it("uses the rolling timeframe start once the user has enough history", () => {
    const metrics: ProgressionMetrics = {
      weekly: [
        makeWeeklyBucket(2026, 0, 5),
        makeWeeklyBucket(2026, 3, 20, { totalClimbs: 1, totalSentClimbs: 1, workingGrade: 6 }),
      ],
    }

    const viewModel = selectProgressionViewModel(metrics, {
      visibleStartAt: new Date(2026, 3, 6),
      visibleEndAt: new Date(2026, 3, 21),
      firstHistoryStartAt: new Date(2026, 0, 5),
    })

    expect(viewModel.chartPoints).toHaveLength(3)
    expect(viewModel.chartPoints[0]?.label).toBe("Apr 6")
    expect(viewModel.chartPoints.map((point) => point.climbs)).toEqual([0, 0, 1])
    expect(viewModel.chartPoints.map((point) => point.avgGrade)).toEqual([null, null, 6])
  })

  it("formats supporting metrics from the visible chart window", () => {
    const metrics: ProgressionMetrics = {
      weekly: [
        makeWeeklyBucket(2026, 3, 6, {
          totalClimbs: 4,
          totalSentClimbs: 3,
          totalSessions: 2,
          highestSentGrade: 5,
          workingGrade: 5,
        }),
        makeWeeklyBucket(2026, 3, 20, {
          totalClimbs: 2,
          totalSentClimbs: 1,
          totalSessions: 1,
          highestSentGrade: 6,
          workingGrade: 6,
        }),
      ],
    }

    const viewModel = selectProgressionViewModel(metrics, {
      range: "10-weeks",
      visibleStartAt: new Date(2026, 3, 6),
      visibleEndAt: new Date(2026, 3, 21),
      firstHistoryStartAt: new Date(2026, 3, 6),
    })

    expect(viewModel.metrics.map((metric) => [metric.label, metric.value])).toEqual([
      ["Highest Grade", "V6"],
      ["Working Range", "V6"],
      ["Avg Climbs / Week", "2.0"],
      ["Sessions / Week", "1.0"],
    ])
  })

  it("returns a working-range delta when enough valid history exists for the selected timeframe", () => {
    const metrics: ProgressionMetrics = {
      weekly: [
        makeWeeklyBucket(2026, 2, 16, { workingGrade: 3 }),
        makeWeeklyBucket(2026, 2, 23, { workingGrade: 4 }),
        makeWeeklyBucket(2026, 2, 30, { totalClimbs: 0, totalSentClimbs: 0, totalSessions: 0, highestSentGrade: null, workingGrade: null }),
        makeWeeklyBucket(2026, 3, 6, { workingGrade: 5 }),
        makeWeeklyBucket(2026, 3, 13, { workingGrade: 6 }),
      ],
    }

    const viewModel = selectProgressionViewModel(metrics, {
      range: "10-weeks",
      visibleStartAt: new Date(2026, 3, 6),
      visibleEndAt: new Date(2026, 3, 21),
      firstHistoryStartAt: new Date(2026, 2, 16),
    })

    expect(viewModel.metrics.find((metric) => metric.label === "Working Range")?.description).toBe("+2.0 V")
  })

  it("uses timeframe-specific valid-week windows for working-range comparison", () => {
    const sixMonthViewModel = selectProgressionViewModel(makeWorkingGradeMetrics([1, 2, 3, 4, 5, 6, 7, 8]), {
      range: "6-months",
      visibleStartAt: new Date(2026, 1, 2),
      visibleEndAt: new Date(2026, 1, 23),
      firstHistoryStartAt: new Date(2026, 0, 5),
    })
    const allTimeViewModel = selectProgressionViewModel(makeWorkingGradeMetrics([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]), {
      range: "all-time",
      visibleStartAt: null,
      visibleEndAt: new Date(2026, 2, 23),
      firstHistoryStartAt: new Date(2026, 0, 5),
    })

    expect(sixMonthViewModel.metrics.find((metric) => metric.label === "Working Range")?.description).toBe("+4.0 V")
    expect(allTimeViewModel.metrics.find((metric) => metric.label === "Working Range")?.description).toBe("+6.0 V")
  })

  it("shows a safe fallback when supporting metrics do not have enough valid data", () => {
    const viewModel = selectProgressionViewModel({ weekly: [] }, {
      range: "6-months",
      visibleStartAt: new Date(2025, 9, 21),
      visibleEndAt: new Date(2026, 3, 21),
      firstHistoryStartAt: null,
    })

    expect(viewModel.metrics.map((metric) => [metric.label, metric.value, metric.description])).toEqual([
      ["Highest Grade", "-", ""],
      ["Working Range", "-", ""],
      ["Avg Climbs / Week", "0.0", ""],
      ["Sessions / Week", "0.0", ""],
    ])
  })
})
