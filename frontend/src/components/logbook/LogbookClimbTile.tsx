import { Link } from "react-router-dom"
import ClimbStatusPill from "../ClimbStatusPill"
import ClimbTileTitle from "./ClimbTileTitle"
import { getClimbColorBadgeStyle } from "../../lib/climbColors"
import { formatTagLabel, getPrimaryLogbookAttribute } from "../../lib/logbook"
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
  const badgeStyle = getClimbColorBadgeStyle(climb.climbColor)
  const primaryAttribute = getPrimaryLogbookAttribute(climb)

  return (
    <Link
      to={`/climbs/${climb.id}`}
      state={{ climb, from }}
      className={`block rounded-[20px] border border-stone-border/75 bg-stone-surface px-4 py-3 shadow-[0_10px_24px_rgba(89,68,51,0.05)] transition-colors duration-150 hover:bg-[#F8F4ED] ${className}`.trim()}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="rounded-[16px] border px-3 py-1.5 text-sm font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]"
            style={badgeStyle}
          >
            {climb.gym_grade}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <ClimbTileTitle climb={climb} className="min-w-0" />

              {primaryAttribute ? (
                <span className="shrink-0 rounded-full border border-stone-border/70 bg-stone-alt px-2.5 py-0.5 text-[10px] font-medium text-stone-secondary">
                  {formatTagLabel(primaryAttribute)}
                </span>
              ) : null}
            </div>

            {showMeta ? (
              <p className="mt-0.5 truncate text-[11px] text-stone-muted">
                {[climb.gym_name, formatClimbDate(climb.created_at)].filter(Boolean).join(" • ")}
              </p>
            ) : null}
          </div>
        </div>

        <ClimbStatusPill sendType={climb.send_type} className="shrink-0" />
      </div>
    </Link>
  )
}
