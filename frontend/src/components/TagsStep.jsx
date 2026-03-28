import { useEffect, useRef, useState } from "react"
import ClimbTagSelector from "./ClimbTagSelector"

function TagsStep({
  draft,
  onTagsChange,
  onSave,
  saveError,
  saveLabel = "Save Climb",
  isSaving = false,
}) {
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
        <div className="rounded-[30px] border border-stone-border bg-stone-surface p-6">
          <h3 className="text-lg font-semibold tracking-tight text-stone-text">
            Finish the details
          </h3>
          <div className="mt-4">
            <ClimbTagSelector
              selectedTags={draft.tags}
              disabled={isSaving}
              onChange={onTagsChange}
            />
          </div>
        </div>
        </div>
        {showFade && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-4 rounded-b-[30px] bg-gradient-to-t from-stone-surface to-transparent" />
        )}
      </div>

      <div className="mt-3 min-h-[20px]">
        {saveError ? (
          <p className="text-center text-sm text-red-500">{saveError}</p>
        ) : isSaving ? (
          <p className="text-center text-sm text-stone-secondary">Saving climb...</p>
        ) : !canSaveFromTags ? (
          <p className="text-center text-sm text-stone-secondary">
            Select at least one tag to save this climb
          </p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => {
          if (canSaveFromTags && !isSaving) {
            onSave()
          }
        }}
        disabled={!canSaveFromTags || isSaving}
        className={`mt-3 rounded-full px-6 py-4 text-base font-semibold text-stone-surface transition-all duration-200 ${
          canSaveFromTags && !isSaving
            ? "bg-ember hover:bg-ember-dark active:scale-[0.98]"
            : "cursor-not-allowed bg-stone-border text-stone-muted opacity-80"
        }`}
      >
        {isSaving ? "Saving…" : saveLabel}
      </button>
    </div>
  )
}

export default TagsStep
