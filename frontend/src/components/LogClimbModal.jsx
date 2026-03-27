import { useEffect, useMemo, useRef, useState } from "react"
import GradeStep from "./GradeStep"
import BottomSheet from "./BottomSheet"
import CanonicalStep from "./CanonicalStep"
import LogClimbHeader from "./LogClimbHeader"
import SendStep from "./SendStep"
import StepProgress from "./StepProgress"
import SuccessStep from "./SuccessStep"
import TagsStep from "./TagsStep"
import {
  LOG_CLIMB_ROUTE_STEP_INDEX,
  LOG_CLIMB_SUCCESS_STEP_INDEX,
} from "../lib/logClimbFlow"

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
  canonicalClimbId: null,
  confidenceScore: null,
  overrideSignal: false,
}

const CLOSE_ANIMATION_MS = 280

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
      <GradeStep
        draft={draft}
        onChange={(field, value) =>
          setDraft((currentDraft) => ({ ...currentDraft, [field]: value }))
        }
        onContinue={() => setCurrentStep(1)}
      />,
      <SendStep
        draft={draft}
        onChange={(field, value) =>
          setDraft((currentDraft) => ({ ...currentDraft, [field]: value }))
        }
        onContinue={() => setCurrentStep(2)}
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
        onSave={() => setCurrentStep(LOG_CLIMB_ROUTE_STEP_INDEX)}
        saveError={null}
        saveLabel="Continue"
        isSaving={false}
      />,
      <CanonicalStep
        draft={draft}
        onChange={(field, value) =>
          setDraft((currentDraft) => ({ ...currentDraft, [field]: value }))
        }
        onSave={async (finalDraft) => {
          if (isSaving) return
          setSaveError(null)
          setIsSaving(true)
          try {
            await onSave(finalDraft)
            setIsSaving(false)
            setCurrentStep(LOG_CLIMB_SUCCESS_STEP_INDEX)
          } catch (err) {
            setIsSaving(false)
            setSaveError(err instanceof Error ? err.message : "Failed to save climb")
            throw err
          }
        }}
      />,
      <SuccessStep draft={draft} onDone={onDone} title={mode === "edit" ? "Log updated!" : "Climb logged!"} />,
    ],
    [draft, isSaving, mode, onDone, onSave, saveError],
  )

  if (!isRendered) {
    return null
  }

  return (
    <BottomSheet isVisible={isVisible} onClose={onClose} closeLabel="Close log climb">
      {currentStep < LOG_CLIMB_SUCCESS_STEP_INDEX && (
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
    </BottomSheet>
  )
}

export default LogClimbModal
