import { supabase } from './supabase'

const DEFAULT_API_BASE_URL = 'https://smear-backend.onrender.com/api/v1'
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(/\/+$/, '')

const ME_CACHE_KEY = 'smear:me'
const GYMS_CACHE_KEY = 'smear:gyms-cache'
const GYMS_CACHED_AT_KEY = 'smear:gyms-cached-at'
const GYMS_CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

// ── Response types (mirrors backend models) ──────────────────────────────────

export interface MeResponse {
  id: string
  email: string
  display_name: string | null
  username: string | null
  avatar_url: string | null
  is_admin: boolean
  bookmarked_gym_ids: string[]
  recent_gym_ids: string[]
  created_at: string | null
}

export interface PatchMeRequest {
  display_name?: string | null
  username?: string | null
  avatar_url?: string | null
}

export interface PatchPasswordRequest {
  old_password: string
  new_password: string
}

export interface PatchGymPrefsRequest {
  bookmarked_gym_ids: string[]
  recent_gym_ids: string[]
}

export interface ClimbObject {
  id: string
  user_id: string
  gym_id: string | null
  gym_name: string | null
  gym_grade: string
  gym_grade_value: number
  personal_grade: string | null
  personal_grade_value: number | null
  send_type: string
  tags: string[]
  photo_url: string | null
  hold_color: string | null
  notes: string | null
  canonical_climb_id: string | null
  session_id: string | null
  created_at: string
}

export interface PostClimbRequest {
  gym_id?: string | null
  gym_name?: string | null
  gym_grade: string
  gym_grade_value: number
  personal_grade?: string | null
  personal_grade_value?: number | null
  send_type: string
  tags: string[]
  photo_url?: string | null
  hold_color?: string | null
  notes?: string | null
  canonical_climb_id?: string | null
  confidence_score?: number | null
  override_signal?: boolean
}

export interface PatchClimbRequest {
  gym_id?: string | null
  gym_name?: string | null
  gym_grade?: string
  gym_grade_value?: number
  personal_grade?: string | null
  personal_grade_value?: number | null
  send_type?: string
  tags?: string[]
  photo_url?: string | null
  hold_color?: string | null
  notes?: string | null
}

export interface PaginatedClimbsResponse {
  climbs: ClimbObject[]
  total_count: number
}

export interface GetClimbsParams {
  limit?: number
  offset?: number
  sort?: string
  gym_id?: string
  send_types?: string[]
  wall_types?: string[]
  hold_types?: string[]
  movement_types?: string[]
  mechanic_types?: string[]
  grades?: string[]
}

export interface ClimbsMetaResponse {
  gyms: { id: string; name: string }[]
  grades: { grade: string; value: number }[]
}

export interface GymObject {
  id: string
  name: string
  city: string
  state: string
  address?: string | null
  lat?: number | null
  lng?: number | null
}

export interface GymsAllResponse {
  gyms: GymObject[]
  cached_at: string
}

export interface CanonicalClimbObject {
  id: string
  gym_id: string | null
  gym_grade_value: number
  hold_color: string | null
  canonical_tags: string[]
  photo_url: string | null
  log_count: number
  send_count: number
  flash_count: number
  takedown_votes: number
  is_active: boolean
  status: string
  confidence_score: number | null
  last_logged_at: string | null
  expires_at: string | null
  seeded_by: string | null
  created_at: string
}

export interface PostCanonicalRequest {
  gym_id: string
  gym_grade_value: number
  hold_color: string
  seeded_by: string
  photo_url?: string | null
}

export interface CanonicalSummary {
  id: string
  gym_id: string
  gym_grade_value: number
  hold_color: string | null
  canonical_tags: string[]
  photo_url: string | null
  log_count: number
}

export interface DuplicateFlagObject {
  id: string
  similarity_score: number
  status: string
  created_at: string
  canonical_a: CanonicalSummary
  canonical_b: CanonicalSummary
}

// ── Core fetch ────────────────────────────────────────────────────────────────

async function getToken(): Promise<string> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Not authenticated')
  return token
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getToken()
  const resp = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  })
  if (!resp.ok) {
    const text = await resp.text().catch(() => '')
    throw new Error(`API error ${resp.status}: ${text}`)
  }
  if (resp.status === 204) return undefined as unknown as T
  return resp.json() as Promise<T>
}

// ── Me cache ──────────────────────────────────────────────────────────────────

export function clearMeCache(): void {
  sessionStorage.removeItem(ME_CACHE_KEY)
}

export async function getMe(): Promise<MeResponse> {
  const cached = sessionStorage.getItem(ME_CACHE_KEY)
  if (cached) {
    try {
      return JSON.parse(cached) as MeResponse
    } catch {
      sessionStorage.removeItem(ME_CACHE_KEY)
    }
  }
  const me = await apiFetch<MeResponse>('/me')
  sessionStorage.setItem(ME_CACHE_KEY, JSON.stringify(me))
  return me
}

