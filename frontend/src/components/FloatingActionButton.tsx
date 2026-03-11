import { FiPlus } from "react-icons/fi"

const FloatingActionButton = () => {
  return (
    <div className="fixed bottom-20 left-1/2 w-full max-w-[420px] -translate-x-1/2 px-6">
      <button
        type="button"
        aria-label="Add"
        className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-200"
      >
        <FiPlus className="h-6 w-6" />
      </button>
    </div>
  )
}

export default FloatingActionButton
