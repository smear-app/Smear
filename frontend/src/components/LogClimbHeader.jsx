import { FiArrowLeft, FiX } from "react-icons/fi"

function LogClimbHeader({ currentStep, title, onBack, onClose }) {
  const showBackButton = currentStep > 0

  return (
    <header className="grid grid-cols-[48px_1fr_48px] items-center px-4 pb-4 pt-3">
      <div className="flex justify-start">
        {showBackButton ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Go back"
            className="flex h-10 w-10 items-center justify-center rounded-full text-stone-secondary transition-colors hover:bg-stone-alt"
          >
            <FiArrowLeft className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      <h2 className="text-center text-base font-semibold text-stone-text">
        {title}
      </h2>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close log climb"
          className="flex h-10 w-10 items-center justify-center rounded-full text-stone-secondary transition-colors hover:bg-stone-alt"
        >
          <FiX className="h-5 w-5" />
        </button>
      </div>
    </header>
  )
}

export default LogClimbHeader
