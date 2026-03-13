const GRADE_OPTIONS = [
  "VB",
  "V0",
  "V1",
  "V2",
  "V3",
  "V4",
  "V5",
  "V6",
  "V7",
  "V8",
  "V9",
  "V10",
  "V10+",
]

function GradeSelectorRow({ label, value, onSelect }) {
  return (
    <div className="rounded-[28px] bg-slate-100 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">{label}</h3>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">
          {value || "None"}
        </span>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="flex min-w-max gap-2">
          {GRADE_OPTIONS.map((grade) => {
            const isSelected = value === grade

            return (
              <button
                key={grade}
                type="button"
                onClick={() => onSelect(grade)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  isSelected
                    ? "bg-emerald-500 text-white"
                    : "bg-white text-slate-600"
                }`}
              >
                {grade}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function GradeStep({ draft, onChange, onContinue }) {
  const canContinueFromGrade = draft.gymGrade !== "" && draft.feltLike !== ""

  return (
    <div className="flex flex-1 flex-col px-5 pb-5">
      <div className="flex flex-1 flex-col justify-center gap-4">
        <GradeSelectorRow
          label="Gym Grade"
          value={draft.gymGrade}
          onSelect={(grade) => onChange("gymGrade", grade)}
        />
        <GradeSelectorRow
          label="Felt Like"
          value={draft.feltLike}
          onSelect={(grade) => onChange("feltLike", grade)}
        />
      </div>

      <div className="mt-6 min-h-[20px]">
        {!canContinueFromGrade ? (
          <p className="text-center text-sm text-slate-500">
            Select both Gym Grade and Felt Like to continue
          </p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => {
          if (canContinueFromGrade) {
            onContinue()
          }
        }}
        disabled={!canContinueFromGrade}
        className={`mt-6 rounded-full px-6 py-4 text-base font-semibold text-white transition-transform duration-200 ${
          canContinueFromGrade
            ? "bg-black active:scale-[0.98]"
            : "cursor-not-allowed bg-black/35 opacity-70"
        }`}
      >
        Continue
      </button>
    </div>
  )
}

export default GradeStep
