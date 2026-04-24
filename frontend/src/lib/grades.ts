const GRADE_VALUES: Record<string, number> = {
  VB: -1,
  V0: 0,
  V1: 1,
  V2: 2,
  V3: 3,
  V4: 4,
  V5: 5,
  V6: 6,
  V7: 7,
  V8: 8,
  V9: 9,
  V10: 10,
  "V10+": 11,
}

export function gradeToValue(grade: string): number {
  return GRADE_VALUES[grade] ?? 0
}

export function getKnownGradeValue(grade: string): number | null {
  return GRADE_VALUES[grade] ?? null
}
