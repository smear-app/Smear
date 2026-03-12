const SEND_OPTIONS = ["Flash", "Send", "Attempt"]

function SendStep({ draft, onChange, onContinue }) {
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
              className={`rounded-[28px] border px-5 py-6 text-left transition-colors ${
                isSelected
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-transparent bg-slate-100"
              }`}
            >
              <p className="text-lg font-semibold text-slate-900">{option}</p>
              <p className="mt-1 text-sm text-slate-500">
                {option === "Flash" && "Sent first go."}
                {option === "Send" && "Completed after working it out."}
                {option === "Attempt" && "Tried it, but no send yet."}
              </p>
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={onContinue}
        className="mt-6 rounded-full bg-black px-6 py-4 text-base font-semibold text-white transition-transform duration-200 active:scale-[0.98]"
      >
        Continue
      </button>
    </div>
  )
}

export default SendStep
