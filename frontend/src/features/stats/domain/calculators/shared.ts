import type { EnrichedClimb } from "../primitives"

export function safeDivide(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator
}

export function safeRatioDelta(delta: number | null, baseline: number | null): number | null {
  if (delta === null || baseline === null || baseline === 0) {
    return null
  }

  return delta / baseline
}

export function getValidGradeIndexes(climbs: readonly EnrichedClimb[]): number[] {
  return climbs.flatMap((climb) =>
    typeof climb.gradeIndex === "number" && Number.isFinite(climb.gradeIndex) ? [climb.gradeIndex] : [],
  )
}

export function median(values: readonly number[]): number | null {
  if (values.length === 0) {
    return null
  }

  const sortedValues = [...values].sort((left, right) => left - right)
  const midpoint = Math.floor(sortedValues.length / 2)

  if (sortedValues.length % 2 === 1) {
    return sortedValues[midpoint]
  }

  return (sortedValues[midpoint - 1] + sortedValues[midpoint]) / 2
}

export function average(values: readonly number[]): number | null {
  if (values.length === 0) {
    return null
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export function averageNonNull(values: readonly (number | null)[]): number | null {
  return average(values.flatMap((value) => (value === null ? [] : [value])))
}

export function calculateDurationMs(startAt: string, endAt: string): number | null {
  const startTimestamp = new Date(startAt).getTime()
  const endTimestamp = new Date(endAt).getTime()

  if (!Number.isFinite(startTimestamp) || !Number.isFinite(endTimestamp)) {
    return null
  }

  const durationMs = endTimestamp - startTimestamp
  return durationMs >= 0 ? durationMs : null
}

export function calculateTopFortyPercentMedianWorkingGrade(sentClimbs: readonly EnrichedClimb[]): number | null {
  const sortedGradeIndexes = getValidGradeIndexes(sentClimbs).sort((left, right) => right - left)

  if (sortedGradeIndexes.length === 0) {
    return null
  }

  const subsetSize = Math.max(1, Math.ceil(sentClimbs.length * 0.4))
  return median(sortedGradeIndexes.slice(0, subsetSize))
}
