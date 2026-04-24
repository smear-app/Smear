import { Link } from "react-router-dom"
import ClimbTileActionsMenu from "./ClimbTileActionsMenu"
import CompactClimbTileRow from "./CompactClimbTileRow"
import type { Climb } from "../../lib/climbs"
import type { ClimbDetailReturnState } from "../../lib/navigation"

type LogbookClimbTileProps = {
  climb: Climb
  from: string
  showMeta: boolean
  showLoggedDate?: boolean
  className?: string
  fromState?: ClimbDetailReturnState
  onDelete?: (climbId: string) => Promise<void> | void
  onEdit?: (climb: Climb) => void
}

function formatClimbDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export default function LogbookClimbTile({
  climb,
  from,
  showMeta,
  showLoggedDate = true,
  className = "",
  fromState,
  onDelete,
  onEdit,
}: LogbookClimbTileProps) {
  const metaParts = [climb.gym_name, showLoggedDate ? formatClimbDate(climb.created_at) : null].filter(Boolean)

  return (
    <div className={`relative ${className}`.trim()}>
      {onEdit && onDelete ? (
        <ClimbTileActionsMenu
          onEdit={() => onEdit(climb)}
          onDelete={() => onDelete(climb.id)}
        />
      ) : null}
      <Link
        to={`/climbs/${climb.id}`}
        state={{ climb, from, fromState }}
        className="block rounded-[20px] border border-stone-border/75 bg-stone-surface px-4 py-2 pr-12 shadow-[0_10px_24px_rgba(89,68,51,0.05)] transition-colors duration-150 hover:bg-stone-alt"
      >
        <CompactClimbTileRow
          climb={climb}
          metaText={showMeta ? metaParts.join(" • ") : null}
        />
      </Link>
    </div>
  )
}
