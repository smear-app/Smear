import { useRef } from "react"
import { FiCamera } from "react-icons/fi"
import ColorChipSelector from "./ColorChipSelector"
import { getClimbColorPalette } from "../lib/climbColors"

function PhotoStep({ draft, onChange, onContinue }) {
  const fileInputRef = useRef(null)
  const colorOptions = getClimbColorPalette()

  const handleSelectPhoto = (event) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    if (draft.photo?.startsWith("blob:")) {
      URL.revokeObjectURL(draft.photo)
    }

    onChange("photoFile", file)
    onChange("photo", URL.createObjectURL(file))
  }

  return (
    <div className="flex flex-1 flex-col px-5 pb-10">
      <div className="flex flex-1 items-center justify-center">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex aspect-[4/5] w-full max-w-[320px] max-h-[250px] flex-col items-center justify-center overflow-hidden rounded-[32px] border border-stone-border bg-stone-alt text-stone-text shadow-[0_16px_36px_rgba(89,68,51,0.08)]"
        >
          {draft.photo ? (
            <img
              src={draft.photo}
              alt="Selected climb"
              className="h-full w-full object-cover"
            />
          ) : (
            <>
              <FiCamera className="h-10 w-10 text-stone-muted" />
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

      <div className="mt-6">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-muted">
          Climb Color
        </p>
        <ColorChipSelector
          className="mt-3"
          options={colorOptions}
          value={draft.climbColor}
          onChange={(value) => onChange("climbColor", value)}
        />
      </div>

      <button
        type="button"
        onClick={onContinue}
        className="mt-6 rounded-full bg-ember px-6 py-4 text-base font-semibold text-stone-surface transition-all duration-200 hover:bg-ember-dark active:scale-[0.98]"
      >
        Continue
      </button>
    </div>
  )
}

export default PhotoStep
