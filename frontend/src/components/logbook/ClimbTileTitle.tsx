import { getClimbColorName } from "../../lib/climbColors"
import type { Climb } from "../../lib/climbs"

type ClimbTileTitleProps = {
  climb: Climb
  className?: string
}

function getClimbTileTitle(climb: Climb) {
  const trimmedName = climb.name?.trim()
  if (trimmedName) {
    return {
      label: trimmedName,
      isFallback: false,
    }
  }

  if (climb.climbColor) {
    return {
      label: getClimbColorName(climb.climbColor),
      isFallback: false,
    }
  }

  return {
    label: "Unknown",
    isFallback: true,
  }
}

export default function ClimbTileTitle({
  climb,
  className = "",
}: ClimbTileTitleProps) {
  const { label, isFallback } = getClimbTileTitle(climb)

  return (
    <p
      className={`truncate text-xs font-bold ${isFallback ? "text-stone-muted/70" : "text-stone-secondary"} ${className}`.trim()}
    >
      {label}
    </p>
  )
}
