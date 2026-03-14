export interface ClimbColorOption {
  id: string
  name: string
  hex: string
  borderHex?: string
}

export const DEFAULT_CLIMB_COLOR_PALETTE: ClimbColorOption[] = [
  { id: "red", name: "Red", hex: "#D95C4F" },
  { id: "blue", name: "Blue", hex: "#4B77D1" },
  { id: "green", name: "Green", hex: "#5C8C57" },
  { id: "yellow", name: "Yellow", hex: "#E6C24A" },
  { id: "purple", name: "Purple", hex: "#8A67C7" },
  { id: "pink", name: "Pink", hex: "#D87BA5" },
  { id: "orange", name: "Orange", hex: "#D9833F" },
  { id: "black", name: "Black", hex: "#2E2A26" },
  { id: "white", name: "White", hex: "#F8F6F2", borderHex: "#CFC7BE" },
  { id: "gray", name: "Gray", hex: "#9A9086" },
]

export const NO_COLOR_SELECTED_LABEL = "No color selected"
export const NO_COLOR_FALLBACK_ID = "gray"

export function getClimbColorPalette(gymSpecificPalette?: ClimbColorOption[] | null): ClimbColorOption[] {
  if (gymSpecificPalette?.length) {
    return gymSpecificPalette
  }

  return DEFAULT_CLIMB_COLOR_PALETTE
}

export function getClimbColorName(colorId: string | null | undefined): string {
  const match = DEFAULT_CLIMB_COLOR_PALETTE.find((option) => option.id === colorId)
  return match?.name ?? NO_COLOR_SELECTED_LABEL
}

// TODO: Allow gyms to provide their own palette and fall back to DEFAULT_CLIMB_COLOR_PALETTE otherwise.
// TODO: Reuse this fallback when logged climb cards render an unselected climb as gray.