export async function patchMe(body: PatchMeRequest): Promise<MeResponse> {
  const me = await apiFetch<MeResponse>('/me', {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
  sessionStorage.setItem(ME_CACHE_KEY, JSON.stringify(me))
  return me
}

export async function patchPassword(body: PatchPasswordRequest): Promise<void> {
  await apiFetch<void>('/me/password', {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export async function patchGymPreferences(body: PatchGymPrefsRequest): Promise<void> {
  await apiFetch<void>('/me/gym-preferences', {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
  clearMeCache()
}

// ── Gyms cache ────────────────────────────────────────────────────────────────

export async function getGymsAll(): Promise<GymsAllResponse> {
  const cachedAt = localStorage.getItem(GYMS_CACHED_AT_KEY)
  const cachedData = localStorage.getItem(GYMS_CACHE_KEY)
  if (cachedAt && cachedData) {
    const age = Date.now() - Number(cachedAt)
    if (age < GYMS_CACHE_TTL_MS) {
      try {
        return JSON.parse(cachedData) as GymsAllResponse
      } catch {
        localStorage.removeItem(GYMS_CACHE_KEY)
        localStorage.removeItem(GYMS_CACHED_AT_KEY)
      }
    }
  }
  const data = await apiFetch<GymsAllResponse>('/gyms/all')
  localStorage.setItem(GYMS_CACHE_KEY, JSON.stringify(data))
  localStorage.setItem(GYMS_CACHED_AT_KEY, String(Date.now()))
  return data
}

// ── Climbs ────────────────────────────────────────────────────────────────────

function buildClimbsQuery(params: GetClimbsParams): string {
  const p = new URLSearchParams()
  if (params.limit != null) p.set('limit', String(params.limit))
  if (params.offset != null) p.set('offset', String(params.offset))
  if (params.sort) p.set('sort', params.sort)
  if (params.gym_id) p.set('gym_id', params.gym_id)
  for (const t of params.send_types ?? []) p.append('send_types', t)
  for (const t of params.wall_types ?? []) p.append('wall_types', t)
  for (const t of params.hold_types ?? []) p.append('hold_types', t)
  for (const t of params.movement_types ?? []) p.append('movement_types', t)
  for (const t of params.mechanic_types ?? []) p.append('mechanic_types', t)
  for (const t of params.grades ?? []) p.append('grades', t)
  const qs = p.toString()
  return qs ? `/climbs?${qs}` : '/climbs'
}

export async function getClimbs(params: GetClimbsParams): Promise<PaginatedClimbsResponse> {
  return apiFetch<PaginatedClimbsResponse>(buildClimbsQuery(params))
}

export async function getClimbsMeta(): Promise<ClimbsMetaResponse> {
  return apiFetch<ClimbsMetaResponse>('/climbs/meta')
}

export async function getRecentClimbs(): Promise<ClimbObject[]> {
  return apiFetch<ClimbObject[]>('/climbs/recent')
}

export async function getClimbById(id: string): Promise<ClimbObject | null> {
  try {
    return await apiFetch<ClimbObject>(`/climbs/${id}`)
  } catch (err) {
    if (err instanceof Error && err.message.includes('404')) return null
    throw err
  }
}

export async function postClimb(body: PostClimbRequest): Promise<ClimbObject> {
  return apiFetch<ClimbObject>('/climbs', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function patchClimb(id: string, body: PatchClimbRequest): Promise<ClimbObject> {
  return apiFetch<ClimbObject>(`/climbs/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export async function patchClimbPhoto(id: string, photoUrl: string): Promise<ClimbObject> {
  return apiFetch<ClimbObject>(`/climbs/${id}/photo`, {
    method: 'PATCH',
    body: JSON.stringify({ photo_url: photoUrl }),
  })
}

export async function deleteClimbApi(id: string): Promise<void> {
  await apiFetch<void>(`/climbs/${id}`, { method: 'DELETE' })
}

// ── Canonical Climbs ──────────────────────────────────────────────────────────

export async function getCanonicalCandidates(
  gymId: string,
  gradeValue: number,
  holdColor: string,
): Promise<CanonicalClimbObject[]> {
  const p = new URLSearchParams({
    gym_id: gymId,
    gym_grade_value: String(gradeValue),
    hold_color: holdColor,
  })
  return apiFetch<CanonicalClimbObject[]>(`/canonical-climbs?${p.toString()}`)
}

export async function postCanonicalClimb(body: PostCanonicalRequest): Promise<CanonicalClimbObject> {
  return apiFetch<CanonicalClimbObject>('/canonical-climbs', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}


// ── Admin ─────────────────────────────────────────────────────────────────────

export async function getAdminDuplicateFlags(): Promise<DuplicateFlagObject[]> {
  return apiFetch<DuplicateFlagObject[]>('/admin/duplicate-flags')
}

export async function adminRecomputeConfidence(): Promise<{ recomputed: number }> {
  return apiFetch<{ recomputed: number }>('/admin/recompute-confidence', { method: 'POST' })
}
