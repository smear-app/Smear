import type { ClimbOutcome } from "../primitives"

export type NormalizedOutcome = {
  outcome: ClimbOutcome
  isSend: boolean
  isFlash: boolean
  isAttempt: boolean
  isCompleted: boolean
}

export function normalizeOutcome(value: string | null | undefined): NormalizedOutcome {
  const normalizedValue = value?.trim().toLowerCase()
  const outcome: ClimbOutcome =
    normalizedValue === "flash" || normalizedValue === "send" ? normalizedValue : "attempt"
  const isFlash = outcome === "flash"
  const isSend = outcome === "send" || isFlash

  return {
    outcome,
    isSend,
    isFlash,
    isAttempt: outcome === "attempt",
    isCompleted: isSend,
  }
}
