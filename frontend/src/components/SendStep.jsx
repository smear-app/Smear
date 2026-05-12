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

const ATTEMPT_SLIDER_VALUES = Array.from(
  { length: MAX_SLIDER_ATTEMPTS - MIN_WORKED_ATTEMPTS + 1 },
  (_, index) => MIN_WORKED_ATTEMPTS + index,
)

function getSliderToneClasses(isDisabled) {
  if (isDisabled) {
    return {
      progress: "bg-stone-muted",
      tickActive: "bg-stone-muted",
      tickInactive: "bg-stone-border",
      thumbShell: "bg-stone-surface/70",
      thumbCore: "bg-stone-muted shadow-[0_2px_8px_rgba(46,42,38,0.12)]",
    }
  }

  return {
    progress: "bg-ember",
    tickActive: "bg-ember",
    tickInactive: "bg-[#55585d]",
    thumbShell: "bg-transparent",
    thumbCore: "bg-ember shadow-[0_4px_12px_rgba(46,42,38,0.24)]",
  }
}

function SendStep({ draft, onChange, onContinue }) {
  const attemptState = resolveDraftAttempts(draft)
  const canContinueFromSend = draft.sendType !== "" && attemptState.isValid
  const isWorkedSelection = isWorkedOutcome(draft.sendType)
  const isFlashSelection = isFlashOutcome(draft.sendType)
  const sliderDisabled = !isWorkedSelection || draft.attemptsUseCustom
  const customDisabled = !isWorkedSelection
  const sliderValue = clampSliderAttempts(draft.attemptsSlider)
  const displayAttempts = isFlashSelection ? 1 : attemptState.attempts ?? sliderValue
  const sliderPercent =
    ((sliderValue - MIN_WORKED_ATTEMPTS) / (MAX_SLIDER_ATTEMPTS - MIN_WORKED_ATTEMPTS)) * 100
  const sliderToneClasses = getSliderToneClasses(sliderDisabled)
  const helperText = isFlashSelection
    ? "Flash is always 1 attempt."
    : draft.sendType === ""
      ? "Choose Send or Attempt to log tries."
      : "Log total tries for this session."
  const disabledHelperText = isFlashSelection
    ? "Locked because Flash is always first try."
    : draft.sendType === ""
      ? "Choose Send or Attempt to log tries."
      : draft.attemptsUseCustom
        ? `Enter total tries between ${MIN_WORKED_ATTEMPTS} and ${MAX_CUSTOM_ATTEMPTS}.`
        : "Use Custom for 11+ tries."

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
          className={`rounded-[28px] border px-4 py-4 transition-colors ${
            !isWorkedSelection
              ? "border-stone-border bg-stone-alt/80"
              : "border-ember/15 bg-stone-surface"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-stone-text"># Attempts</p>
              <p className="mt-1 text-sm text-stone-secondary">{helperText}</p>
            </div>
            <div
              className={`inline-flex min-w-[52px] items-center justify-center rounded-full px-3 py-1 text-base font-semibold ${
                !isWorkedSelection
                  ? "bg-stone-border text-stone-muted"
                  : "bg-ember-soft text-ember"
              }`}
            >
              {displayAttempts}
            </div>
          </div>

          <div className={`mt-3 ${!isWorkedSelection ? "opacity-55" : "opacity-100"}`}>
            <div className="min-w-0">
              <div className="relative h-6 pr-1">
                <div className="pointer-events-none absolute inset-x-[10px] inset-y-0">
                  <div className="relative h-full">
                    <div className="absolute left-0 right-0 top-1/2 h-[4px] -translate-y-1/2 rounded-full bg-[#55585d]" />
                    <div
                      className={`absolute left-0 top-1/2 h-[4px] -translate-y-1/2 rounded-full ${sliderToneClasses.progress}`}
                      style={{ width: `${sliderPercent}%` }}
                    />
                    {ATTEMPT_SLIDER_VALUES.map((value) => {
                      const tickPercent =
                        ((value - MIN_WORKED_ATTEMPTS) / (MAX_SLIDER_ATTEMPTS - MIN_WORKED_ATTEMPTS)) * 100
                      const isCompletedTick = value <= sliderValue

                      return (
                        <span
                          key={value}
                          className={`absolute top-1/2 h-[7px] w-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full ${
                            isCompletedTick ? sliderToneClasses.tickActive : sliderToneClasses.tickInactive
                          }`}
                          style={{ left: `${tickPercent}%` }}
                        />
                      )
                    })}
                    <span
                      className={`absolute top-1/2 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full ${sliderToneClasses.thumbShell}`}
                      style={{ left: `${sliderPercent}%` }}
                    >
                      <span className={`h-5 w-5 rounded-full ${sliderToneClasses.thumbCore}`} />
                    </span>
                  </div>
                </div>
                <input
                  type="range"
                  min={MIN_WORKED_ATTEMPTS}
                  max={MAX_SLIDER_ATTEMPTS}
                  step="1"
                  value={sliderValue}
                  disabled={sliderDisabled}
                  onChange={(event) => onChange("attemptsSlider", clampSliderAttempts(Number(event.target.value)))}
                  aria-label="Attempts slider"
                  className="absolute inset-0 z-20 m-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                />
              </div>
              <div className="mt-1.5 flex justify-between text-[11px] font-medium text-stone-muted">
                <span>{MIN_WORKED_ATTEMPTS}</span>
                <span>{MAX_SLIDER_ATTEMPTS}</span>
              </div>
            </div>

            <div className="mt-1.5">
              {isWorkedSelection && draft.attemptsUseCustom && (
                <label className="block">
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
                    disabled={customDisabled}
                    className="app-native-text-entry w-full rounded-[16px] border border-stone-border bg-stone-alt px-4 py-2.5 text-[16px] text-stone-text outline-none transition-colors focus:border-ember/30 disabled:cursor-not-allowed disabled:text-stone-muted"
                  />
                </label>
              )}
              <div className={`flex items-center justify-between gap-3 ${isWorkedSelection && draft.attemptsUseCustom ? "mt-2" : "mt-0"}`}>
                <p className="min-h-[20px] flex-1 text-sm text-stone-secondary">
                  {disabledHelperText}
                </p>
                <label className="flex shrink-0 select-none items-center gap-1.5 text-[13px] text-stone-secondary">
                  <input
                    type="checkbox"
                    checked={isWorkedSelection && draft.attemptsUseCustom}
                    disabled={customDisabled}
                    onChange={(event) => onChange("attemptsUseCustom", event.target.checked)}
                    className="h-4 w-4 rounded border-stone-border bg-stone-alt accent-ember"
                  />
                  <span>Custom</span>
                </label>
              </div>
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
