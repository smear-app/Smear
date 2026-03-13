import { FiPlus } from "react-icons/fi"

function FloatingActionButton({ onClick }) {
  return (
    <div className="fixed bottom-20 left-1/2 z-20 w-full max-w-[420px] -translate-x-1/2 px-5">
      <button
        type="button"
        aria-label="Log a climb"
        onClick={onClick}
        className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_16px_32px_rgba(16,185,129,0.32)] transition-transform duration-200 hover:scale-[1.02] active:scale-95"
      >
        <FiPlus className="h-6 w-6" />
      </button>
    </div>
  )
}

export default FloatingActionButton
