const SEND_OPTIONS = ["Flash", "Send", "Attempt"]

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
  const canContinueFromSend = draft.sendType !== ""

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
      </div>

      <div className="mt-6 min-h-[20px]">
        {!canContinueFromSend ? (
          <p className="text-center text-sm text-stone-secondary">
            Select Flash, Send, or Attempt to continue
          </p>
        ) : null}
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
