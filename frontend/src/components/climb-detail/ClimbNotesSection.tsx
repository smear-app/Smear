type ClimbNotesSectionProps = {
  notes?: string | null
}

export default function ClimbNotesSection({ notes }: ClimbNotesSectionProps) {
  return (
    <section
      className={`rounded-[28px] border border-stone-border/90 bg-[#F6F1EA] px-5 shadow-[0_12px_28px_rgba(89,68,51,0.035)] ${
        notes ? "py-4" : "py-3"
      }`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-muted">
        User Notes
      </p>

      {notes ? (
        <p className="mt-2 text-sm leading-6 text-stone-secondary">{notes}</p>
      ) : (
        <p className="mt-1.5 text-sm text-stone-muted">None</p>
      )}
    </section>
  )
}
