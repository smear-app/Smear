import { supabase } from './supabase'
import { uploadToCloudinary } from './cloudinary'

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
  photo: string | null       // blob URL for preview only
  photoFile: File | null     // raw File for upload
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
  hold_color: string | null
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

function mapClimbRow(row: ClimbRow): Climb {
  return {
    ...row,
    climbColor: row.hold_color,
  }
}

export async function insertClimb(draft: ClimbDraft, userId: string): Promise<void> {
  let photoUrl: string | null = null
  if (draft.photoFile) {
    photoUrl = await uploadToCloudinary(draft.photoFile)
  }

  const { error } = await supabase.from('climbs').insert({
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
  return (data as ClimbRow[]).map(mapClimbRow)
}
