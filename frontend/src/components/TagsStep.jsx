const TAG_OPTIONS = [
  "Slab",
  "Overhang",
  "Crimpy",
  "Dynamic",
  "Powerful",
  "Technical",
  "Pumpy",
  "Fun",
]

function TagsStep({ draft, onToggleTag, onSave }) {
  return (
    <div className="flex flex-1 flex-col px-5 pb-5">
      <div className="flex flex-1 flex-col justify-center">
        <div className="rounded-[28px] bg-slate-100 p-5">
          <h3 className="text-base font-semibold text-slate-900">Add tags</h3>
          <p className="mt-1 text-sm text-slate-500">
            Choose every tag that fits this climb.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            {TAG_OPTIONS.map((tag) => {
              const isSelected = draft.tags.includes(tag)

              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onToggleTag(tag)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    isSelected
                      ? "bg-emerald-500 text-white"
                      : "bg-white text-slate-600"
                  }`}
                >
                  {tag}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onSave}
        className="mt-6 rounded-full bg-black px-6 py-4 text-base font-semibold text-white transition-transform duration-200 active:scale-[0.98]"
      >
        Save Climb
      </button>
    </div>
  )
}

export default TagsStep
