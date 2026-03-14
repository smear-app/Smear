export interface ClimbColorOption {
  id: string
  name: string
  hex: string
  borderHex?: string
}

export interface ClimbColorBadgeStyle {
  backgroundColor: string
  borderColor: string
  color: string
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

const DEFAULT_CLIMB_COLOR_BADGE_STYLES: Record<string, ClimbColorBadgeStyle> = {
  red: { backgroundColor: "#EAD7D1", borderColor: "#D9B6AE", color: "#7F3B2B" },
  blue: { backgroundColor: "#DCE4F0", borderColor: "#BAC8DF", color: "#35578B" },
  green: { backgroundColor: "#DCE5D8", borderColor: "#BBCAB5", color: "#496640" },
  yellow: { backgroundColor: "#ECE4C6", borderColor: "#D8C896", color: "#6F5920" },
  purple: { backgroundColor: "#E5DDF0", borderColor: "#CBBBDD", color: "#61478D" },
  pink: { backgroundColor: "#EEDAE3", borderColor: "#D9B7C8", color: "#8B5470" },
  orange: { backgroundColor: "#EBDCCF", borderColor: "#D9BEA8", color: "#8A5327" },
  black: { backgroundColor: "#D8D2CD", borderColor: "#B9B0A8", color: "#2E2A26" },
  white: { backgroundColor: "#F6F2ED", borderColor: "#D9D1C8", color: "#5F554D" },
  gray: { backgroundColor: "#E4DEDA", borderColor: "#C8BFB8", color: "#625952" },
}

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

export function getClimbColorBadgeStyle(
  colorId: string | null | undefined,
  gymSpecificPalette?: ClimbColorOption[] | null,
): ClimbColorBadgeStyle {
  const palette = getClimbColorPalette(gymSpecificPalette)
  const fallbackStyle = DEFAULT_CLIMB_COLOR_BADGE_STYLES[NO_COLOR_FALLBACK_ID]

  if (!colorId) {
    return fallbackStyle
  }

  const paletteMatch = palette.find((option) => option.id === colorId)
  if (!paletteMatch) {
    return fallbackStyle
  }

  // TODO: When gyms provide custom palettes, derive muted badge styles from those gym colors here.
  return DEFAULT_CLIMB_COLOR_BADGE_STYLES[paletteMatch.id] ?? fallbackStyle
}

// TODO: Allow gyms to provide their own palette and fall back to DEFAULT_CLIMB_COLOR_PALETTE otherwise.
// TODO: Reuse this fallback when logged climb cards render an unselected climb as gray.
