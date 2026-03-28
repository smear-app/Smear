import ColorChipSelector from "./ColorChipSelector"
import { GRADE_OPTIONS } from "../lib/climbFormOptions"
import { getClimbColorPalette } from "../lib/climbColors"

const GRADE_ROW_SCROLL_STYLE = {
  WebkitOverflowScrolling: "touch",
  touchAction: "pan-x",
}

function GradeSelectorRow({ label, value, onSelect }) {
  return (
    <div className="rounded-[28px] border border-stone-border bg-stone-alt p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-stone-text">{label}</h3>
        <span className="rounded-full border border-stone-border/80 bg-stone-surface px-3 py-1 text-xs font-semibold text-stone-secondary">
          {value || "None"}
        </span>
      </div>

      <div
        data-horizontal-scroll="true"
        className="overflow-x-auto pb-1"
        style={GRADE_ROW_SCROLL_STYLE}
      >
        <div className="flex min-w-max gap-2">
          {GRADE_OPTIONS.map((grade) => {
            const isSelected = value === grade

            return (
              <button
                key={grade}
                type="button"
                onClick={() => onSelect(grade)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                  isSelected
                    ? "border-ember bg-ember text-stone-surface"
                    : "border-stone-border/80 bg-stone-surface text-stone-secondary"
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
  const colorOptions = getClimbColorPalette()
  const canContinueFromGrade =
    draft.gymGrade !== "" && draft.feltLike !== "" && draft.climbColor !== null

  return (
    <div className="flex flex-1 flex-col px-5 pb-5">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="space-y-4">
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
          <div className="rounded-[28px] border border-stone-border bg-stone-alt p-4">
            <h3 className="mb-4 text-sm font-semibold text-stone-text">
              Climb Color
            </h3>
            <ColorChipSelector
              options={colorOptions}
              value={draft.climbColor}
              onChange={(value) => onChange("climbColor", value)}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 min-h-[20px]">
        <p
          aria-hidden={canContinueFromGrade}
          className={`text-center text-sm text-stone-secondary transition-opacity duration-200 ${
            canContinueFromGrade ? "opacity-0" : "opacity-100"
          }`}
        >
          Complete all selections to continue
        </p>
      </div>

      <button
        type="button"
        onClick={() => {
          if (canContinueFromGrade) {
            onContinue()
          }
        }}
        disabled={!canContinueFromGrade}
        className={`mt-6 rounded-full px-6 py-4 text-base font-semibold text-stone-surface transition-all duration-200 ${
          canContinueFromGrade
            ? "bg-ember hover:bg-ember-dark active:scale-[0.98]"
            : "cursor-not-allowed bg-stone-border text-stone-muted opacity-80"
        }`}
      >
        Continue
      </button>
    </div>
  )
}

export default GradeStep
