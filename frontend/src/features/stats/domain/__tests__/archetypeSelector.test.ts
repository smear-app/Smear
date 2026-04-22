import { describe, expect, it } from "vitest"
import { calculateArchetypeMetrics } from "../calculators"
import { normalizeSoftRadarValues, selectArchetypeViewModel } from "../archetype/selectArchetypeViewModel"
import { canonicalTags, climb, tag } from "./fixtures"

describe("archetype selector", () => {
  it("maps empty datasets to missing displays and centered radar values", () => {
    const viewModel = selectArchetypeViewModel(calculateArchetypeMetrics([]), "terrain")

    expect(viewModel.categories).toHaveLength(4)
    expect(viewModel.categories.every((category) => category.workingGradeDisplayValue === "-")).toBe(true)
    expect(viewModel.categories.every((category) => category.volumeDisplayValue === "0")).toBe(true)
    expect(viewModel.categories.every((category) => category.normalizedPerformanceRadarValue === 0)).toBe(true)
    expect(viewModel.categories.every((category) => category.normalizedVolumeRadarValue === 0)).toBe(true)
  })

  it("keeps unfinished attempts in volume without leaking them into working grade", () => {
    const viewModel = selectArchetypeViewModel(
      calculateArchetypeMetrics([
        climb({
          id: "attempted-slab-v8",
          outcome: "attempt",
          gradeIndex: 8,
          canonicalTags: canonicalTags({ terrain: [tag("slab", "terrain")] }),
        }),
      ]),
      "terrain",
    )
    const slab = viewModel.categories.find((category) => category.categoryKey === "slab")

    expect(slab).toMatchObject({
      sentCount: 0,
      totalLoggedCount: 1,
      workingGradeSourceValues: [],
      workingGradeDisplayValue: "-",
      volumeDisplayValue: "1",
      normalizedPerformanceRadarValue: 0,
      missingPerformance: true,
      missingVolume: false,
    })
    expect(slab?.normalizedVolumeRadarValue).toBeGreaterThan(0)
  })

  it("renders balanced nonzero profiles broadly instead of collapsed inward", () => {
    const viewModel = selectArchetypeViewModel(
      calculateArchetypeMetrics([
        climb({
          id: "slab-v3",
          outcome: "send",
          gradeIndex: 3,
          canonicalTags: canonicalTags({ terrain: [tag("slab", "terrain")] }),
        }),
        climb({
          id: "vertical-v3",
          outcome: "send",
          gradeIndex: 3,
          canonicalTags: canonicalTags({ terrain: [tag("vertical", "terrain")] }),
        }),
        climb({
          id: "overhang-v3",
          outcome: "send",
          gradeIndex: 3,
          canonicalTags: canonicalTags({ terrain: [tag("overhang", "terrain")] }),
        }),
        climb({
          id: "cave-v3",
          outcome: "send",
          gradeIndex: 3,
          canonicalTags: canonicalTags({ terrain: [tag("cave", "terrain")] }),
        }),
      ]),
      "terrain",
    )

    expect(viewModel.categories.every((category) => category.normalizedPerformanceRadarValue === 100)).toBe(true)
    expect(viewModel.categories.every((category) => category.normalizedVolumeRadarValue === 100)).toBe(true)
  })

  it("compresses tiny differences while preserving clear dominance", () => {
    const tinyDifference = normalizeSoftRadarValues([3, 3, 3, 4], { valueOffset: 1 })
    const dominantDifference = normalizeSoftRadarValues([3, 3, 3, 8], { valueOffset: 1 })

    expect(Math.max(...tinyDifference) - Math.min(...tinyDifference)).toBeLessThanOrEqual(10)
    expect(Math.max(...dominantDifference) - Math.min(...dominantDifference)).toBeGreaterThan(15)
  })
})
