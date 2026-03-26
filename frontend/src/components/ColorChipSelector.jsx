import {
  NO_COLOR_SELECTED_LABEL,
  getClimbColorName,
  getClimbColorPalette,
} from "../lib/climbColors"

function ColorChipSelector({ value, onChange, options, className = "" }) {
  const palette = getClimbColorPalette(options)
  const selectionLabel = value ? `Selected: ${getClimbColorName(value)}` : NO_COLOR_SELECTED_LABEL

  return (
    <div className={className}>
      <div className="flex justify-center">
        <div className="flex max-w-[272px] flex-wrap justify-center gap-3 sm:max-w-[320px]">
          {palette.map((option) => {
          const isSelected = value === option.id

          return (
            <button
              key={option.id}
              type="button"
              aria-label={option.name}
              aria-pressed={isSelected}
              onClick={() => onChange(isSelected ? null : option.id)}
              className={`relative h-11 w-11 rounded-full border bg-stone-surface transition duration-200 focus:outline-none focus:ring-2 focus:ring-ember/40 focus:ring-offset-2 focus:ring-offset-stone-bg ${
                isSelected
                  ? "scale-105 border-stone-text shadow-[0_0_0_3px_rgba(46,42,38,0.14)]"
                  : "border-stone-border hover:scale-[1.03]"
              }`}
            >
              <span
                aria-hidden="true"
                className="flex h-full w-full items-center justify-center rounded-full text-sm font-semibold"
                style={{
                  backgroundColor: option.hex,
                  border: option.borderHex ? `1px solid ${option.borderHex}` : "none",
                  color: option.id === "white" || option.id === "yellow" ? "var(--stone-text)" : "var(--stone-surface)",
                }}
              >
                {isSelected ? "✓" : ""}
              </span>
            </button>
          )
          })}
        </div>
      </div>

      <p className="mt-3 text-center text-sm text-stone-muted">{selectionLabel}</p>
    </div>
  )
}

export default ColorChipSelector
