type ClimbNotesSectionProps = {
  notes?: string | null
}

export default function ClimbNotesSection({ notes }: ClimbNotesSectionProps) {
  return (
    <section className="rounded-[28px] border border-stone-border bg-stone-surface px-5 py-5 shadow-[0_14px_34px_rgba(89,68,51,0.05)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-muted">
        User Notes
      </p>

      {notes ? (
        <p className="mt-3 text-sm leading-6 text-stone-secondary">{notes}</p>
      ) : (
        <div className="mt-3 rounded-[20px] border border-dashed border-stone-border bg-stone-alt px-4 py-4 text-sm text-stone-muted">
          No personal notes yet.
        </div>
      )}
    </section>
  )
}
