import { CLIMB_TAG_CATEGORIES, type ClimbTagCategoryId } from "../../../../lib/climbTags"
import type { ArchetypeSegment, ArchetypeSegmentOption } from "./types"

const ARCHETYPE_SEGMENT_ORDER: ArchetypeSegment[] = ["terrain", "movement", "holds"]

const ARCHETYPE_SEGMENT_CATEGORY_IDS = {
  terrain: "wall",
  movement: "movement",
  holds: "hold",
} satisfies Record<ArchetypeSegment, ClimbTagCategoryId>

function getTagCategoryById(categoryId: ClimbTagCategoryId) {
  const category = CLIMB_TAG_CATEGORIES.find((item) => item.id === categoryId)

  if (!category) {
    throw new Error(`Missing climb tag category: ${categoryId}`)
  }

  return category
}

export function getArchetypeTagCategory(segment: ArchetypeSegment) {
  return getTagCategoryById(ARCHETYPE_SEGMENT_CATEGORY_IDS[segment])
}

export function getArchetypeAxisLabels(segment: ArchetypeSegment) {
  return [...getArchetypeTagCategory(segment).options]
}

export function getArchetypeSegmentOptions(): ArchetypeSegmentOption[] {
  return ARCHETYPE_SEGMENT_ORDER.map((segment) => ({
    value: segment,
    label: getArchetypeTagCategory(segment).title,
  }))
}
