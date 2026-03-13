import { useEffect, useRef, useState } from "react"

const TAG_SECTIONS = [
  {
    title: "Hold type",
    options: ["Crimp", "Sloper", "Pinch", "Pocket", "Jug"],
  },
  {
    title: "Movement",
    options: ["Dynamic", "Static", "Balance", "Compression", "Tension"],
  },
  {
    title: "Wall angle",
    options: ["Slab", "Vertical", "Overhang", "Cave"],
  },
]

function TagChip({ isSelected, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-w-[88px] rounded-full border px-4 py-2.5 text-sm font-medium transition-all duration-200 active:scale-[0.98] ${
        isSelected
          ? "border-emerald-400 bg-emerald-100 text-emerald-950 shadow-[0_8px_18px_rgba(16,185,129,0.16)]"
          : "border-slate-200 bg-white text-slate-600"
      }`}
    >
      {label}
    </button>
  )
}

function TagsStep({ draft, onToggleTag, onSave, saveError }) {
  const canSaveFromTags = Array.isArray(draft.tags) && draft.tags.length > 0
  const scrollRef = useRef(null)
  const [showFade, setShowFade] = useState(false)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const check = () => setShowFade(el.scrollTop + el.clientHeight < el.scrollHeight - 4)
    check()
    el.addEventListener("scroll", check)
    return () => el.removeEventListener("scroll", check)
  }, [])

  return (
    <div className="flex min-h-0 flex-1 flex-col px-5 pb-5">
      <div className="relative min-h-0 flex-1">
        <div ref={scrollRef} className="h-full overflow-y-auto">
        <div className="rounded-[30px] bg-slate-50/90 p-6">
          <h3 className="text-lg font-semibold tracking-tight text-slate-950">
            Finish the details
          </h3>
          <p className="mt-1.5 max-w-[260px] text-xs leading-5 text-slate-400">
            Pick the holds, movement, and wall angle that best match this climb.
          </p>

          <div className="mt-8 space-y-5">
            {TAG_SECTIONS.map((section) => (
              <section key={section.title}>
                <p className="mb-2.5 text-sm font-medium text-slate-700">
                  {section.title}
                </p>

                <div className="flex flex-wrap gap-2.5">
                  {section.options.map((tag) => {
                    const isSelected = draft.tags.includes(tag)

                    return (
                      <TagChip
                        key={tag}
                        label={tag}
                        isSelected={isSelected}
                        onClick={() => onToggleTag(tag)}
                      />
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
        </div>
        {showFade && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-4 rounded-b-[30px] bg-gradient-to-t from-[#fcfcfa] to-transparent" />
        )}
      </div>

      <div className="mt-3 min-h-[20px]">
        {saveError ? (
          <p className="text-center text-sm text-red-500">{saveError}</p>
        ) : !canSaveFromTags ? (
          <p className="text-center text-sm text-slate-500">
            Select at least one tag to save this climb
          </p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => {
          if (canSaveFromTags) {
            onSave()
          }
        }}
        disabled={!canSaveFromTags}
        className={`mt-3 rounded-full px-6 py-4 text-base font-semibold text-white transition-transform duration-200 ${
          canSaveFromTags
            ? "bg-black active:scale-[0.98]"
            : "cursor-not-allowed bg-black/35 opacity-70"
        }`}
      >
        Save Climb
      </button>
    </div>
  )
}

export default TagsStep
