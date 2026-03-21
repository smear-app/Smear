import { useEffect, useMemo, useRef, useState } from "react"
import { FiCamera, FiChevronDown, FiMapPin, FiX } from "react-icons/fi"
import ColorChipSelector from "./ColorChipSelector"
import { useAuth } from "../context/AuthContext"
import { fetchLoggedGyms } from "../lib/climbs"
import { GRADE_OPTIONS, SEND_OPTIONS, TAG_SECTIONS } from "../lib/climbFormOptions"

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

const EDIT_SECTIONS = [
  {
    id: "canonical",
    title: "Climb details",
    category: "canonical",
  },
  {
    id: "performance",
    title: "Grade Info",
    category: "mixed",
  },
  {
    id: "personal",
    title: "Notes",
    category: "personal",
  },
]

function EditSection({
  title,
  children,
}) {
  return (
    <section className="rounded-[26px] border border-stone-border bg-stone-surface px-4 py-4 shadow-[0_10px_24px_rgba(89,68,51,0.05)]">
      <div className="mb-2.5">
        <h3 className="text-sm font-semibold text-stone-text">{title}</h3>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

function CompactSelectorRow({
  label,
  value,
  children,
  disabled = false,
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[18px] border px-3.5 py-3 transition-colors ${
        disabled
          ? "border-stone-border/60 bg-stone-alt/70 text-stone-secondary"
          : "border-stone-border bg-stone-alt"
      }`}
    >
      <div className="flex items-center gap-2">
        <FiMapPin className="h-3.5 w-3.5 shrink-0 text-stone-secondary" />
        <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-muted">
          {label}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm text-stone-text">{value}</span>
        <FiChevronDown className="h-4 w-4 shrink-0 text-stone-secondary" />
      </div>
      {children}
    </div>
  )
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-muted">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full resize-none rounded-[18px] border border-stone-border bg-stone-alt px-3.5 py-3 text-sm text-stone-text outline-none transition-colors focus:border-ember/30"
      />
    </label>
  )
}

function SelectionChip({
  label,
  isSelected,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${
        isSelected
          ? "border-ember/20 bg-ember-soft text-ember"
          : "border-stone-border bg-stone-alt text-stone-secondary"
      }`}
    >
      {label}
    </button>
  )
}

function TagChip({
  label,
  isSelected,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-2 text-sm font-medium transition-colors ${
        isSelected
          ? "border-ember/25 bg-ember-soft text-ember"
          : "border-stone-border bg-stone-alt text-stone-secondary"
      }`}
    >
      {label}
    </button>
  )
}

export default function EditClimbModal({
  isOpen,
  onClose,
  onSave,
  onDone,
  initialDraft,
  canEditCanonicalFields = true,
}) {
  const { user } = useAuth()
  const [isRendered, setIsRendered] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [draft, setDraft] = useState(EMPTY_DRAFT)
  const [saveError, setSaveError] = useState(null)
  const [availableGyms, setAvailableGyms] = useState([])
  const previousPhotoRef = useRef(null)
  const initialGymRef = useRef({ id: "", name: "" })

  const resetDraft = (nextDraft) => {
    if (previousPhotoRef.current?.startsWith("blob:")) {
      URL.revokeObjectURL(previousPhotoRef.current)
    }

    previousPhotoRef.current = nextDraft.photo
    initialGymRef.current = { id: nextDraft.gymId, name: nextDraft.gymName }
    setDraft(nextDraft)
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
    if (isOpen && initialDraft) {
      setSaveError(null)
      resetDraft({
        ...EMPTY_DRAFT,
        ...initialDraft,
      })
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
  }, [initialDraft, isOpen])

  useEffect(() => {
    return () => {
      if (previousPhotoRef.current?.startsWith("blob:")) {
        URL.revokeObjectURL(previousPhotoRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!isOpen || !user) {
      return undefined
    }

    let cancelled = false

    void fetchLoggedGyms(user.id)
      .then((gyms) => {
        if (!cancelled) {
          setAvailableGyms(gyms)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAvailableGyms([])
        }
      })

    return () => {
      cancelled = true
    }
  }, [isOpen, user])

  const handleChange = (field, value) => {
    setDraft((currentDraft) => {
      if (field === "gymName") {
        const initialGym = initialGymRef.current
        const normalizedValue = value.trim()
        const shouldRestoreGymId = normalizedValue !== "" && normalizedValue === initialGym.name.trim()

        return {
          ...currentDraft,
          gymName: value,
          gymId: shouldRestoreGymId ? initialGym.id : "",
        }
      }

      return {
        ...currentDraft,
        [field]: value,
      }
    })
  }

  const gymOptions = useMemo(() => {
    const optionsById = new Map()

    for (const gym of availableGyms) {
      if (gym.id && gym.name) {
        optionsById.set(gym.id, gym)
      }
    }

    if (draft.gymId && draft.gymName && !optionsById.has(draft.gymId)) {
      optionsById.set(draft.gymId, {
        id: draft.gymId,
        name: draft.gymName,
      })
    }

    return Array.from(optionsById.values())
  }, [availableGyms, draft.gymId, draft.gymName])

  const handleToggleTag = (tag) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      tags: currentDraft.tags.includes(tag)
        ? currentDraft.tags.filter((currentTag) => currentTag !== tag)
        : [...currentDraft.tags, tag],
    }))
  }

  const handleSelectPhoto = (event) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    if (draft.photo?.startsWith("blob:")) {
      URL.revokeObjectURL(draft.photo)
    }

    handleChange("photoFile", file)
    handleChange("photo", URL.createObjectURL(file))
  }

  const handleSave = async () => {
    setSaveError(null)

    try {
      await onSave(draft)
      onDone()
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to save climb")
    }
  }

  const canSave = useMemo(
    () => Boolean(draft.gymGrade && draft.feltLike && draft.sendType && draft.gymName.trim()),
    [draft.feltLike, draft.gymGrade, draft.gymName, draft.sendType],
  )

  if (!isRendered) {
    return null
  }

  return (
    <div className="fixed inset-0 z-40">
      <button
        type="button"
        aria-label="Close edit climb"
        onClick={onClose}
        className={`absolute inset-0 bg-[#2E2A26]/35 transition-opacity duration-300 ${
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

          <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-muted">Edit Climb</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-stone-border bg-stone-alt text-stone-secondary"
              aria-label="Close edit climb"
            >
              <FiX className="h-4.5 w-4.5" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">
            <div className="space-y-4">
              <EditSection {...EDIT_SECTIONS[0]}>
                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-muted">
                    Gym
                  </span>
                  <CompactSelectorRow
                    label="Gym"
                    value={draft.gymName || "Select gym"}
                    disabled={!canEditCanonicalFields}
                  >
                    <select
                      value={draft.gymId || ""}
                      disabled={!canEditCanonicalFields}
                      aria-label="Gym"
                      onChange={(event) => {
                        const selectedGym = gymOptions.find((gym) => gym.id === event.target.value)

                        setDraft((currentDraft) => ({
                          ...currentDraft,
                          gymId: selectedGym?.id ?? "",
                          gymName: selectedGym?.name ?? "",
                        }))
                      }}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-default"
                    >
                      <option value="" disabled>
                        Select gym
                      </option>
                      {gymOptions.map((gym) => (
                        <option key={gym.id} value={gym.id}>
                          {gym.name}
                        </option>
                      ))}
                    </select>
                  </CompactSelectorRow>
                </label>

                <div>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-muted">
                    Photo
                  </p>
                  <div className="rounded-[22px] border border-stone-border bg-stone-alt p-3">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => document.getElementById("edit-climb-photo-input")?.click()}
                        className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[20px] border border-stone-border bg-stone-surface text-stone-muted"
                      >
                        {draft.photo ? (
                          <img src={draft.photo} alt="Selected climb" className="h-full w-full object-cover" />
                        ) : (
                          <FiCamera className="h-7 w-7" />
                        )}
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-stone-text">Climb photo</p>
                        <div className="mt-2.5 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => document.getElementById("edit-climb-photo-input")?.click()}
                            className="rounded-full border border-stone-border bg-stone-surface px-3 py-1.5 text-xs font-semibold text-stone-text"
                          >
                            {draft.photo ? "Replace photo" : "Add photo"}
                          </button>
                          {draft.photo ? (
                            <button
                              type="button"
                              onClick={() => {
                                handleChange("photo", null)
                                handleChange("photoFile", null)
                              }}
                              className="rounded-full border border-stone-border bg-stone-surface px-3 py-1.5 text-xs font-semibold text-stone-secondary"
                            >
                              Remove
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <input
                      id="edit-climb-photo-input"
                      type="file"
                      accept="image/*"
                      onChange={handleSelectPhoto}
                      className="hidden"
                    />
                  </div>
                </div>

                <div>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-muted">
                    Climb color
                  </p>
                  <div className="rounded-[22px] border border-stone-border bg-stone-alt px-3 py-3">
                    <ColorChipSelector value={draft.climbColor} onChange={(value) => handleChange("climbColor", value)} />
                  </div>
                </div>
              </EditSection>

              <EditSection {...EDIT_SECTIONS[1]}>
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-muted">
                    Gym grade
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {GRADE_OPTIONS.map((grade) => (
                      <SelectionChip
                        key={`gym-${grade}`}
                        label={grade}
                        isSelected={draft.gymGrade === grade}
                        onClick={() => handleChange("gymGrade", grade)}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-muted">
                    Felt like
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {GRADE_OPTIONS.map((grade) => (
                      <SelectionChip
                        key={`felt-${grade}`}
                        label={grade}
                        isSelected={draft.feltLike === grade}
                        onClick={() => handleChange("feltLike", grade)}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-muted">
                    Status
                  </p>
                  <div className="grid gap-2">
                    {SEND_OPTIONS.map((option) => {
                      const isSelected = draft.sendType === option

                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => handleChange("sendType", option)}
                          className={`rounded-[20px] border px-4 py-3 text-left transition-colors ${
                            isSelected
                              ? "border-ember/20 bg-ember-soft"
                              : "border-stone-border bg-stone-alt"
                          }`}
                        >
                          <p className={`text-sm font-semibold ${isSelected ? "text-ember" : "text-stone-text"}`}>
                            {option}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </EditSection>

              <EditSection {...EDIT_SECTIONS[2]}>
                <TextAreaField
                  label="Notes"
                  value={draft.notes}
                  onChange={(value) => handleChange("notes", value)}
                  placeholder="How did it feel? Beta notes, tries, or anything you want to remember."
                />

                <div className="space-y-3">
                  {TAG_SECTIONS.map((section) => (
                    <section key={section.title}>
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-muted">
                        {section.title}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {section.options.map((tag) => (
                          <TagChip
                            key={tag}
                            label={tag}
                            isSelected={draft.tags.includes(tag)}
                            onClick={() => handleToggleTag(tag)}
                          />
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              </EditSection>
            </div>
          </div>

          <div className="border-t border-stone-border/80 bg-stone-surface px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
            {saveError ? <p className="mb-3 text-sm text-red-500">{saveError}</p> : null}
            {!canSave ? (
              <p className="mb-3 text-sm text-stone-secondary">
                Gym, gym grade, felt like, and status are required to save changes.
              </p>
            ) : null}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-full border border-stone-border bg-stone-alt px-4 py-3 text-sm font-semibold text-stone-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!canSave}
                className={`flex-1 rounded-full px-4 py-3 text-sm font-semibold text-stone-surface ${
                  canSave ? "bg-ember" : "bg-stone-border text-stone-muted"
                }`}
              >
                Save Climb
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
