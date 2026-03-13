import { useEffect, useState } from "react"

const EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)"

function SuccessStep({ draft, onDone }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setIsVisible(true)
    })

    return () => window.cancelAnimationFrame(frameId)
  }, [])

  return (
    <div
      className="flex flex-1 flex-col items-center justify-center px-5 pb-10"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(40px)",
        transition: `transform 350ms ${EASE_OUT}, opacity 350ms ${EASE_OUT}`,
      }}
    >
      <style>{`
        @keyframes success-icon-pop {
          0% {
            opacity: 0;
            transform: scale(0.8);
          }
          70% {
            opacity: 1;
            transform: scale(1.05);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>

      <div
        className="flex h-20 w-20 items-center justify-center rounded-full bg-ember-soft text-5xl shadow-[0_12px_28px_rgba(201,86,26,0.12)]"
        style={{
          opacity: isVisible ? 1 : 0,
          animation: isVisible ? `success-icon-pop 400ms ${EASE_OUT} 80ms both` : "none",
        }}
      >
        🧗
      </div>

      <h2
        className="mt-6 text-2xl font-bold text-stone-text"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "translateY(0)" : "translateY(10px)",
          transition: `transform 300ms ${EASE_OUT} 200ms, opacity 300ms ${EASE_OUT} 200ms`,
        }}
      >
        Climb logged!
      </h2>

      <div
        className="mt-6 w-full space-y-2 rounded-[24px] border border-stone-border bg-stone-alt px-5 py-4"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "translateY(0)" : "translateY(20px)",
          transition: `transform 350ms ${EASE_OUT} 320ms, opacity 350ms ${EASE_OUT} 320ms`,
        }}
      >
        <Row label="Gym" value={draft.gymName} />
        <Row label="Gym grade" value={draft.gymGrade} />
        <Row label="Felt like" value={draft.feltLike} />
        <Row label="Send" value={draft.sendType} />
        <div className="flex items-start justify-between gap-4 pt-1">
          <span className="text-sm text-stone-secondary">Tags</span>
          <div className="flex flex-wrap justify-end gap-1.5">
            {draft.tags.map(tag => (
              <span
                key={tag}
                className="rounded-full border border-stone-border bg-stone-surface px-2.5 py-1 text-xs font-medium text-stone-secondary"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div
        className="mt-8 w-full"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "scale(1)" : "scale(0.98)",
          transition: `transform 250ms ${EASE_OUT} 450ms, opacity 250ms ${EASE_OUT} 450ms`,
        }}
      >
        <button
          type="button"
          onClick={onDone}
          className="w-full rounded-full bg-ember py-4 text-base font-semibold text-stone-surface transition-[transform,background-color,box-shadow] duration-200 hover:bg-ember-dark hover:shadow-[0_10px_24px_rgba(32,24,19,0.12)] active:scale-[0.97]"
        >
          Done
        </button>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-stone-secondary">{label}</span>
      <span className="text-sm font-semibold text-stone-text">{value}</span>
    </div>
  )
}

export default SuccessStep
