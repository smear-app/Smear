import { getKnownGradeValue } from "../../../../lib/climbs"

export type NormalizedGrade = {
  gradeLabel: string | null
  gradeIndex: number | null
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

export function normalizeGrade(label: string | null | undefined, value: number | null | undefined): NormalizedGrade {
  const gradeLabel = label?.trim() || null

  if (isFiniteNumber(value)) {
    return {
      gradeLabel,
      gradeIndex: value,
    }
  }

  if (!gradeLabel) {
    return {
      gradeLabel: null,
      gradeIndex: null,
    }
  }

  return {
    gradeLabel,
    gradeIndex: getKnownGradeValue(gradeLabel),
  }
}
