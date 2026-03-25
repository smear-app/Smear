import { useEffect, useMemo, useRef, useState } from "react"
import GradeStep from "./GradeStep"
import LogClimbHeader from "./LogClimbHeader"
import PhotoStep from "./PhotoStep"
import SendStep from "./SendStep"
import StepProgress from "./StepProgress"
import SuccessStep from "./SuccessStep"
import TagsStep from "./TagsStep"

const EMPTY_DRAFT = {
  name: "",
  gymId: "",
  gymName: "",
  photo: null,
  photoFile: null,
  climbColor: null,
  gymGrade: "",
  feltLike: "",
  sendType: "",
  tags: [],
  notes: "",
}

const CLOSE_ANIMATION_MS = 280

const SUCCESS_STEP = 4

function LogClimbModal({
  isOpen,
  onClose,
  onSave,
  onDone,
  activeGym,
  initialDraft = null,
  mode = "create",
}) {
  const [isRendered, setIsRendered] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [draft, setDraft] = useState(EMPTY_DRAFT)
  const [saveError, setSaveError] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const previousPhotoRef = useRef(null)

  const resetDraft = () => {
    if (previousPhotoRef.current?.startsWith("blob:")) {
      URL.revokeObjectURL(previousPhotoRef.current)
    }

    previousPhotoRef.current = null
    setDraft(EMPTY_DRAFT)
    setCurrentStep(0)
    setIsSaving(false)
  }

  useEffect(() => {
    const currentPhoto = draft.photo
    const previousPhoto = previousPhotoRef.current

    if (previousPhoto && previousPhoto !== currentPhoto && previousPhoto.startsWith("blob:")) {
      URL.revokeObjectURL(previousPhoto)
    }

    previousPhotoRef.current = currentPhoto
  }, [draft.photo])

  useEffect(() => {
    if (isOpen) {
      if (!initialDraft && !activeGym) {
        setIsRendered(false)
        return undefined
      }

      // Reset draft and step each time the sheet is opened fresh.
      resetDraft()
      setSaveError(null)
      setDraft(
        initialDraft ?? {
          ...EMPTY_DRAFT,
          gymId: activeGym.id,
          gymName: activeGym.name,
        },
      )
      setIsVisible(false)
      setIsRendered(true)

      let animationFrameId = 0
      const nextFrame = window.requestAnimationFrame(() => {
        animationFrameId = window.requestAnimationFrame(() => {
          setIsVisible(true)
        })
      })

      return () => {
        window.cancelAnimationFrame(nextFrame)
        window.cancelAnimationFrame(animationFrameId)
      }
    }

    setIsVisible(false)

    const timeoutId = window.setTimeout(() => {
      setIsRendered(false)
    }, CLOSE_ANIMATION_MS)

    return () => window.clearTimeout(timeoutId)
  }, [activeGym, initialDraft, isOpen])

  useEffect(() => {
    return () => {
      if (previousPhotoRef.current?.startsWith("blob:")) {
        URL.revokeObjectURL(previousPhotoRef.current)
      }
    }
  }, [])

  const steps = useMemo(
    () => [
      <PhotoStep
        draft={draft}
        onChange={(field, value) =>
          setDraft((currentDraft) => ({ ...currentDraft, [field]: value }))
        }
        onContinue={() => setCurrentStep(1)}
      />,
      <GradeStep
        draft={draft}
        onChange={(field, value) =>
          setDraft((currentDraft) => ({ ...currentDraft, [field]: value }))
        }
        onContinue={() => setCurrentStep(2)}
      />,
      <SendStep
        draft={draft}
        onChange={(field, value) =>
          setDraft((currentDraft) => ({ ...currentDraft, [field]: value }))
        }
        onContinue={() => setCurrentStep(3)}
      />,
      <TagsStep
        draft={draft}
        onToggleTag={(tag) =>
          setDraft((currentDraft) => ({
            ...currentDraft,
            tags: currentDraft.tags.includes(tag)
              ? currentDraft.tags.filter((currentTag) => currentTag !== tag)
              : [...currentDraft.tags, tag],
          }))
        }
        onSave={async () => {
          if (isSaving) {
            return
          }

          setSaveError(null)
          setIsSaving(true)

          try {
            await onSave(draft)
            setIsSaving(false)
            setCurrentStep(SUCCESS_STEP)
          } catch (err) {
            setIsSaving(false)
            setSaveError(err instanceof Error ? err.message : "Failed to save climb")
          }
        }}
        saveError={saveError}
        saveLabel={mode === "edit" ? "Save Changes" : "Save Climb"}
        isSaving={isSaving}
      />,
      <SuccessStep draft={draft} onDone={onDone} title={mode === "edit" ? "Log updated!" : "Climb logged!"} />,
    ],
    [draft, isSaving, mode, onDone, onSave, saveError],
  )

  if (!isRendered) {
    return null
  }

  return (
    <div className="fixed inset-0 z-40">
      <button
        type="button"
        aria-label="Close log climb"
        onClick={onClose}
        className={`absolute inset-0 bg-stone-text/35 transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      />

      <div className="absolute inset-x-0 bottom-0 flex justify-center">
        <div
          className={`flex h-[92vh] w-full max-w-[420px] flex-col overflow-hidden rounded-t-[32px] border border-b-0 border-stone-border bg-stone-surface shadow-[0_-18px_40px_rgba(89,68,51,0.16)] transition-transform duration-300 ${
            isVisible ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="mx-auto mt-3 h-1.5 w-14 rounded-full bg-stone-border" />
          {currentStep < SUCCESS_STEP && (
            <>
              <LogClimbHeader
                currentStep={currentStep}
                title={mode === "edit" ? "Edit Log" : "Log Climb"}
                onBack={() => setCurrentStep((step) => Math.max(step - 1, 0))}
                onClose={onClose}
              />
              <div className="px-6 pb-1 text-center text-sm text-stone-muted">
                {mode === "edit" ? "Editing at " : "Logging at "}
                <span className="font-semibold text-stone-text">{draft.gymName}</span>
              </div>
              <StepProgress currentStep={currentStep} />
            </>
          )}
          <div className="flex min-h-0 flex-1 flex-col">{steps[currentStep]}</div>
        </div>
      </div>
    </div>
  )
}

export default LogClimbModal
