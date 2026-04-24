import { describe, expect, it } from "vitest"
import { buildWorkingGradeAxis } from "../charts/workingGradeAxis"

describe("buildWorkingGradeAxis", () => {
  it("uses a readable default domain when there are no working-grade values", () => {
    expect(buildWorkingGradeAxis([])).toMatchObject({
      domainMin: 0,
      domainMax: 4,
      ticks: [0, 1, 2, 3, 4],
    })
  })

  it("centers stable values on the median with a four-grade domain", () => {
    expect(buildWorkingGradeAxis([4.5, 5, 5.5])).toMatchObject({
      domainMin: 3,
      domainMax: 7,
      ticks: [3, 4, 5, 6, 7],
    })
  })

  it("keeps sparse low-grade values above the supported floor without collapsing the domain", () => {
    expect(buildWorkingGradeAxis([0])).toMatchObject({
      domainMin: 0,
      domainMax: 4,
      ticks: [0, 1, 2, 3, 4],
    })
  })

  it("expands to the actual range only for wide working-grade spreads", () => {
    expect(buildWorkingGradeAxis([3, 4, 7])).toMatchObject({
      domainMin: 3,
      domainMax: 7,
      ticks: [3, 4, 5, 6, 7],
    })
  })

  it("formats whole-grade tick labels", () => {
    const axis = buildWorkingGradeAxis([5])

    expect(axis.formatTick(5)).toBe("V5")
  })
})
