export const CLIMB_TAG_CATEGORIES = [
  {
    id: "hold",
    title: "Hold Type",
    limit: 2,
    options: ["Crimp", "Sloper", "Pinch", "Pocket", "Jug", "Volume", "Undercling"],
    logbookFilterKey: "holdTypes",
  },
  {
    id: "movement",
    title: "Movement",
    limit: 1,
    options: ["Dynamic", "Static", "Coordination"],
    logbookFilterKey: "movementTypes",
  },
  {
    id: "wall",
    title: "Wall Angle / Terrain",
    limit: 2,
    options: ["Slab", "Vertical", "Overhang", "Cave"],
    logbookFilterKey: "wallTypes",
  },
  {
    id: "mechanic",
    title: "Mechanics",
    limit: 1,
    options: ["Balance", "Power", "Dyno"],
    logbookFilterKey: null,
  },
] as const

export type ClimbTagCategory = (typeof CLIMB_TAG_CATEGORIES)[number]
export type ClimbTagCategoryId = ClimbTagCategory["id"]
export type LogbookTagFilterKey = NonNullable<ClimbTagCategory["logbookFilterKey"]>
export type GroupedClimbTagSection = {
  id: ClimbTagCategoryId | "other"
  title: string
  tags: string[]
}

const TAG_CATEGORY_BY_VALUE = new Map(
  CLIMB_TAG_CATEGORIES.flatMap((category) =>
    category.options.map((tag) => [normalizeClimbTag(tag), category] as const),
  ),
)

const TAG_ORDER_BY_VALUE = new Map(
  CLIMB_TAG_CATEGORIES.flatMap((category) =>
    category.options.map((tag, index) => [normalizeClimbTag(tag), index] as const),
  ),
)

export const WALL_TAGS = CLIMB_TAG_CATEGORIES.find((category) => category.id === "wall")!.options.map(
  normalizeClimbTag,
)

export const HOLD_TAGS = CLIMB_TAG_CATEGORIES.find((category) => category.id === "hold")!.options.map(
  normalizeClimbTag,
)

export const MOVEMENT_TAGS = CLIMB_TAG_CATEGORIES.find((category) => category.id === "movement")!.options.map(
  normalizeClimbTag,
)

export function normalizeClimbTag(value: string) {
  return value.trim().toLowerCase()
}

export function getClimbTagCategory(value: string) {
  return TAG_CATEGORY_BY_VALUE.get(normalizeClimbTag(value)) ?? null
}

export function getClimbTagCategoryId(value: string): ClimbTagCategoryId | null {
  return getClimbTagCategory(value)?.id ?? null
}

export function getClimbTagSelectionCount(tags: string[], categoryId: ClimbTagCategoryId) {
  return tags.filter((tag) => getClimbTagCategoryId(tag) === categoryId).length
}

export function getSelectedTagsForCategory(tags: string[], categoryId: ClimbTagCategoryId) {
  const category = CLIMB_TAG_CATEGORIES.find((entry) => entry.id === categoryId)

  if (!category) {
    return []
  }

  return category.options.filter((tag) => tags.includes(tag))
}

export function isClimbTagSelected(tags: string[], tag: string) {
  return tags.includes(tag)
}

export function isClimbTagDisabled(tags: string[], tag: string) {
  const category = getClimbTagCategory(tag)

  if (!category) {
    return false
  }

  if (isClimbTagSelected(tags, tag)) {
    return false
  }

  return getClimbTagSelectionCount(tags, category.id) >= category.limit
}

export function toggleClimbTag(tags: string[], tag: string) {
  if (isClimbTagSelected(tags, tag)) {
    return tags.filter((currentTag) => currentTag !== tag)
  }

  if (isClimbTagDisabled(tags, tag)) {
    return tags
  }

  return [...tags, tag]
}

export function getLogbookFilterKeyForTag(tag: string): LogbookTagFilterKey | null {
  return getClimbTagCategory(tag)?.logbookFilterKey ?? null
}

export function groupClimbTags(tags: string[]): GroupedClimbTagSection[] {
  const grouped: GroupedClimbTagSection[] = CLIMB_TAG_CATEGORIES.map((category) => ({
    id: category.id,
    title: category.title,
    tags: category.options.filter((tag) => tags.includes(tag)),
  })).filter((category) => category.tags.length > 0)

  const knownTags = new Set<string>(CLIMB_TAG_CATEGORIES.flatMap((category) => category.options))
  const otherTags = tags
    .filter((tag) => !knownTags.has(tag))
    .sort((left, right) => {
      const leftOrder = TAG_ORDER_BY_VALUE.get(normalizeClimbTag(left)) ?? Number.MAX_SAFE_INTEGER
      const rightOrder = TAG_ORDER_BY_VALUE.get(normalizeClimbTag(right)) ?? Number.MAX_SAFE_INTEGER
      return leftOrder - rightOrder || left.localeCompare(right)
    })

  if (otherTags.length > 0) {
    grouped.push({
      id: "other",
      title: "Other",
      tags: otherTags,
    })
  }

  return grouped
}
