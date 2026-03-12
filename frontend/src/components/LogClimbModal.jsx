import { useEffect, useMemo, useRef, useState } from "react"
import GradeStep from "./GradeStep"
import LogClimbHeader from "./LogClimbHeader"
import PhotoStep from "./PhotoStep"
import SendStep from "./SendStep"
import StepProgress from "./StepProgress"
import TagsStep from "./TagsStep"

const EMPTY_DRAFT = {
  photo: null,
  gymGrade: "",
  feltLike: "",
  sendType: "",
  tags: [],
}

const CLOSE_ANIMATION_MS = 280

function LogClimbModal({ isOpen, onClose, onSave }) {
  const [isRendered, setIsRendered] = useState(isOpen)
  const [isVisible, setIsVisible] = useState(isOpen)
  const [currentStep, setCurrentStep] = useState(0)
  const [draft, setDraft] = useState(EMPTY_DRAFT)
  const previousPhotoRef = useRef(null)

  const resetDraft = () => {
    if (previousPhotoRef.current?.startsWith("blob:")) {
      URL.revokeObjectURL(previousPhotoRef.current)
    }

    previousPhotoRef.current = null
    setDraft(EMPTY_DRAFT)
    setCurrentStep(0)
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
      // Reset draft and step each time the sheet is opened fresh.
      resetDraft()
      setIsRendered(true)

      const nextFrame = window.requestAnimationFrame(() => {
        setIsVisible(true)
      })

      return () => window.cancelAnimationFrame(nextFrame)
    }

    setIsVisible(false)

    const timeoutId = window.setTimeout(() => {
      setIsRendered(false)
    }, CLOSE_ANIMATION_MS)

    return () => window.clearTimeout(timeoutId)
  }, [isOpen])

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
        onSave={() => {
          onSave(draft)
        }}
      />,
    ],
    [draft, onSave],
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
        className={`absolute inset-0 bg-slate-950/40 transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      />

      <div className="absolute inset-x-0 bottom-0 flex justify-center">
        <div
          className={`flex h-[92vh] w-full max-w-[420px] flex-col overflow-hidden rounded-t-[32px] bg-[#fcfcfa] shadow-2xl transition-transform duration-300 ${
            isVisible ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="mx-auto mt-3 h-1.5 w-14 rounded-full bg-slate-200" />
          <LogClimbHeader
            currentStep={currentStep}
            title="Log Climb"
            onBack={() => setCurrentStep((step) => Math.max(step - 1, 0))}
            onClose={onClose}
          />
          <StepProgress currentStep={currentStep} />
          <div className="flex min-h-0 flex-1 flex-col">{steps[currentStep]}</div>
        </div>
      </div>
    </div>
  )
}

export default LogClimbModal
