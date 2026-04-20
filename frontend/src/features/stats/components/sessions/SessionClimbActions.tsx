import { FiBookOpen, FiChevronDown, FiList } from "react-icons/fi"
import LogbookClimbList from "../../../../components/logbook/LogbookClimbList"
import type { Climb } from "../../../../lib/climbs"

type SessionClimbActionsProps = {
  climbs: Climb[]
  isExpanded: boolean
  isLoading: boolean
  error: string | null
  logbookSessionId: string | null
  detailReturnPath: string
  detailReturnState?: Record<string, unknown>
  onToggleExpanded: () => void
  onOpenLogbook: () => void
}

export default function SessionClimbActions({
  climbs,
  isExpanded,
  isLoading,
  error,
  logbookSessionId,
  detailReturnPath,
  detailReturnState,
  onToggleExpanded,
  onOpenLogbook,
}: SessionClimbActionsProps) {
  const openLogbookDisabled = isLoading || !logbookSessionId

  return (
    <div>
      <div className="flex items-center justify-center gap-1.5">
        <button
          type="button"
          onClick={onToggleExpanded}
          aria-expanded={isExpanded}
          className={`inline-flex min-w-0 items-center justify-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
            isExpanded
              ? "border-ember/20 bg-ember-soft text-ember"
              : "border-stone-border/80 bg-transparent text-stone-secondary hover:bg-stone-alt"
          }`}
        >
          <FiList className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">See Climbs</span>
          <FiChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
        </button>

        <button
          type="button"
          onClick={onOpenLogbook}
          disabled={openLogbookDisabled}
          className={`inline-flex min-w-0 items-center justify-center gap-1.5 rounded-full border border-stone-border/80 bg-transparent px-2.5 py-1.5 text-xs font-semibold text-stone-secondary transition-colors hover:bg-stone-alt ${
            openLogbookDisabled ? "cursor-not-allowed opacity-55" : ""
          }`}
        >
          <FiBookOpen className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">Open in Logbook</span>
        </button>
      </div>

      {isExpanded ? (
        <div className="mt-3 rounded-[20px] border border-stone-border/80 bg-stone-bg/55 p-2 dark:border-white/[0.06] dark:bg-stone-alt/40">
          <div
            className="max-h-[18rem] min-h-[8.5rem] overflow-y-auto overscroll-contain pr-1"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {isLoading ? (
              <div className="flex h-full min-h-[8.5rem] items-center justify-center rounded-[18px] border border-dashed border-stone-border/80 bg-stone-surface/70 px-4 py-6 text-center text-sm text-stone-secondary">
                Loading session climbs...
              </div>
            ) : error ? (
              <div className="flex h-full min-h-[8.5rem] items-center justify-center rounded-[18px] border border-dashed border-red-200 bg-red-50 px-4 py-6 text-center text-sm text-red-600">
                {error}
              </div>
            ) : (
              <LogbookClimbList
                climbs={climbs}
                from={detailReturnPath}
                showMeta={false}
                showLoggedDate={false}
                fromState={detailReturnState}
                emptyState={
                  <div className="flex h-full min-h-[8.5rem] items-center justify-center rounded-[18px] border border-dashed border-stone-border/80 bg-stone-surface/70 px-4 py-6 text-center text-sm text-stone-secondary">
                    No climbs found for this session.
                  </div>
                }
              />
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
