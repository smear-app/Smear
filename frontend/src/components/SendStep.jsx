import { SEND_OPTIONS } from "../lib/climbFormOptions"
import {
  MAX_CUSTOM_ATTEMPTS,
  MAX_SLIDER_ATTEMPTS,
  MIN_WORKED_ATTEMPTS,
  clampCustomAttemptsInput,
  clampSliderAttempts,
  isFlashOutcome,
  isWorkedOutcome,
  resolveDraftAttempts,
  sanitizeCustomAttemptsInput,
} from "../lib/climbAttempts"

function getOptionStyles(option, isSelected) {
  if (!isSelected) {
    return "border-stone-border bg-stone-alt"
  }

  if (option === "Flash") {
    return "border-ember/20 bg-ember-soft"
  }

  if (option === "Send") {
    return "border-ember/20 bg-ember-soft"
  }

  return "border-stone-border bg-stone-surface"
}

function SendStep({ draft, onChange, onContinue }) {
  const attemptState = resolveDraftAttempts(draft)
  const canContinueFromSend = draft.sendType !== "" && attemptState.isValid
  const isWorkedSelection = isWorkedOutcome(draft.sendType)
  const isFlashSelection = isFlashOutcome(draft.sendType)
  const attemptsControlDisabled = !isWorkedSelection
  const displayAttempts = isFlashSelection ? 1 : attemptState.attempts ?? clampSliderAttempts(draft.attemptsSlider)

  return (
    <div className="flex flex-1 flex-col px-5 pb-5">
      <div className="flex flex-1 flex-col justify-center gap-4">
        {SEND_OPTIONS.map((option) => {
          const isSelected = draft.sendType === option

          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange("sendType", option)}
              className={`rounded-[28px] border px-5 py-6 text-left transition-colors ${getOptionStyles(option, isSelected)}`}
            >
              <p className={`text-lg font-semibold ${option === "Send" && isSelected ? "text-ember" : option === "Flash" && isSelected ? "text-ember" : "text-stone-text"}`}>
                {option}
              </p>
              <p className="mt-1 text-sm text-stone-secondary">
                {option === "Flash" && "Sent first go."}
                {option === "Send" && "Completed after working it out."}
                {option === "Attempt" && "Tried it, but no send yet."}
              </p>
            </button>
          )
        })}

        <section
          className={`rounded-[28px] border px-5 py-5 transition-colors ${
            attemptsControlDisabled
              ? "border-stone-border bg-stone-alt/80"
              : "border-ember/15 bg-stone-surface"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-stone-text">Attempts</p>
              <p className="mt-1 text-sm text-stone-secondary">{attemptState.helperText}</p>
            </div>
            <div
              className={`inline-flex min-w-[52px] items-center justify-center rounded-full px-3 py-1 text-base font-semibold ${
                attemptsControlDisabled
                  ? "bg-stone-border text-stone-muted"
                  : "bg-ember-soft text-ember"
              }`}
            >
              {displayAttempts}
            </div>
          </div>

          <div className={`mt-4 ${attemptsControlDisabled ? "opacity-55" : "opacity-100"}`}>
            <div className="flex items-center justify-between gap-3">
              <label className="flex min-w-0 flex-1 items-center gap-3">
                <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.14em] text-stone-muted">
                  Slider
                </span>
                <input
                  type="range"
                  min={MIN_WORKED_ATTEMPTS}
                  max={MAX_SLIDER_ATTEMPTS}
                  step="1"
                  value={clampSliderAttempts(draft.attemptsSlider)}
                  disabled={attemptsControlDisabled}
                  onChange={(event) => onChange("attemptsSlider", clampSliderAttempts(Number(event.target.value)))}
                  className="h-2 w-full accent-ember disabled:cursor-not-allowed"
                />
              </label>
              <label className="flex shrink-0 select-none items-center gap-2 text-sm text-stone-secondary">
                <input
                  type="checkbox"
                  checked={isWorkedSelection && draft.attemptsUseCustom}
                  disabled={attemptsControlDisabled}
                  onChange={(event) => onChange("attemptsUseCustom", event.target.checked)}
                  className="h-4 w-4 rounded border-stone-border bg-stone-alt accent-ember"
                />
                <span>Custom</span>
              </label>
            </div>

            <div className="mt-2 flex justify-between text-[11px] font-medium text-stone-muted">
              <span>{MIN_WORKED_ATTEMPTS}</span>
              <span>{MAX_SLIDER_ATTEMPTS}</span>
            </div>

            <div className="mt-4 min-h-[74px]">
              {isWorkedSelection && draft.attemptsUseCustom ? (
                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-muted">
                    Custom tries
                  </span>
                  <input
                    type="text"
                    aria-label="Custom tries"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    enterKeyHint="done"
                    value={draft.attemptsCustom}
                    onChange={(event) => onChange("attemptsCustom", sanitizeCustomAttemptsInput(event.target.value))}
                    onBlur={() => onChange("attemptsCustom", clampCustomAttemptsInput(draft.attemptsCustom))}
                    placeholder={`${MIN_WORKED_ATTEMPTS}`}
                    disabled={attemptsControlDisabled}
                    className="app-native-text-entry w-full rounded-[18px] border border-stone-border bg-stone-alt px-4 py-3 text-[16px] text-stone-text outline-none transition-colors focus:border-ember/30 disabled:cursor-not-allowed disabled:text-stone-muted"
                  />
                  <p className="mt-2 text-sm text-stone-secondary">
                    Enter total tries between {MIN_WORKED_ATTEMPTS} and {MAX_CUSTOM_ATTEMPTS}.
                  </p>
                </label>
              ) : (
                <div className="rounded-[20px] border border-dashed border-stone-border/80 bg-stone-alt/70 px-4 py-3 text-sm text-stone-secondary">
                  {isFlashSelection
                    ? "Locked because Flash is always first try."
                    : attemptsControlDisabled
                      ? "Choose Send or Attempt to log tries."
                      : "Use the slider for quick logging, or switch to Custom for 11+ tries."}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      <div className="mt-6 min-h-[20px]">
        <p
          aria-hidden={canContinueFromSend}
          className={`text-center text-sm text-stone-secondary transition-opacity duration-200 ${
            canContinueFromSend ? "opacity-0" : "opacity-100"
          }`}
        >
          {draft.sendType === "" ? "Complete selection to continue" : attemptState.helperText}
        </p>
      </div>

      <button
        type="button"
        onClick={() => {
          if (canContinueFromSend) {
            onContinue()
          }
        }}
        disabled={!canContinueFromSend}
        className={`mt-6 rounded-full px-6 py-4 text-base font-semibold text-stone-surface transition-all duration-200 ${
          canContinueFromSend
            ? "bg-ember hover:bg-ember-dark active:scale-[0.98]"
            : "cursor-not-allowed bg-stone-border text-stone-muted opacity-80"
        }`}
      >
        Continue
      </button>
    </div>
  )
}

export default SendStep
