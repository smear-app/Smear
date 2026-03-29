import { supabase } from './supabase'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

export interface CanonicalSummary {
  id: string
  gym_id: string
  gym_grade_value: number
  hold_color: string | null
  canonical_tags: string[]
  photo_url: string | null
  log_count: number
}

export interface DuplicateFlag {
  id: string
  similarity_score: number
  status: string
  created_at: string
  canonical_a: CanonicalSummary
  canonical_b: CanonicalSummary
}

export async function fetchPendingFlags(): Promise<DuplicateFlag[]> {
  const { data: flagRows, error: flagsError } = await supabase
    .from('duplicate_flags')
    .select('id, canonical_id_a, canonical_id_b, similarity_score, status, created_at')
    .eq('status', 'pending')
    .order('similarity_score', { ascending: false })

  if (flagsError) throw flagsError
  if (!flagRows || flagRows.length === 0) return []

  const canonicalIds = [
    ...new Set(flagRows.flatMap((f) => [f.canonical_id_a, f.canonical_id_b])),
  ]

  const { data: canonicals, error: canonicalsError } = await supabase
    .from('canonical_climbs')
    .select('id, gym_id, gym_grade_value, hold_color, canonical_tags, photo_url, log_count')
    .in('id', canonicalIds)

  if (canonicalsError) throw canonicalsError

  const byId = Object.fromEntries((canonicals ?? []).map((c) => [c.id, c]))

  return flagRows.map((f) => ({
    id: f.id,
    similarity_score: f.similarity_score,
    status: f.status,
    created_at: f.created_at,
    canonical_a: byId[f.canonical_id_a] as CanonicalSummary,
    canonical_b: byId[f.canonical_id_b] as CanonicalSummary,
  }))
}

export async function mergeFlag(flagId: string, winnerId: string, loserId: string): Promise<void> {
  const resp = await fetch(`${API_BASE}/duplicate-flags/${flagId}/merge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ winner_id: winnerId, loser_id: loserId }),
  })
  if (!resp.ok) throw new Error(`Merge failed: ${resp.status}`)
}

export async function dismissFlag(flagId: string): Promise<void> {
  const resp = await fetch(`${API_BASE}/duplicate-flags/${flagId}/dismiss`, {
    method: 'POST',
  })
  if (!resp.ok) throw new Error(`Dismiss failed: ${resp.status}`)
}
