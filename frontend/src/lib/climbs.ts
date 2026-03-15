import { supabase } from './supabase'

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

export async function fetchClimbs(userId: string): Promise<Climb[]> {
  const { data, error } = await supabase
    .from('climbs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as ClimbRow[]).map((row) => mapClimbRow(row, userId))
}
