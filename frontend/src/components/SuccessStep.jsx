import { useEffect, useRef, useState } from "react"

const EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)"
const CHALK_EASE = "cubic-bezier(0.16, 1, 0.3, 1)"
const EXIT_ANIMATION_MS = 320

function SuccessStep({ draft, onDone, title = "Climb logged!" }) {
  const [isVisible, setIsVisible] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const doneTimeoutRef = useRef(null)

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setIsVisible(true)
    })

    return () => {
      window.cancelAnimationFrame(frameId)
      if (doneTimeoutRef.current) {
        window.clearTimeout(doneTimeoutRef.current)
      }
    }
  }, [])

  function handleDoneClick() {
    if (isClosing) return

    // Closing animation: let the success content gently release downward before dismissing.
    setIsClosing(true)
    doneTimeoutRef.current = window.setTimeout(() => {
      onDone()
    }, EXIT_ANIMATION_MS)
  }

  return (
    <div
      className="flex flex-1 flex-col items-center justify-center px-5 pb-10"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0) scale(1)" : "translateY(40px) scale(1)",
        transition: `transform 350ms ${EASE_OUT}, opacity 350ms ${EASE_OUT}`,
        animation: isClosing ? `success-close ${EXIT_ANIMATION_MS}ms both` : "none",
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

        /* Reward accent: a very soft chalk bloom that breathes out behind the icon once. */
        @keyframes chalk-puff {
          0% {
            opacity: 0;
            transform: scale(0.85);
          }
          30% {
            opacity: 0.18;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(1.15);
          }
        }

        /* Reward accent: a restrained emphasis bounce for the grade badge only. */
        @keyframes grade-badge-bounce {
          0% {
            transform: scale(1);
          }
          40% {
            transform: scale(1.08);
          }
          72% {
            transform: scale(0.98);
          }
          100% {
            transform: scale(1);
          }
        }

        /* Closing animation: a tiny lift before a soft downward release. */
        @keyframes success-close {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          30% {
            opacity: 1;
            transform: translateY(-6px) scale(1.003);
          }
          100% {
            opacity: 0;
            transform: translateY(20px) scale(0.995);
          }
        }
      `}</style>

      <div
        className="relative flex h-20 w-20 items-center justify-center"
      >
        {/* Reward accent: layered, blurred chalk shapes kept quiet and behind the icon. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-stone-alt blur-xl"
          style={{
            opacity: 0,
            animation: isVisible ? `chalk-puff 620ms ${CHALK_EASE} 120ms both` : "none",
          }}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-[42%] top-[48%] h-10 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ember-soft blur-lg"
          style={{
            opacity: 0,
            animation: isVisible ? `chalk-puff 560ms ${CHALK_EASE} 160ms both` : "none",
          }}
        />

        <div
          className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-ember-soft text-5xl shadow-[0_12px_28px_rgba(201,86,26,0.12)]"
          style={{
            opacity: isVisible ? 1 : 0,
            animation: isVisible ? `success-icon-pop 400ms ${EASE_OUT} 80ms both` : "none",
          }}
        >
          🧗
        </div>
      </div>

      <h2
        className="mt-6 text-2xl font-bold text-stone-text"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "translateY(0)" : "translateY(10px)",
          transition: `transform 300ms ${EASE_OUT} 200ms, opacity 300ms ${EASE_OUT} 200ms`,
        }}
      >
        {title}
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
        <Row label="Gym grade" value={draft.gymGrade} isGradeBadge={true} isVisible={isVisible} />
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
          onClick={handleDoneClick}
          disabled={isClosing}
          className="w-full rounded-full bg-ember py-4 text-base font-semibold text-stone-surface transition-[transform,background-color,box-shadow] duration-200 hover:bg-ember-dark hover:shadow-[0_10px_24px_rgba(32,24,19,0.12)] active:scale-[0.97]"
        >
          Done
        </button>
      </div>
    </div>
  )
}

function Row({ label, value, isGradeBadge = false, isVisible = false }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-stone-secondary">{label}</span>
      {isGradeBadge ? (
        <span
          className="inline-flex min-w-11 items-center justify-center rounded-full border border-ember/15 bg-ember-soft px-3 py-1 text-sm font-semibold text-stone-text shadow-[0_4px_12px_rgba(201,86,26,0.08)]"
          style={{
            animation: isVisible ? `grade-badge-bounce 400ms ${EASE_OUT} 820ms both` : "none",
            transformOrigin: "center",
          }}
        >
          {value}
        </span>
      ) : (
        <span className="text-sm font-semibold text-stone-text">{value}</span>
      )}
    </div>
  )
}

export default SuccessStep
