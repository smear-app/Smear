export type OutcomeTone = "flash" | "send" | "unfinished"

export const OUTCOME_TONE_STYLES: Record<OutcomeTone, string> = {
  flash: "var(--ember)",
  send: "color-mix(in srgb, var(--ember) 48%, white 52%)",
  unfinished: "color-mix(in srgb, var(--stone-secondary) 40%, var(--stone-border) 60%)",
}
