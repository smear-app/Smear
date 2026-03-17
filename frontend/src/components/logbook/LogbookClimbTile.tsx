import { Link } from "react-router-dom"
import CompactClimbTileRow from "./CompactClimbTileRow"
import type { Climb } from "../../lib/climbs"

type LogbookClimbTileProps = {
  climb: Climb
  from: string
  showMeta: boolean
  className?: string
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
  className = "",
}: LogbookClimbTileProps) {
  return (
    <Link
      to={`/climbs/${climb.id}`}
      state={{ climb, from }}
      className={`block rounded-[20px] border border-stone-border/75 bg-stone-surface px-4 py-2 shadow-[0_10px_24px_rgba(89,68,51,0.05)] transition-colors duration-150 hover:bg-[#F8F4ED] ${className}`.trim()}
    >
      <CompactClimbTileRow
        climb={climb}
        metaText={showMeta ? [climb.gym_name, formatClimbDate(climb.created_at)].filter(Boolean).join(" • ") : null}
      />
    </Link>
  )
}
