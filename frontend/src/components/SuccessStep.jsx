function SuccessStep({ draft, onDone }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-5 pb-10">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-5xl">
        🧗
      </div>

      <h2 className="mt-6 text-2xl font-bold text-slate-900">Climb logged!</h2>

      <div className="mt-6 w-full rounded-[24px] bg-slate-100 px-5 py-4 space-y-2">
        <Row label="Gym" value={draft.gymName} />
        <Row label="Gym grade" value={draft.gymGrade} />
        <Row label="Felt like" value={draft.feltLike} />
        <Row label="Send" value={draft.sendType} />
        <div className="flex items-start justify-between gap-4 pt-1">
          <span className="text-sm text-slate-500">Tags</span>
          <div className="flex flex-wrap justify-end gap-1.5">
            {draft.tags.map(tag => (
              <span
                key={tag}
                className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600"
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
        className="mt-8 w-full rounded-full bg-black py-4 text-base font-semibold text-white active:scale-[0.98] transition-transform duration-200"
      >
        Done
      </button>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-900">{value}</span>
    </div>
  )
}

export default SuccessStep
