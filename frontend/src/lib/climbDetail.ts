import type { Climb } from "./climbs"

export interface ClimbDetailData {
  id: string
  gymGrade: string
  climbColor: string | null
  officialName: string | null
  gymName: string | null
  referenceImageUrl: string | null
  canonicalTags: string[]
  userTags: string[]
  userTagDifferences: string[]
  userNotes: string | null
  sendType: string
  loggedAt: string
}

const MOCK_NAME_POOL = [
  "Warm Grain",
  "Quiet Tension",
  "Soft Commit",
  "Redline Arc",
]

const FALLBACK_TAGS = ["Vertical", "Static", "Crimp"]

function getStableIndex(seed: string, modulo: number) {
  return Array.from(seed).reduce((sum, character) => sum + character.charCodeAt(0), 0) % modulo
}

function toTitleCase(value: string) {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join(" ")
}

function buildCanonicalTags(userTags: string[], climbId: string) {
  const normalizedUserTags = userTags.length > 0 ? userTags.map(toTitleCase) : FALLBACK_TAGS
  const variant = getStableIndex(climbId, 3)

  if (variant === 0) {
    return normalizedUserTags
  }

  if (variant === 1) {
    return Array.from(new Set([...normalizedUserTags.slice(0, 2), "Tension"]))
  }

  return Array.from(new Set([...normalizedUserTags.filter((tag) => tag !== "Compression"), "Static"]))
}

export function buildClimbDetailData(climb: Climb): ClimbDetailData {
  const canonicalTags = buildCanonicalTags(climb.tags, climb.id)
  const userTags = climb.tags.map(toTitleCase)
  const userTagDifferences = userTags.filter((tag) => !canonicalTags.includes(tag))
  const stableIndex = getStableIndex(climb.id, MOCK_NAME_POOL.length)

  return {
    id: climb.id,
    gymGrade: climb.gym_grade,
    climbColor: climb.climbColor,
    officialName: stableIndex % 2 === 0 ? MOCK_NAME_POOL[stableIndex] : null,
    gymName: climb.gym_name,
    referenceImageUrl: climb.photo_url,
    canonicalTags,
    userTags,
    userTagDifferences,
    // TODO: Replace this mock note source with persisted user-specific notes once the backend supports them.
    userNotes:
      stableIndex % 3 === 0
        ? "Left hand bumps better if you stay patient through the feet. The top felt easier once I kept hips close."
        : null,
    sendType: climb.send_type,
    loggedAt: climb.created_at,
  }
}
