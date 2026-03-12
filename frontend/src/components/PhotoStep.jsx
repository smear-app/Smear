import { useRef } from "react"
import { FiCamera } from "react-icons/fi"

function PhotoStep({ draft, onChange, onContinue }) {
  const fileInputRef = useRef(null)

  const handleSelectPhoto = (event) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    if (draft.photo?.startsWith("blob:")) {
      URL.revokeObjectURL(draft.photo)
    }

    // Store a previewable image URL in the draft so it survives step changes.
    onChange("photo", URL.createObjectURL(file))
  }

  return (
    <div className="flex flex-1 flex-col px-5 pb-5">
      <div className="flex flex-1 items-center justify-center">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex aspect-[4/5] w-full max-w-[320px] flex-col items-center justify-center overflow-hidden rounded-[32px] bg-slate-800 text-white"
        >
          {draft.photo ? (
            <img
              src={draft.photo}
              alt="Selected climb"
              className="h-full w-full object-cover"
            />
          ) : (
            <>
              <FiCamera className="h-10 w-10 text-slate-200" />
              <p className="mt-4 text-lg font-medium">Tap to add photo</p>
            </>
          )}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleSelectPhoto}
        className="hidden"
      />

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

export default PhotoStep
