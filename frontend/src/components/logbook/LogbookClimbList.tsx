import type { ReactNode } from "react"
import type { Climb } from "../../lib/climbs"
import LogbookClimbTile from "./LogbookClimbTile"

type LogbookClimbListProps = {
  climbs: Climb[]
  from: string
  showMeta: boolean
  showLoggedDate?: boolean
  className?: string
  emptyState?: ReactNode
  fromState?: Record<string, unknown>
  onDelete?: (climbId: string) => Promise<void> | void
  onEdit?: (climb: Climb) => void
}

export default function LogbookClimbList({
  climbs,
  from,
  showMeta,
  showLoggedDate = true,
  className = "",
  emptyState = null,
  fromState,
  onDelete,
  onEdit,
}: LogbookClimbListProps) {
  const wrapperClassName = ["w-full", climbs.length === 0 ? "h-full min-h-full" : "space-y-1.5", className]
    .filter(Boolean)
    .join(" ")

  if (climbs.length === 0) {
    return emptyState ? <div className={wrapperClassName}>{emptyState}</div> : null
  }

  return (
    <div className={wrapperClassName}>
      {climbs.map((climb) => (
        <LogbookClimbTile
          key={climb.id}
          climb={climb}
          from={from}
          showMeta={showMeta}
          showLoggedDate={showLoggedDate}
          fromState={fromState}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </div>
  )
}
