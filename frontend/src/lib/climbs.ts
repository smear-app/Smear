import { supabase } from './supabase'

const GRADE_VALUES: Record<string, number> = {
  VB: -1, V0: 0, V1: 1, V2: 2, V3: 3, V4: 4, V5: 5,
  V6: 6, V7: 7, V8: 8, V9: 9, V10: 10, 'V10+': 11,
}

export function gradeToValue(grade: string): number {
  return GRADE_VALUES[grade] ?? 0
}

export interface ClimbDraft {
  gymGrade: string
  feltLike: string
  sendType: string
  tags: string[]
  photo: string | null
}

export interface Climb {
  id: string
  user_id: string
  gym_grade: string
  gym_grade_value: number
  personal_grade: string | null
  personal_grade_value: number | null
  send_type: string
  tags: string[]
  photo_url: string | null
  notes: string | null
  created_at: string
}

export async function insertClimb(draft: ClimbDraft, userId: string): Promise<void> {
  const { error } = await supabase.from('climbs').insert({
    user_id: userId,
    gym_grade: draft.gymGrade,
    gym_grade_value: gradeToValue(draft.gymGrade),
    personal_grade: draft.feltLike,
    personal_grade_value: gradeToValue(draft.feltLike),
    send_type: draft.sendType.toLowerCase(),
    tags: draft.tags.map(t => t.toLowerCase()),
    photo_url: null,
  })
  if (error) throw error
}

export async function fetchClimbs(userId: string): Promise<Climb[]> {
  const { data, error } = await supabase
    .from('climbs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}
