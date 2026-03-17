import { getClimbColorName } from "../../lib/climbColors"
import type { Climb } from "../../lib/climbs"

type ClimbTileTitleProps = {
  climb: Climb
  className?: string
}

function getClimbTileTitle(climb: Climb) {
  const trimmedName = climb.name?.trim()
  if (trimmedName) {
    return trimmedName
  }

  return getClimbColorName(climb.climbColor)
}

export default function ClimbTileTitle({
  climb,
  className = "",
}: ClimbTileTitleProps) {
  return (
    <p className={`truncate text-xs font-bold text-stone-secondary ${className}`.trim()}>
      {getClimbTileTitle(climb)}
    </p>
  )
}
