function SuccessStep({ draft, onDone }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-5 pb-10">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-ember-soft text-5xl shadow-[0_12px_28px_rgba(201,86,26,0.12)]">
        🧗
      </div>

      <h2 className="mt-6 text-2xl font-bold text-stone-text">Climb logged!</h2>

      <div className="mt-6 w-full space-y-2 rounded-[24px] border border-stone-border bg-stone-alt px-5 py-4">
        <Row label="Gym" value={draft.gymName} />
        <Row label="Gym grade" value={draft.gymGrade} />
        <Row label="Felt like" value={draft.feltLike} />
        <Row label="Send" value={draft.sendType} />
        <div className="flex items-start justify-between gap-4 pt-1">
          <span className="text-sm text-stone-secondary">Tags</span>
          <div className="flex flex-wrap justify-end gap-1.5">
            {draft.tags.map(tag => (
              <span
                key={tag}
                className="rounded-full border border-stone-border bg-stone-surface px-2.5 py-1 text-xs font-medium text-stone-secondary"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onDone}
        className="mt-8 w-full rounded-full bg-ember py-4 text-base font-semibold text-stone-surface transition-all duration-200 hover:bg-ember-dark active:scale-[0.98]"
      >
        Done
      </button>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-stone-secondary">{label}</span>
      <span className="text-sm font-semibold text-stone-text">{value}</span>
    </div>
  )
}

export default SuccessStep
