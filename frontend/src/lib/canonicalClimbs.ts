import {
  getCanonicalCandidates,
  postCanonicalClimb,
  type CanonicalClimbObject,
} from './api'

export type { CanonicalClimbObject as CanonicalClimb }

/**
 * Query active canonical climbs matching the fingerprint: gym_id + grade + hold_color.
 * Returns up to 4 candidates ordered by most recently logged.
 */
export async function queryFingerprintCandidates(
  gymId: string,
  gradeValue: number,
  holdColor: string,
): Promise<CanonicalClimbObject[]> {
  return getCanonicalCandidates(gymId, gradeValue, holdColor)
}

/**
 * Compute a 0–100 confidence score for a candidate at query time.
 *
 * Signals:
 *   Tag overlap  (65pts max) — jaccard similarity between userTags and canonical_tags
 *   Recency      (30pts max) — decays by half every 30 days from last_logged_at
 *   Log volume   (5pts max)  — log(send_count + 1) normalized, capped
 */
export function computeConfidenceScore(candidate: CanonicalClimbObject, userTags: string[]): number {
  // Tag overlap — jaccard similarity
  const canonicalSet = new Set(candidate.canonical_tags.map((t) => t.toLowerCase()))
  const userSet = new Set(userTags.map((t) => t.toLowerCase()))
  let tagScore = 0
  if (canonicalSet.size > 0 || userSet.size > 0) {
    const intersection = [...userSet].filter((t) => canonicalSet.has(t)).length
    const union = new Set([...canonicalSet, ...userSet]).size
    tagScore = union > 0 ? (intersection / union) * 65 : 0
  }

  // Recency — half-life of 30 days
  const lastLogged = candidate.last_logged_at ? new Date(candidate.last_logged_at).getTime() : Date.now()
  const daysSinceLogged = (Date.now() - lastLogged) / (1000 * 60 * 60 * 24)
  const recencyScore = 30 * Math.pow(0.5, daysSinceLogged / 30)

  // Log volume — log scale, max 5pts at ~55 sends
  const volumeScore = Math.min(5, (Math.log(candidate.send_count + 1) / Math.log(56)) * 5)

  return Math.min(100, Math.round(tagScore + recencyScore + volumeScore))
}

/**
 * Seed a new canonical climb in 'pending' state.
 * Called when no candidates match or user selects "none of these".
 */
export async function seedCanonicalClimb(
  gymId: string,
  gradeValue: number,
  holdColor: string,
  userId: string,
  photoUrl?: string | null,
): Promise<string> {
  const canonical = await postCanonicalClimb({
    gym_id: gymId,
    gym_grade_value: gradeValue,
    hold_color: holdColor,
    seeded_by: userId,
    photo_url: photoUrl ?? null,
  })
  return canonical.id
}
