import type { Climb } from "./climbs"

export interface ClimbDetailData {
  id: string
  gymGrade: string
  climbColor: string | null
  officialName: string | null
  gymName: string | null
  referenceImageUrl: string | null
  detailTags: string[]
  userNotes: string | null
  sendType: string
  loggedAt: string
}

function toTitleCase(value: string) {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join(" ")
}

export function buildClimbDetailData(climb: Climb): ClimbDetailData {
  return {
    id: climb.id,
    gymGrade: climb.gym_grade,
    climbColor: climb.climbColor,
    officialName: climb.name?.trim() ? climb.name.trim() : null,
    gymName: climb.gym_name,
    referenceImageUrl: climb.photo_url,
    detailTags: climb.tags.map(toTitleCase),
    userNotes: climb.notes?.trim() || null,
    sendType: climb.send_type,
    loggedAt: climb.created_at,
  }
}
