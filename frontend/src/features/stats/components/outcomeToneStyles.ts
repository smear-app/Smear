export type OutcomeTone = "flash" | "send" | "unfinished"

export const OUTCOME_TONE_STYLES: Record<OutcomeTone, string> = {
  flash: "var(--ember)",
  send: "color-mix(in srgb, var(--ember) 76%, white 24%)",
  unfinished: "color-mix(in srgb, var(--stone-border) 90%, transparent)",
}
