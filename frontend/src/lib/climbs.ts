import { supabase } from './supabase'
import type { LogbookSort } from './logbook'

const GRADE_VALUES: Record<string, number> = {
  VB: -1, V0: 0, V1: 1, V2: 2, V3: 3, V4: 4, V5: 5,
  V6: 6, V7: 7, V8: 8, V9: 9, V10: 10, 'V10+': 11,
}

export function gradeToValue(grade: string): number {
  return GRADE_VALUES[grade] ?? 0
}

export interface ClimbDraft {
  gymId: string
  gymName: string
  gymGrade: string
  feltLike: string
  sendType: string
  tags: string[]
  photo: string | null
  // Canonical frontend field name for the optional selected climb color.
  climbColor: string | null
}

interface ClimbRow {
  id: string
  user_id: string
  name?: string | null
  gym_id: string | null
  gym_name: string | null
  gym_grade: string
  gym_grade_value: number
  personal_grade: string | null
  personal_grade_value: number | null
  send_type: string
  tags: string[]
  photo_url: string | null
  climb_color?: string | null
  notes: string | null
  created_at: string
}

export interface Climb {
  id: string
  user_id: string
  name?: string | null
  gym_id: string | null
  gym_name: string | null
  gym_grade: string
  gym_grade_value: number
  personal_grade: string | null
  personal_grade_value: number | null
  send_type: string
  tags: string[]
  photo_url: string | null
  climbColor: string | null
  notes: string | null
  created_at: string
}

function toTitleCase(value: string) {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join(' ')
}

const getClimbColorStorageKey = (userId: string) => `smear.climb-color-overrides:${userId}`

function readClimbColorOverrides(userId: string): Record<string, string> {
  if (typeof window === 'undefined') return {}

  try {
    const rawValue = window.localStorage.getItem(getClimbColorStorageKey(userId))
    const parsed = rawValue ? JSON.parse(rawValue) : {}
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeClimbColorOverrides(userId: string, overrides: Record<string, string>) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(getClimbColorStorageKey(userId), JSON.stringify(overrides))
}

function setStoredClimbColor(userId: string, climbId: string, climbColor: string | null) {
  const overrides = readClimbColorOverrides(userId)

  if (climbColor) {
    overrides[climbId] = climbColor
  } else {
    delete overrides[climbId]
  }

  writeClimbColorOverrides(userId, overrides)
}

function getStoredClimbColor(userId: string, climbId: string): string | null {
  return readClimbColorOverrides(userId)[climbId] ?? null
}

function isMissingClimbColorColumnError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false

  const message = `${error.code ?? ''} ${error.message ?? ''}`.toLowerCase()
  return message.includes('climb_color') && message.includes('column')
}

function mapClimbRow(row: ClimbRow, userId: string): Climb {
  return {
    ...row,
    climbColor: row.climb_color ?? getStoredClimbColor(userId, row.id),
  }
}

export interface PaginatedClimbsResult {
  climbs: Climb[]
  totalCount: number
}

export interface LoggedGymOption {
  id: string
  name: string
}

export interface LoggedGradeOption {
  grade: string
  value: number
}

interface PaginatedClimbsParams {
  userId: string
  limit: number
  offset?: number
  sort: LogbookSort
  gymId?: string
  sendTypes?: string[]
  wallTypes?: string[]
  holdTypes?: string[]
  movementTypes?: string[]
  grades?: string[]
}

type PaginatedClimbsQuery = {
  eq: (column: string, value: string) => PaginatedClimbsQuery
  in: (column: string, values: string[]) => PaginatedClimbsQuery
  overlaps: (column: string, values: string[]) => PaginatedClimbsQuery
}

function applyOptionalFilters<T extends PaginatedClimbsQuery>(
  query: T,
  params: Pick<PaginatedClimbsParams, 'gymId' | 'sendTypes' | 'wallTypes' | 'holdTypes' | 'movementTypes' | 'grades'>,
): T {
  let nextQuery = query

  if (params.gymId && params.gymId !== 'all') {
    nextQuery = nextQuery.eq('gym_id', params.gymId) as T
  }

  if (params.sendTypes && params.sendTypes.length > 0) {
    nextQuery = nextQuery.in('send_type', params.sendTypes) as T
  }

  if (params.wallTypes && params.wallTypes.length > 0) {
    nextQuery = nextQuery.overlaps('tags', params.wallTypes.map((tag) => tag.toLowerCase())) as T
  }

  if (params.holdTypes && params.holdTypes.length > 0) {
    nextQuery = nextQuery.overlaps('tags', params.holdTypes.map((tag) => tag.toLowerCase())) as T
  }

  if (params.movementTypes && params.movementTypes.length > 0) {
    nextQuery = nextQuery.overlaps('tags', params.movementTypes.map((tag) => tag.toLowerCase())) as T
  }

  if (params.grades && params.grades.length > 0) {
    nextQuery = nextQuery.in('gym_grade', params.grades) as T
  }

  return nextQuery
}

export async function insertClimb(draft: ClimbDraft, userId: string): Promise<void> {
  const baseClimbRecord = {
    user_id: userId,
    gym_id: draft.gymId || null,
    gym_name: draft.gymName || null,
    gym_grade: draft.gymGrade,
    gym_grade_value: gradeToValue(draft.gymGrade),
    personal_grade: draft.feltLike || null,
    personal_grade_value: draft.feltLike ? gradeToValue(draft.feltLike) : null,
    send_type: draft.sendType.toLowerCase(),
    tags: draft.tags.map(t => t.toLowerCase()),
    photo_url: null,
  }

  if (!draft.climbColor) {
    const { error } = await supabase.from('climbs').insert(baseClimbRecord)
    if (error) throw error
    return
  }

  const { data, error } = await supabase
    .from('climbs')
    .insert({
      ...baseClimbRecord,
      // Backend column name; frontend uses the canonical draft.climbColor field.
      climb_color: draft.climbColor,
    })
    .select('id')
    .single()

  if (!error) {
    setStoredClimbColor(userId, data.id, draft.climbColor)
    return
  }

  if (!isMissingClimbColorColumnError(error)) {
    throw error
  }

  const fallbackInsert = await supabase
    .from('climbs')
    .insert(baseClimbRecord)
    .select('id')
    .single()

  if (fallbackInsert.error) throw fallbackInsert.error

  // TODO: Remove this local fallback after the climbs table persists climb_color everywhere.
  setStoredClimbColor(userId, fallbackInsert.data.id, draft.climbColor)
}

