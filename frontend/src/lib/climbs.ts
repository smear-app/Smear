import { supabase } from './supabase'
import type { LogbookSort } from './logbook'
import { uploadToCloudinary } from './cloudinary'
import { touchSession } from './sessions'

const GRADE_VALUES: Record<string, number> = {
  VB: -1, V0: 0, V1: 1, V2: 2, V3: 3, V4: 4, V5: 5,
  V6: 6, V7: 7, V8: 8, V9: 9, V10: 10, 'V10+': 11,
}

export function gradeToValue(grade: string): number {
  return GRADE_VALUES[grade] ?? 0
}

export interface ClimbDraft {
  name: string
  gymId: string
  gymName: string
  gymGrade: string
  feltLike: string
  sendType: string
  tags: string[]
  photo: string | null       // blob URL for preview only
  photoFile: File | null     // raw File for upload
  climbColor: string | null
  notes: string
  canonicalClimbId: string | null
  confidenceScore: number | null
  overrideSignal: boolean
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
  hold_color: string | null
  climb_color?: string | null
  notes: string | null
  created_at: string
  canonical_climbs?: { photo_url: string | null } | null
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

export function applyDraftToClimb(climb: Climb, draft: ClimbDraft): Climb {
  return {
    ...climb,
    name: draft.name.trim() || null,
    gym_id: draft.gymId || null,
    gym_name: draft.gymName || null,
    gym_grade: draft.gymGrade,
    gym_grade_value: gradeToValue(draft.gymGrade),
    personal_grade: draft.feltLike || null,
    personal_grade_value: draft.feltLike ? gradeToValue(draft.feltLike) : null,
    send_type: draft.sendType.toLowerCase(),
    tags: draft.tags.map((tag) => tag.toLowerCase()),
    climbColor: draft.climbColor,
    notes: draft.notes || null,
    photo_url: draft.photo && !draft.photo.startsWith('blob:') ? draft.photo : climb.photo_url,
  }
}

function toTitleCase(value: string) {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join(' ')
}

function isMissingColumnError(error: { code?: string; message?: string } | null, columnName: string): boolean {
  if (!error) return false

  const message = `${error.code ?? ''} ${error.message ?? ''}`.toLowerCase()
  return message.includes(columnName.toLowerCase()) && message.includes('column')
}

function getMissingOptionalColumn(
  error: { code?: string; message?: string } | null,
  columnNames: string[],
): string | null {
  for (const columnName of columnNames) {
    if (isMissingColumnError(error, columnName)) {
      return columnName
    }
  }

  return null
}

function mapClimbRow(row: ClimbRow): Climb {
  return {
    ...row,
    photo_url: row.photo_url ?? row.canonical_climbs?.photo_url ?? null,
    climbColor: row.hold_color ?? row.climb_color ?? null,
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

interface LoggedGymRpcRow {
  id: string | null
  name: string | null
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
  mechanicTypes?: string[]
  grades?: string[]
}

type PaginatedClimbsQuery = {
  eq: (column: string, value: string) => PaginatedClimbsQuery
  in: (column: string, values: string[]) => PaginatedClimbsQuery
  overlaps: (column: string, values: string[]) => PaginatedClimbsQuery
}

function applyOptionalFilters<T extends PaginatedClimbsQuery>(
  query: T,
  params: Pick<PaginatedClimbsParams, 'gymId' | 'sendTypes' | 'wallTypes' | 'holdTypes' | 'movementTypes' | 'mechanicTypes' | 'grades'>,
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

  if (params.mechanicTypes && params.mechanicTypes.length > 0) {
    nextQuery = nextQuery.overlaps('tags', params.mechanicTypes.map((tag) => tag.toLowerCase())) as T
  }

  if (params.grades && params.grades.length > 0) {
    nextQuery = nextQuery.in('gym_grade', params.grades) as T
  }

  return nextQuery
}

export async function insertClimb(draft: ClimbDraft, userId: string, sessionId: string): Promise<void> {
  let photoUrl: string | null = null
  if (draft.photoFile) {
    photoUrl = await uploadToCloudinary(draft.photoFile)
  }

  const requiredPayload = {
    user_id: userId,
    gym_id: draft.gymId || null,
    gym_name: draft.gymName || null,
    gym_grade: draft.gymGrade,
    gym_grade_value: gradeToValue(draft.gymGrade),
    personal_grade: draft.feltLike || null,
    personal_grade_value: draft.feltLike ? gradeToValue(draft.feltLike) : null,
    send_type: draft.sendType.toLowerCase(),
    tags: draft.tags.map(t => t.toLowerCase()),
    photo_url: photoUrl,
    hold_color: draft.climbColor || null,
    session_id: sessionId,
  }

  const optionalColumns = new Map<string, string | number | boolean | null>([
    ['canonical_climb_id', draft.canonicalClimbId || null],
    ['confidence_score', draft.confidenceScore ?? null],
    ['override_signal', draft.overrideSignal ?? false],
  ])

  while (true) {
    const payload = { ...requiredPayload, ...Object.fromEntries(optionalColumns) }
    const { error } = await supabase.from('climbs').insert(payload)

    if (!error) break

    const missingColumn = getMissingOptionalColumn(error, Array.from(optionalColumns.keys()))
    if (!missingColumn) throw error

    optionalColumns.delete(missingColumn)
  }

  await touchSession(sessionId)
}

export async function updateClimb(
  draft: ClimbDraft,
  climb: Pick<Climb, 'id' | 'user_id'>,
): Promise<Climb> {
  const baseClimbRecord = {
    gym_id: draft.gymId || null,
    gym_name: draft.gymName || null,
    gym_grade: draft.gymGrade,
    gym_grade_value: gradeToValue(draft.gymGrade),
    personal_grade: draft.feltLike || null,
    personal_grade_value: draft.feltLike ? gradeToValue(draft.feltLike) : null,
    send_type: draft.sendType.toLowerCase(),
    tags: draft.tags.map((tag) => tag.toLowerCase()),
  }

  let photoUrl: string | null = null
  if (draft.photoFile) {
    photoUrl = await uploadToCloudinary(draft.photoFile)
  } else if (draft.photo && !draft.photo.startsWith('blob:')) {
    photoUrl = draft.photo
  }

  const requiredUpdatePayload = {
    ...baseClimbRecord,
    photo_url: photoUrl,
  }

  const optionalColumns = new Map<string, string | null>([
    ['name', draft.name || null],
    ['hold_color', draft.climbColor || null],
    ['notes', draft.notes || null],
  ])

  while (true) {
    const payload = {
      ...requiredUpdatePayload,
      ...Object.fromEntries(optionalColumns),
    }

    const updateResult = await supabase
      .from('climbs')
      .update(payload)
      .eq('user_id', climb.user_id)
      .eq('id', climb.id)

    if (!updateResult.error) {
      break
    }

    const missingColumn = getMissingOptionalColumn(updateResult.error, Array.from(optionalColumns.keys()))
    if (!missingColumn) {
      throw updateResult.error
    }

    optionalColumns.delete(missingColumn)
  }

  const updatedClimb = await fetchClimbById(climb.user_id, climb.id)
  if (!updatedClimb) {
    throw new Error('Updated climb could not be reloaded')
  }

  return updatedClimb
}

export async function deleteClimb(climbId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('climbs')
    .delete()
    .eq('user_id', userId)
    .eq('id', climbId)

  if (error) throw error
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
  mechanicTypes,
  grades,
}: PaginatedClimbsParams): Promise<PaginatedClimbsResult> {
  let query = supabase
    .from('climbs')
    .select('*, canonical_climbs(photo_url)', { count: 'exact' })
    .eq('user_id', userId)

  query = applyOptionalFilters(query, { gymId, sendTypes, wallTypes, holdTypes, movementTypes, mechanicTypes, grades })

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
    climbs: (data as ClimbRow[]).map(mapClimbRow),
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
    .select('*, canonical_climbs(photo_url)')
    .eq('user_id', userId)
    .eq('id', climbId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return mapClimbRow(data as ClimbRow)
}

export async function fetchLoggedGyms(_userId: string): Promise<LoggedGymOption[]> {
  void _userId

  const { data, error } = await supabase.rpc('fetch_logged_gyms')

  if (error) throw error

  return ((data as LoggedGymRpcRow[] | null) ?? [])
    .filter((row): row is { id: string; name: string } => Boolean(row.id && row.name))
    .map((row) => ({
      id: row.id,
      name: row.name,
    }))
}

export async function fetchLoggedGrades(userId: string): Promise<LoggedGradeOption[]> {
  const { data, error } = await supabase
    .from('climbs')
    .select('gym_grade, gym_grade_value')
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
    name: climb.name ?? '',
    gymId: climb.gym_id ?? '',
    gymName: climb.gym_name ?? '',
    gymGrade: climb.gym_grade,
    feltLike: climb.personal_grade ?? '',
    sendType: toTitleCase(climb.send_type),
    tags: climb.tags.map(toTitleCase),
    photo: climb.photo_url,
    photoFile: null,
    climbColor: climb.climbColor,
    notes: climb.notes ?? '',
    canonicalClimbId: null,
    confidenceScore: null,
    overrideSignal: false,
  }
}
