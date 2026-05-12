export const FLASH_ATTEMPTS = 1
export const DEFAULT_WORKED_ATTEMPTS = 2
export const MIN_WORKED_ATTEMPTS = 2
export const MAX_SLIDER_ATTEMPTS = 10
export const MAX_CUSTOM_ATTEMPTS = 99

export type AttemptValidationResult = {
  attempts: number | null
  isValid: boolean
  helperText: string
}

export function normalizeSendType(value: string | null | undefined): string {
  return value?.trim().toLowerCase() ?? ""
}

export function isWorkedOutcome(value: string | null | undefined): boolean {
  const normalizedValue = normalizeSendType(value)
  return normalizedValue === "send" || normalizedValue === "attempt"
}

export function isFlashOutcome(value: string | null | undefined): boolean {
  return normalizeSendType(value) === "flash"
}

export function clampSliderAttempts(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_WORKED_ATTEMPTS
  }

  return Math.min(MAX_SLIDER_ATTEMPTS, Math.max(MIN_WORKED_ATTEMPTS, Math.round(value)))
}

export function clampCustomAttempts(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_WORKED_ATTEMPTS
  }

  return Math.min(MAX_CUSTOM_ATTEMPTS, Math.max(MIN_WORKED_ATTEMPTS, Math.round(value)))
}

export function sanitizeCustomAttemptsInput(value: string): string {
  return value.replace(/\D+/g, "")
}

function parseCustomAttempts(value: string): number | null {
  const sanitizedValue = sanitizeCustomAttemptsInput(value)
  if (!sanitizedValue) {
    return null
  }

  const parsedValue = Number.parseInt(sanitizedValue, 10)
  return Number.isFinite(parsedValue) ? parsedValue : null
}

export function clampCustomAttemptsInput(value: string): string {
  const parsedValue = parseCustomAttempts(value)
  if (parsedValue == null) {
    return `${DEFAULT_WORKED_ATTEMPTS}`
  }

  return `${clampCustomAttempts(parsedValue)}`
}

export function resolveDraftAttempts(draft: {
  sendType: string
  attemptsSlider: number
  attemptsUseCustom: boolean
  attemptsCustom: string
}): AttemptValidationResult {
  if (isFlashOutcome(draft.sendType)) {
    return {
      attempts: FLASH_ATTEMPTS,
      isValid: true,
      helperText: "Flash is always 1 attempt.",
    }
  }

  if (!draft.sendType) {
    return {
      attempts: null,
      isValid: false,
      helperText: "Choose Send or Attempt to log tries. Flash is always 1 attempt.",
    }
  }

  if (!isWorkedOutcome(draft.sendType)) {
    return {
      attempts: null,
      isValid: false,
      helperText: "Choose a valid outcome to continue.",
    }
  }

  if (!draft.attemptsUseCustom) {
    return {
      attempts: clampSliderAttempts(draft.attemptsSlider),
      isValid: true,
      helperText: "Attempts include the successful try when you send.",
    }
  }

  const parsedCustomAttempts = parseCustomAttempts(draft.attemptsCustom)
  if (parsedCustomAttempts == null) {
    return {
      attempts: null,
      isValid: false,
      helperText: `Enter tries between ${MIN_WORKED_ATTEMPTS} and ${MAX_CUSTOM_ATTEMPTS}.`,
    }
  }

  if (parsedCustomAttempts < MIN_WORKED_ATTEMPTS || parsedCustomAttempts > MAX_CUSTOM_ATTEMPTS) {
    return {
      attempts: null,
      isValid: false,
      helperText: `Custom tries must stay between ${MIN_WORKED_ATTEMPTS} and ${MAX_CUSTOM_ATTEMPTS}.`,
    }
  }

  return {
    attempts: parsedCustomAttempts,
    isValid: true,
    helperText: "Attempts include every try spent on this climb.",
  }
}
