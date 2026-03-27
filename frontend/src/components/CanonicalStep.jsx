import { useEffect, useRef, useState } from "react"
import { supabase } from "../lib/supabase"
import { gradeToValue } from "../lib/climbs"
import { uploadToCloudinary } from "../lib/cloudinary"
import {
  queryFingerprintCandidates,
  computeConfidenceScore,
  seedCanonicalClimb,
} from "../lib/canonicalClimbs"
import { getClimbColorBadgeStyle } from "../lib/climbColors"
import { useAuth } from "../context/AuthContext"

// Auto-select threshold: top candidate must score ≥80 with a ≥15pt gap to #2
const AUTO_SELECT_MIN_SCORE = 80
const AUTO_SELECT_MIN_GAP = 15

function CanonicalStatusIcon({ status }) {
  if (status === "verified") {
    return (
      <span title="Verified" className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-green-500">
        <svg viewBox="0 0 12 12" fill="none" className="h-2.5 w-2.5">
          <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    )
  }
  if (status === "flagged") {
    return (
      <span title="Flagged" className="h-2.5 w-2.5 flex-shrink-0 animate-pulse rounded-full bg-orange-400" />
    )
  }
  if (status === "disputed") {
    return (
      <span title="Disputed" className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-red-500" />
    )
  }
  if (status === "archived") {
    return (
      <span title="Archived" className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border border-stone-border/50">
        <svg viewBox="0 0 12 12" fill="none" className="h-2.5 w-2.5">
          <rect x="1" y="3" width="10" height="2" rx="0.5" fill="currentColor" className="text-stone-muted/50" />
          <path d="M2 5h8v4a1 1 0 01-1 1H3a1 1 0 01-1-1V5z" fill="currentColor" className="text-stone-muted/50" />
        </svg>
      </span>
    )
  }
  // pending (default)
  return (
    <span title="Pending" className="h-3.5 w-3.5 flex-shrink-0 rounded-full border-2 border-dashed border-stone-muted/60" />
  )
}

function ConfidencePill({ score }) {
  if (score >= 80) {
    return (
      <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
        {score}% match
      </span>
    )
  }
  if (score >= 50) {
    return (
      <span className="rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-700">
        {score}% match
      </span>
    )
  }
  return null
}

function formatRecency(isoString) {
  const days = Math.floor((Date.now() - new Date(isoString).getTime()) / (1000 * 60 * 60 * 24))
  if (days === 0) return "logged today"
  if (days === 1) return "logged yesterday"
  if (days < 7) return `logged ${days}d ago`
  if (days < 30) return `logged ${Math.floor(days / 7)}w ago`
  return `logged ${Math.floor(days / 30)}mo ago`
}

