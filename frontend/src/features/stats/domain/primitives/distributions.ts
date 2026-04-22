import type { ClimbOutcome, EnrichedClimb } from "./types"

export type GradeHistogramBucket<TClimb extends EnrichedClimb = EnrichedClimb> = {
  gradeIndex: number
  climbs: TClimb[]
  count: number
}

export type OutcomeCounts = Record<ClimbOutcome, number>

export function buildGradeHistogram<TClimb extends EnrichedClimb>(
  climbs: readonly TClimb[],
): Array<GradeHistogramBucket<TClimb>> {
  const bucketsByGrade = new Map<number, TClimb[]>()

  for (const climb of climbs) {
    if (typeof climb.gradeIndex !== "number" || !Number.isFinite(climb.gradeIndex)) {
      continue
    }

    bucketsByGrade.set(climb.gradeIndex, [...(bucketsByGrade.get(climb.gradeIndex) ?? []), climb])
  }

  return [...bucketsByGrade.entries()]
    .sort(([leftGrade], [rightGrade]) => leftGrade - rightGrade)
    .map(([gradeIndex, bucketClimbs]) => ({
      gradeIndex,
      climbs: bucketClimbs,
      count: bucketClimbs.length,
    }))
}

export function buildOutcomeCounts(climbs: readonly EnrichedClimb[]): OutcomeCounts {
  return climbs.reduce<OutcomeCounts>(
    (counts, climb) => ({
      ...counts,
      [climb.outcome]: counts[climb.outcome] + 1,
    }),
    { flash: 0, send: 0, attempt: 0 },
  )
}
