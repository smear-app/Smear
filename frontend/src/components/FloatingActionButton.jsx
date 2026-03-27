import { FiPlus } from "react-icons/fi"

function FloatingActionButton({ onClick, disabled = false }) {
  return (
    <div className="app-safe-fab fixed bottom-20 left-1/2 z-20 w-full max-w-[420px] -translate-x-1/2 px-5">
      <button
        type="button"
        aria-label="Log a climb"
        disabled={disabled}
        onClick={onClick}
        className={`ml-auto flex h-14 w-14 items-center justify-center rounded-full text-stone-surface transition-all duration-200 ${
          disabled
            ? "cursor-not-allowed bg-stone-muted"
            : "bg-ember hover:scale-[1.02] hover:bg-ember-dark active:scale-95"
        }` }
      >
        <FiPlus className="h-6 w-6" />
      </button>
    </div>
  )
}

export default FloatingActionButton
