import { Link } from "react-router-dom"
import { getLogbookFilterKeyForTag, groupClimbTags } from "../../lib/climbTags"

type ClimbTagsSectionProps = {
  tags: string[]
}

function formatTag(tag: string) {
  return tag.replace(/_/g, " ")
}

function buildTagHref(tag: string) {
  const normalizedTag = tag.toLowerCase()
  const filterKey = getLogbookFilterKeyForTag(normalizedTag)
  const params = new URLSearchParams({
    view: "list",
    sort: "newest",
  })

  if (filterKey) {
    params.set(filterKey, normalizedTag)
  }

  return `/home/logbook?${params.toString()}`
}

export default function ClimbTagsSection({ tags }: ClimbTagsSectionProps) {
  const groupedTags = groupClimbTags(tags)

  return (
    <section className="rounded-[28px] border border-stone-border/90 bg-stone-alt px-5 py-3.5 shadow-[0_12px_28px_rgba(89,68,51,0.035)]">
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
