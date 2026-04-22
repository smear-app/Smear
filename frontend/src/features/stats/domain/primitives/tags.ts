import type { EnrichedClimb, EnrichedTag, TagCategory } from "./types"

export type TagCount = {
  id: string
  name: string
  category: TagCategory | null
  count: number
  tag: EnrichedTag
}

export function buildTagCounts(climbs: readonly EnrichedClimb[]): TagCount[] {
  const countsByTag = new Map<string, TagCount>()

  for (const climb of climbs) {
    const uniqueTags = new Map(climb.tags.map((tag) => [tag.id, tag]))

    for (const tag of uniqueTags.values()) {
      const currentCount = countsByTag.get(tag.id)

      countsByTag.set(tag.id, {
        id: tag.id,
        name: tag.name,
        category: tag.category,
        count: (currentCount?.count ?? 0) + 1,
        tag,
      })
    }
  }

  return [...countsByTag.values()].sort((left, right) => right.count - left.count || left.id.localeCompare(right.id))
}
