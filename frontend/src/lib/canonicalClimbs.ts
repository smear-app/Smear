import { supabase } from './supabase'

export interface CanonicalClimb {
  id: string
  gym_id: string | null
  gym_grade_value: number
  hold_color: string
  canonical_tags: string[]
  photo_url: string | null
  log_count: number
  send_count: number
  flash_count: number
  takedown_votes: number
  is_active: boolean
  status: 'pending' | 'verified' | 'flagged' | 'archived' | 'disputed' | 'deleted'
  last_logged_at: string
  expires_at: string
  seeded_by: string | null
  created_at: string
}

/**
 * Query active canonical climbs matching the fingerprint: gym_id + grade + hold_color.
 * Returns up to 4 candidates ordered by most recently logged.
 */
export async function queryFingerprintCandidates(
  gymId: string,
  gradeValue: number,
  holdColor: string,
): Promise<CanonicalClimb[]> {
  const { data, error } = await supabase
    .from('canonical_climbs')
    .select('*')
    .eq('gym_id', gymId)
    .eq('gym_grade_value', gradeValue)
    .eq('hold_color', holdColor)
    .eq('is_active', true)
    .in('status', ['pending', 'verified'])
    .order('last_logged_at', { ascending: false })
    .limit(4)

  if (error) throw error
  return (data ?? []) as CanonicalClimb[]
}

/**
 * Compute a 0–100 confidence score for a candidate at query time.
 * The score is stored on the climb row as `confidence_score` and also
 * drives UI ordering and auto-selection.
 *
 * Signals:
 *   Tag overlap  (65pts max) — jaccard similarity between userTags and canonical_tags
 *   Recency      (30pts max) — decays by half every 30 days from last_logged_at
 *   Log volume   (5pts max)  — log(send_count + 1) normalized, capped
 */
export function computeConfidenceScore(candidate: CanonicalClimb, userTags: string[]): number {
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
  const daysSinceLogged =
    (Date.now() - new Date(candidate.last_logged_at).getTime()) / (1000 * 60 * 60 * 24)
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
  const { data, error } = await supabase
    .from('canonical_climbs')
    .insert({
      gym_id: gymId,
      gym_grade_value: gradeValue,
      hold_color: holdColor,
      seeded_by: userId,
      photo_url: photoUrl ?? null,
      status: 'pending',
      is_active: true,
      canonical_tags: [],
      send_count: 0,
      flash_count: 0,
      log_count: 1,
    })
    .select('id')
    .single()

  if (error) throw error
  return data.id as string
}