export async function updateClimb(draft: ClimbDraft, climbId: string, userId: string): Promise<void> {
  const baseClimbRecord = {
    gym_id: draft.gymId || null,
    gym_name: draft.gymName || null,
    gym_grade: draft.gymGrade,
    gym_grade_value: gradeToValue(draft.gymGrade),
    personal_grade: draft.feltLike || null,
    personal_grade_value: draft.feltLike ? gradeToValue(draft.feltLike) : null,
    send_type: draft.sendType.toLowerCase(),
    tags: draft.tags.map((tag) => tag.toLowerCase()),
    photo_url: draft.photo,
  }

  const attemptedUpdate = await supabase
    .from('climbs')
    .update({
      ...baseClimbRecord,
      climb_color: draft.climbColor,
    })
    .eq('user_id', userId)
    .eq('id', climbId)

  if (!attemptedUpdate.error) {
    setStoredClimbColor(userId, climbId, draft.climbColor)
    return
  }

  if (!isMissingClimbColorColumnError(attemptedUpdate.error)) {
    throw attemptedUpdate.error
  }

  const fallbackUpdate = await supabase
    .from('climbs')
    .update(baseClimbRecord)
    .eq('user_id', userId)
    .eq('id', climbId)

  if (fallbackUpdate.error) throw fallbackUpdate.error

  setStoredClimbColor(userId, climbId, draft.climbColor)
}

export async function deleteClimb(climbId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('climbs')
    .delete()
    .eq('user_id', userId)
    .eq('id', climbId)

  if (error) throw error
  setStoredClimbColor(userId, climbId, null)
}

export async function fetchPaginatedClimbs({
  userId,
  limit,
  offset = 0,
  sort,
  gymId,
  sendTypes,
  wallTypes,
  holdTypes,
  movementTypes,
  grades,
}: PaginatedClimbsParams): Promise<PaginatedClimbsResult> {
  let query = supabase
    .from('climbs')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)

  query = applyOptionalFilters(query, { gymId, sendTypes, wallTypes, holdTypes, movementTypes, grades })

  if (sort === 'hardest' || sort === 'easiest') {
    query = query
      .order('gym_grade_value', { ascending: sort === 'easiest' })
      .order('created_at', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: sort === 'oldest' })
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1)

  if (error) throw error
  return {
    climbs: (data as ClimbRow[]).map((row) => mapClimbRow(row, userId)),
    totalCount: count ?? 0,
  }
}

export async function fetchRecentClimbs(userId: string, limit = 5): Promise<Climb[]> {
  const { climbs } = await fetchPaginatedClimbs({
    userId,
    limit,
    offset: 0,
    sort: 'newest',
  })

  return climbs
}

export async function fetchClimbById(userId: string, climbId: string): Promise<Climb | null> {
  const { data, error } = await supabase
    .from('climbs')
    .select('*')
    .eq('user_id', userId)
    .eq('id', climbId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return mapClimbRow(data as ClimbRow, userId)
}

export async function fetchLoggedGyms(userId: string): Promise<LoggedGymOption[]> {
  const { data, error } = await supabase
    .from('climbs')
    .select('gym_id, gym_name, created_at')
    .eq('user_id', userId)
    .not('gym_id', 'is', null)
    .order('created_at', { ascending: false })

  if (error) throw error

  const uniqueGyms = new Map<string, LoggedGymOption>()

  for (const row of data ?? []) {
    const gymId = row.gym_id as string | null
    const gymName = row.gym_name as string | null

    if (!gymId || !gymName || uniqueGyms.has(gymId)) {
      continue
    }

    uniqueGyms.set(gymId, {
      id: gymId,
      name: gymName,
    })
  }

  return Array.from(uniqueGyms.values()).sort((left, right) => left.name.localeCompare(right.name))
}

export async function fetchLoggedGrades(userId: string): Promise<LoggedGradeOption[]> {
  const { data, error } = await supabase
    .from('climbs')
    .select('gym_grade, gym_grade_value', { distinct: true })
    .eq('user_id', userId)
    .not('gym_grade', 'is', null)

  if (error) throw error

  const uniqueGrades = new Map<string, LoggedGradeOption>()

  for (const row of data ?? []) {
    const grade = row.gym_grade as string | null
    const value = row.gym_grade_value as number | null

    if (!grade || uniqueGrades.has(grade)) {
      continue
    }

    uniqueGrades.set(grade, {
      grade,
      value: value ?? gradeToValue(grade),
    })
  }

  return Array.from(uniqueGrades.values()).sort((left, right) => left.value - right.value)
}

export function toClimbDraft(climb: Climb): ClimbDraft {
  return {
    gymId: climb.gym_id ?? '',
    gymName: climb.gym_name ?? '',
    gymGrade: climb.gym_grade,
    feltLike: climb.personal_grade ?? '',
    sendType: toTitleCase(climb.send_type),
    tags: climb.tags.map(toTitleCase),
    photo: climb.photo_url,
    climbColor: climb.climbColor,
  }
}
