import type { LogbookSort } from './logbook'
import { uploadToCloudinary } from './cloudinary'
import {
  getClimbs as apiGetClimbs,
  getClimbById as apiGetClimbById,
  getRecentClimbs as apiGetRecentClimbs,
  postClimb,
  patchClimb,

  deleteClimbApi,
  getClimbsMeta,
  type ClimbObject,
  type GetClimbsParams,
} from './api'

const GRADE_VALUES: Record<string, number> = {
  VB: -1, V0: 0, V1: 1, V2: 2, V3: 3, V4: 4, V5: 5,
  V6: 6, V7: 7, V8: 8, V9: 9, V10: 10, 'V10+': 11,
}

export function gradeToValue(grade: string): number {
  return GRADE_VALUES[grade] ?? 0
}

export function getKnownGradeValue(grade: string): number | null {
  return GRADE_VALUES[grade] ?? null
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
  canonical_climb_id: string | null
  session_id: string | null
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

function mapApiClimb(obj: ClimbObject): Climb {
  return {
    id: obj.id,
    user_id: obj.user_id,
    gym_id: obj.gym_id,
    gym_name: obj.gym_name,
    gym_grade: obj.gym_grade,
    gym_grade_value: obj.gym_grade_value,
    personal_grade: obj.personal_grade,
    personal_grade_value: obj.personal_grade_value,
    send_type: obj.send_type,
    tags: obj.tags,
    photo_url: obj.photo_url,
    climbColor: obj.hold_color,
    notes: obj.notes,
    canonical_climb_id: obj.canonical_climb_id,
    session_id: obj.session_id,
    created_at: obj.created_at,
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
  mechanicTypes?: string[]
  grades?: string[]
}

export async function insertClimb(draft: ClimbDraft, userId: string): Promise<Climb> {
  void userId  // backend reads user from auth token

  const photoUrl = draft.photoFile
    ? await uploadToCloudinary(draft.photoFile)
    : draft.photo && !draft.photo.startsWith('blob:')
      ? draft.photo
      : null

  const created = await postClimb({
    gym_id: draft.gymId || null,
    gym_name: draft.gymName || null,
    gym_grade: draft.gymGrade,
    gym_grade_value: gradeToValue(draft.gymGrade),
    personal_grade: draft.feltLike || null,
    personal_grade_value: draft.feltLike ? gradeToValue(draft.feltLike) : null,
    send_type: draft.sendType.toLowerCase(),
    tags: draft.tags.map((t) => t.toLowerCase()),
    photo_url: photoUrl,
    hold_color: draft.climbColor || null,
    canonical_climb_id: draft.canonicalClimbId || null,
    confidence_score: draft.confidenceScore ?? null,
    override_signal: draft.overrideSignal ?? false,
  })

  return mapApiClimb(created)
}

export async function updateClimb(
  draft: ClimbDraft,
  climb: Pick<Climb, 'id' | 'user_id'>,
): Promise<Climb> {
  let photoUrl: string | null = null
  if (draft.photoFile) {
    photoUrl = await uploadToCloudinary(draft.photoFile)
  } else if (draft.photo && !draft.photo.startsWith('blob:')) {
    photoUrl = draft.photo
  }

  const updated = await patchClimb(climb.id, {
    gym_id: draft.gymId || null,
    gym_name: draft.gymName || null,
    gym_grade: draft.gymGrade,
    gym_grade_value: gradeToValue(draft.gymGrade),
    personal_grade: draft.feltLike || null,
    personal_grade_value: draft.feltLike ? gradeToValue(draft.feltLike) : null,
    send_type: draft.sendType.toLowerCase(),
    tags: draft.tags.map((tag) => tag.toLowerCase()),
    photo_url: photoUrl,
    hold_color: draft.climbColor || null,
    notes: draft.notes || null,
  })

  return mapApiClimb(updated)
}

export async function deleteClimb(climbId: string, userId: string): Promise<void> {
  void userId
  await deleteClimbApi(climbId)
}

export async function fetchPaginatedClimbs({
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
  const params: GetClimbsParams = {
    limit,
    offset,
    sort,
    gym_id: gymId,
    send_types: sendTypes,
    wall_types: wallTypes,
    hold_types: holdTypes,
    movement_types: movementTypes,
    mechanic_types: mechanicTypes,
    grades,
  }

  const result = await apiGetClimbs(params)
  return {
    climbs: result.climbs.map(mapApiClimb),
    totalCount: result.total_count,
  }
}

export async function fetchRecentClimbs(userId: string, limit = 5): Promise<Climb[]> {
  void userId
  void limit
  const climbs = await apiGetRecentClimbs()
  return climbs.map(mapApiClimb)
}

export async function fetchClimbById(userId: string, climbId: string): Promise<Climb | null> {
  void userId
  const obj = await apiGetClimbById(climbId)
  return obj ? mapApiClimb(obj) : null
}

export async function fetchLoggedGyms(userId: string): Promise<LoggedGymOption[]> {
  void userId
  const meta = await getClimbsMeta()
  return meta.gyms
}

export async function fetchLoggedGrades(userId: string): Promise<LoggedGradeOption[]> {
  void userId
  const meta = await getClimbsMeta()
  return meta.grades
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
