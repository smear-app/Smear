import { LOG_CLIMB_STEP_LABELS } from "../lib/logClimbFlow"

function StepProgress({ currentStep }) {
  return (
    <div className="px-5 pb-5">
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${LOG_CLIMB_STEP_LABELS.length}, minmax(0, 1fr))` }}
      >
        {LOG_CLIMB_STEP_LABELS.map((label, index) => {
          const isActive = index <= currentStep

          return (
            <div key={label} className="min-w-0">
              <div
                className={`h-1 rounded-full transition-colors duration-300 ${
                  isActive ? "bg-ember" : "bg-stone-border"
                }`}
              />
              <p
                className={`mt-2 text-center text-[11px] font-medium ${
                  isActive ? "text-stone-text" : "text-stone-muted"
                }`}
              >
                {label}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default StepProgress
