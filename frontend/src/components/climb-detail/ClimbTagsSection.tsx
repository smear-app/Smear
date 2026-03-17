import { getTagCategory } from "../../lib/logbook"
import { Link } from "react-router-dom"

type ClimbTagsSectionProps = {
  tags: string[]
}

const TAG_GROUPS = [
  { title: "Hold Type", tags: ["Crimp", "Sloper", "Pinch", "Pocket", "Jug"] },
  { title: "Movement", tags: ["Dynamic", "Static", "Balance", "Compression", "Tension"] },
  { title: "Wall Angle", tags: ["Slab", "Vertical", "Overhang", "Cave"] },
]

function formatTag(tag: string) {
  return tag.replace(/_/g, " ")
}

function buildTagHref(tag: string) {
  const normalizedTag = tag.toLowerCase()
  const category = getTagCategory(normalizedTag)
  const params = new URLSearchParams({
    view: "list",
    sort: "newest",
  })

  if (category === "wall") {
    params.set("wallTypes", normalizedTag)
  } else if (category === "hold") {
    params.set("holdTypes", normalizedTag)
  } else if (category === "movement") {
    params.set("movementTypes", normalizedTag)
  }

  return `/home/logbook?${params.toString()}`
}

function groupTags(tags: string[]) {
  const grouped = TAG_GROUPS
    .map((group) => ({
      title: group.title,
      tags: tags.filter((tag) => group.tags.includes(tag)),
    }))
    .filter((group) => group.tags.length > 0)

  const knownTags = new Set(TAG_GROUPS.flatMap((group) => group.tags))
  const otherTags = tags.filter((tag) => !knownTags.has(tag))

  if (otherTags.length > 0) {
    grouped.push({ title: "Other", tags: otherTags })
  }

  return grouped
}

export default function ClimbTagsSection({ tags }: ClimbTagsSectionProps) {
  const groupedTags = groupTags(tags)

  return (
    <section className="rounded-[28px] border border-stone-border/90 bg-[#F6F1EA] px-5 py-3.5 shadow-[0_12px_28px_rgba(89,68,51,0.035)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-muted">
        Climb Tags
      </p>

      <div className="mt-2.5 space-y-2.5">
        {groupedTags.map((group) => (
          <section key={group.title}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-muted">
              {group.title}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {group.tags.map((tag) => (
                <Link
                  key={tag}
                  to={buildTagHref(tag)}
                  className="rounded-full border border-stone-border/70 bg-stone-surface/85 px-2 py-0.5 text-[10px] font-medium capitalize text-stone-secondary"
                >
                  {formatTag(tag)}
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  )
}