function CandidateRow({ candidate, score, gymGrade, isSelected, onSelect }) {
  const badgeStyle = getClimbColorBadgeStyle(candidate.hold_color)
  const tagLabel = candidate.canonical_tags.length > 0
    ? candidate.canonical_tags.slice(0, 3).map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join(", ")
    : "No tags yet"

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-2xl border px-4 py-3 text-left transition-all duration-200 active:scale-[0.99] ${
        isSelected
          ? "border-ember/40 bg-ember-soft"
          : "border-stone-border bg-stone-surface"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex-shrink-0 rounded-[14px] border px-3 py-1.5 text-center text-sm font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]"
          style={badgeStyle}
        >
          {gymGrade}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-medium text-stone-text">{tagLabel}</p>
            <CanonicalStatusIcon status={candidate.status} />
          </div>
          <p className="mt-0.5 text-xs text-stone-muted">{formatRecency(candidate.last_logged_at)}</p>
        </div>

        <ConfidencePill score={score} />

        <div className={`h-5 w-5 flex-shrink-0 rounded-full border-2 ${
          isSelected ? "border-ember bg-ember" : "border-stone-border bg-stone-surface"
        }`}>
          {isSelected && (
            <svg viewBox="0 0 20 20" fill="white" className="h-full w-full p-0.5">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
      </div>
    </button>
  )
}

function CanonicalStep({ draft, onChange, onSave }) {
  const { user } = useAuth()
  const fileInputRef = useRef(null)
  const [state, setState] = useState("loading") // loading | candidates | seed
  const [scored, setScored] = useState([]) // [{candidate, score}]
  const [selectedId, setSelectedId] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      setState("loading")
      setError(null)

      try {
        const gradeValue = gradeToValue(draft.gymGrade)
        const candidates = await queryFingerprintCandidates(
          draft.gymId,
          gradeValue,
          draft.climbColor ?? "",
        )

        if (candidates.length === 0) {
          setState("seed")
          return
        }

        const withScores = candidates
          .map((c) => ({ candidate: c, score: computeConfidenceScore(c, draft.tags) }))
          .sort((a, b) => b.score - a.score)

        setScored(withScores)

        // Auto-select if top candidate clears threshold with a meaningful gap
        const top = withScores[0]
        const second = withScores[1]
        const gap = second ? top.score - second.score : 100
        if (top.score >= AUTO_SELECT_MIN_SCORE && gap >= AUTO_SELECT_MIN_GAP) {
          setSelectedId(top.candidate.id)
        }

        setState("candidates")
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load candidates")
        setState("seed")
      }
    }

    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleConfirm() {
    if (isSaving) return
    setIsSaving(true)
    setError(null)

    try {
      let canonicalId = null
      let photoOverride = {}

      if (state === "candidates" && selectedId) {
        const selected = scored.find((s) => s.candidate.id === selectedId)
        const isOverride = selected && scored[0].candidate.id !== selectedId

        // Increment counts on the canonical via RPC
        await supabase.rpc("confirm_canonical_climb", {
          p_canonical_id: selectedId,
          p_send_type: draft.sendType.toLowerCase(),
        })

        canonicalId = selectedId
        onChange("canonicalClimbId", canonicalId)
        onChange("confidenceScore", selected?.score ?? null)
        onChange("overrideSignal", isOverride)
      } else {
        // Seed flow: upload photo first so canonical gets the real URL
        let photoUrl = null
        if (draft.photoFile) {
          photoUrl = await uploadToCloudinary(draft.photoFile)
          photoOverride = { photo: photoUrl, photoFile: null }
        } else if (draft.photo && !draft.photo.startsWith("blob:")) {
          photoUrl = draft.photo
        }

        canonicalId = await seedCanonicalClimb(
          draft.gymId,
          gradeToValue(draft.gymGrade),
          draft.climbColor ?? "",
          user.id,
          photoUrl,
        )

        onChange("canonicalClimbId", canonicalId)
        onChange("confidenceScore", null)
        onChange("overrideSignal", false)
      }

      // Trigger the actual climb insert + navigate to success
      await onSave({ ...draft, canonicalClimbId: canonicalId, ...photoOverride })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setIsSaving(false)
    }
  }

  const canConfirm = state === "seed" || (state === "candidates" && selectedId !== null)

  return (
    <div className="flex min-h-0 flex-1 flex-col px-5 pb-5">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="rounded-[30px] border border-stone-border bg-stone-surface p-6">
          {state === "loading" && (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-border border-t-ember" />
              <p className="text-sm text-stone-muted">Finding matching climbs…</p>
            </div>
          )}

          {state === "candidates" && (
            <>
              <h3 className="text-lg font-semibold tracking-tight text-stone-text">
                Is this one of these?
              </h3>
              <p className="mt-1.5 text-xs leading-5 text-stone-muted">
                Tap to confirm which climb you logged. This helps others find it too.
              </p>

              {selectedId && (() => {
                const sel = scored.find((s) => s.candidate.id === selectedId)
                return sel?.candidate.photo_url ? (
                  <img
                    key={selectedId}
                    src={sel.candidate.photo_url}
                    alt="Selected climb"
                    className="mt-4 h-44 w-full rounded-2xl object-cover"
                  />
                ) : (
                  <div className="mt-4 flex h-44 w-full items-center justify-center rounded-2xl bg-stone-border/30">
                    <span className="text-4xl">🧗</span>
                  </div>
                )
              })()}

              <div className="mt-4 space-y-2">
                {scored.map(({ candidate, score }) => (
                  <CandidateRow
                    key={candidate.id}
                    candidate={candidate}
                    score={score}
                    gymGrade={draft.gymGrade}
                    isSelected={selectedId === candidate.id}
                    onSelect={() => setSelectedId(candidate.id)}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedId(null)
                  setState("seed")
                }}
                className="mt-4 w-full text-center text-sm text-stone-muted underline-offset-2 hover:underline"
              >
                None of these — it's a different climb
              </button>
            </>
          )}

          {state === "seed" && (
            <>
              <h3 className="text-lg font-semibold tracking-tight text-stone-text">
                First log of this climb!
              </h3>
              <p className="mt-1.5 text-xs leading-5 text-stone-muted">
                No one has logged this grade + color combo at your gym yet. Your log will create a
                reference others can match against.
              </p>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 flex aspect-[4/3] w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-stone-border bg-stone-alt"
              >
                {draft.photo ? (
                  <img
                    src={draft.photo}
                    alt="Your climb photo"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-stone-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="mt-2 text-sm font-medium text-stone-muted">Add a photo (optional)</p>
                  </>
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  if (draft.photo?.startsWith("blob:")) URL.revokeObjectURL(draft.photo)
                  onChange("photoFile", file)
                  onChange("photo", URL.createObjectURL(file))
                }}
              />
            </>
          )}
        </div>
      </div>

      {error && (
        <p className="mt-2 text-center text-sm text-red-500">{error}</p>
      )}

      {state !== "loading" && (
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!canConfirm || isSaving}
          className={`mt-3 rounded-full px-6 py-4 text-base font-semibold text-stone-surface transition-all duration-200 ${
            canConfirm && !isSaving
              ? "bg-ember hover:bg-ember-dark active:scale-[0.98]"
              : "cursor-not-allowed bg-stone-border text-stone-muted opacity-80"
          }`}
        >
          {isSaving ? "Saving…" : state === "seed" ? "Log New Climb" : "Confirm"}
        </button>
      )}
    </div>
  )
}

export default CanonicalStep
