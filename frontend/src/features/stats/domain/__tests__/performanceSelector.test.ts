import { describe, expect, it } from "vitest"
import type { PerformanceMetrics } from "../calculators/performance"
import { selectPerformanceViewModel } from "../performance/selectPerformanceViewModel"

function metricsFixture(overrides: Partial<PerformanceMetrics> = {}): PerformanceMetrics {
  return {
    totalClimbs: 10,
    totalAttempts: 10,
    totalSentClimbs: 7,
    totalFlashClimbs: 2,
    totalAttemptClimbs: 3,
    flashRate: 0.28,
    averageAttemptsPerSend: 1.4,
    highestGrade: 6,
    highestFlashGrade: 5,
    averageSentGrade: 5,
    medianSentGrade: 5,
    workingGrade: 5.5,
    gradeHistogram: [{ gradeIndex: 6, climbs: [], count: 2 }],
    gradePerformance: [{ gradeIndex: 6, totalClimbs: 4, sentClimbs: 3, sendRate: 0.75 }],
    outcomeCounts: { flash: 2, send: 5, attempt: 3 },
    ...overrides,
  }
}

function metricValue(metrics: ReturnType<typeof selectPerformanceViewModel>["metrics"], label: string): string {
  const metric = metrics.find((item) => item.label === label)

  if (!metric) {
    throw new Error(`Missing selector metric: ${label}`)
  }

  return metric.value
}

describe("selectPerformanceViewModel", () => {
  it("formats whole, half, and missing grades", () => {
    const viewModel = selectPerformanceViewModel(
      metricsFixture({
        highestGrade: 6,
        highestFlashGrade: null,
        gradeHistogram: [
          { gradeIndex: 6, climbs: [], count: 2 },
          { gradeIndex: 6.5, climbs: [], count: 1 },
        ],
      }),
      "10w",
    )

    expect(metricValue(viewModel.metrics, "Hardest Send")).toBe("V6")
    expect(metricValue(viewModel.metrics, "Hardest Flash")).toBe("None")
    expect(viewModel.pyramid.map((band) => band.label)).toContain("V6–V7")
  })

  it("formats percentages consistently", () => {
    const viewModel = selectPerformanceViewModel(metricsFixture({ flashRate: 0.28 }), "10w")
    const zeroViewModel = selectPerformanceViewModel(metricsFixture({ flashRate: 0 }), "10w")

    expect(metricValue(viewModel.metrics, "Flash Rate")).toBe("28%")
    expect(metricValue(zeroViewModel.metrics, "Flash Rate")).toBe("0%")
  })

  it("formats average attempts per send safely", () => {
    const viewModel = selectPerformanceViewModel(metricsFixture({ averageAttemptsPerSend: 2.25 }), "10w")
    const zeroSentViewModel = selectPerformanceViewModel(
      metricsFixture({ totalSentClimbs: 0, averageAttemptsPerSend: 0 }),
      "10w",
    )

    expect(metricValue(viewModel.metrics, "Avg Attempts / Send")).toBe("2.3")
    expect(metricValue(zeroSentViewModel.metrics, "Avg Attempts / Send")).toBe("0.0")
  })

  it("shapes outcome breakdown counts and percentages from metrics", () => {
    const viewModel = selectPerformanceViewModel(
      metricsFixture({
        totalClimbs: 10,
        outcomeCounts: { flash: 2, send: 5, attempt: 3 },
      }),
      "10w",
    )

    expect(viewModel.outcomes.map((item) => [item.label, item.count, item.percentageLabel])).toEqual([
      ["Flash", 2, "20%"],
      ["Send", 5, "50%"],
      ["Unfinished", 3, "30%"],
    ])
  })

  it("returns safe display values for empty metrics", () => {
    const viewModel = selectPerformanceViewModel(
      metricsFixture({
        totalClimbs: 0,
        totalAttempts: 0,
        totalSentClimbs: 0,
        totalFlashClimbs: 0,
        totalAttemptClimbs: 0,
        flashRate: 0,
        averageAttemptsPerSend: 0,
        highestGrade: null,
        highestFlashGrade: null,
        averageSentGrade: null,
        medianSentGrade: null,
        workingGrade: null,
        gradeHistogram: [],
        gradePerformance: [],
        outcomeCounts: { flash: 0, send: 0, attempt: 0 },
      }),
      "all",
    )

    expect(viewModel.pyramid).toEqual([])
    expect(viewModel.gradeBands).toEqual([])
    expect(viewModel.outcomes.map((item) => item.percentageLabel)).toEqual(["0%", "0%", "0%"])
    expect(metricValue(viewModel.metrics, "Hardest Send")).toBe("None")
    expect(metricValue(viewModel.metrics, "Hardest Flash")).toBe("None")
    expect(viewModel.metrics.map((metric) => metric.value).some((value) => value.includes("NaN"))).toBe(false)
  })
})
