import { FiChevronLeft, FiChevronRight } from "react-icons/fi"
import type { ReactNode } from "react"
import type { SessionDetail } from "../../domain/sessions/types"
import ProgressionSurface from "../progression/ProgressionSurface"

type SessionSelectorProps = {
  session: SessionDetail
  currentIndex: number
  total: number
  onPrevious: () => void
  onNext: () => void
  actions?: ReactNode
}

export default function SessionSelector({
  session,
  currentIndex,
  total,
  onPrevious,
  onNext,
  actions,
}: SessionSelectorProps) {
  return (
    <ProgressionSurface className="py-4">
      <div className="flex items-center justify-between gap-3">
        <SelectorButton ariaLabel="Previous session" onClick={onPrevious} disabled={currentIndex >= total - 1} icon={<FiChevronLeft className="h-4.5 w-4.5" />} />

        <div className="min-w-0 text-center">
          <p className="truncate text-sm font-semibold text-stone-text">{session.selectorLabel}</p>
          <p className="mt-1 text-[11px] text-stone-secondary">{session.selectorMeta}</p>
        </div>

        <SelectorButton ariaLabel="Next session" onClick={onNext} disabled={currentIndex === 0} icon={<FiChevronRight className="h-4.5 w-4.5" />} />
      </div>
      {actions ? (
        <div className="mt-3 border-t border-stone-border/70 pt-3 dark:border-white/[0.06]">
          {actions}
        </div>
      ) : null}
    </ProgressionSurface>
  )
}

function SelectorButton({
  ariaLabel,
  onClick,
  disabled,
  icon,
}: {
  ariaLabel: string
  onClick: () => void
  disabled: boolean
  icon: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-10 w-10 items-center justify-center rounded-full border border-stone-border bg-stone-bg text-stone-text transition-colors dark:bg-stone-alt ${
        disabled ? "cursor-not-allowed opacity-45" : "hover:bg-stone-alt dark:hover:bg-stone-surface"
      }`}
    >
      {icon}
    </button>
  )
}
