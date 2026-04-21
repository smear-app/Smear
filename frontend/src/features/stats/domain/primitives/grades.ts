import { filterSentClimbs } from "./filters"
import type { EnrichedClimb } from "./types"

function getValidGradeIndex(climb: EnrichedClimb): number | null {
  return typeof climb.gradeIndex === "number" && Number.isFinite(climb.gradeIndex) ? climb.gradeIndex : null
}

function sortAscending(values: readonly number[]): number[] {
  return [...values].sort((left, right) => left - right)
}

function normalizeTopPercent(topPercent: number): number {
  if (!Number.isFinite(topPercent)) {
    return 0.2
  }

  const decimalPercent = topPercent > 1 ? topPercent / 100 : topPercent
  return Math.min(Math.max(decimalPercent, 0), 1)
}

export function getGradeIndexes(climbs: readonly EnrichedClimb[]): number[] {
  return climbs.flatMap((climb) => {
    const gradeIndex = getValidGradeIndex(climb)
    return gradeIndex === null ? [] : [gradeIndex]
  })
}

export function getHighestGrade(climbs: readonly EnrichedClimb[]): number | null {
  const gradeIndexes = getGradeIndexes(climbs)

  if (gradeIndexes.length === 0) {
    return null
  }

  return Math.max(...gradeIndexes)
}

export function getAverageGrade(climbs: readonly EnrichedClimb[]): number | null {
  const gradeIndexes = getGradeIndexes(climbs)

  if (gradeIndexes.length === 0) {
    return null
  }

  return gradeIndexes.reduce((sum, gradeIndex) => sum + gradeIndex, 0) / gradeIndexes.length
}

export function getMedianGrade(climbs: readonly EnrichedClimb[]): number | null {
  const gradeIndexes = sortAscending(getGradeIndexes(climbs))

  if (gradeIndexes.length === 0) {
    return null
  }

  const midpoint = Math.floor(gradeIndexes.length / 2)

  if (gradeIndexes.length % 2 === 1) {
    return gradeIndexes[midpoint]
  }

  return (gradeIndexes[midpoint - 1] + gradeIndexes[midpoint]) / 2
}

export function getWorkingGrade(climbs: readonly EnrichedClimb[], topPercent: number): number | null {
  const sentGradeIndexes = getGradeIndexes(filterSentClimbs(climbs)).sort((left, right) => right - left)

  if (sentGradeIndexes.length === 0) {
    return null
  }

  const clampedTopPercent = normalizeTopPercent(topPercent)
  const sampleSize = Math.max(1, Math.ceil(sentGradeIndexes.length * clampedTopPercent))
  const topGrades = sentGradeIndexes.slice(0, sampleSize)

  return topGrades.reduce((sum, gradeIndex) => sum + gradeIndex, 0) / topGrades.length
}
