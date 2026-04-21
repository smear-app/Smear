import { getClimbTagCategoryId, normalizeClimbTag } from "../../../../lib/climbTags"
import type { EnrichedTag, TagCategory } from "../primitives"

function toTagCategory(categoryId: ReturnType<typeof getClimbTagCategoryId>): TagCategory | null {
  switch (categoryId) {
    case "hold":
      return "holdType"
    case "movement":
      return "movement"
    case "wall":
      return "terrain"
    case "mechanic":
      return "mechanics"
    default:
      return null
  }
}

export function normalizeTag(value: string): EnrichedTag {
  const id = normalizeClimbTag(value)

  return {
    id,
    name: id,
    category: toTagCategory(getClimbTagCategoryId(value)),
  }
}

export function normalizeTags(values: readonly string[] | null | undefined): EnrichedTag[] {
  const tagsById = new Map<string, EnrichedTag>()

  for (const value of values ?? []) {
    const tag = normalizeTag(value)

    if (tag.id) {
      tagsById.set(tag.id, tag)
    }
  }

  return [...tagsById.values()]
}
