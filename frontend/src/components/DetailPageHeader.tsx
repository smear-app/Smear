import type { ReactNode } from "react"
import BackButton from "./BackButton"

type DetailPageHeaderProps = {
  backTo?: string
  backState?: unknown
  backLabel?: string
  backAriaLabel?: string
  children: ReactNode
}

export default function DetailPageHeader({
  backTo,
  backState,
  backLabel = "Back",
  backAriaLabel,
  children,
}: DetailPageHeaderProps) {
  return (
    <>
      <div className="pointer-events-none sticky top-[calc(env(safe-area-inset-top)+1.5rem)] z-40 h-0">
        <BackButton
          to={backTo}
          state={backState}
          label={backLabel}
          ariaLabel={backAriaLabel ?? backLabel}
          size="sm"
          className="pointer-events-auto"
        />
      </div>
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="h-9 w-9 shrink-0" />
        {children}
      </div>
    </>
  )
}
