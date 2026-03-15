type ClimbTagsSectionProps = {
  tags: string[]
}

function formatTag(tag: string) {
  return tag.replace(/_/g, " ")
}

export default function ClimbTagsSection({ tags }: ClimbTagsSectionProps) {
  return (
    <section className="rounded-[28px] border border-stone-border bg-stone-surface px-5 py-5 shadow-[0_14px_34px_rgba(89,68,51,0.05)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-muted">
            Climb Tags
          </p>
          <h2 className="mt-2 text-lg font-semibold text-stone-text">Canonical beta cues</h2>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-stone-border/80 bg-stone-alt px-3.5 py-2 text-sm font-medium capitalize text-stone-secondary"
          >
            {formatTag(tag)}
          </span>
        ))}
      </div>
    </section>
  )
}
