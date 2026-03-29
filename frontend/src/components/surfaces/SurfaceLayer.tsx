import type { ReactNode } from "react"
import { createPortal } from "react-dom"
import { useDocumentScrollLock } from "../../hooks/useDocumentScrollLock"

type SurfaceLayerProps = {
  open: boolean
  children: ReactNode
  onBackdropPress?: () => void
  backdropClassName?: string
  zIndexClassName?: string
  lockScroll?: boolean
}

export default function SurfaceLayer({
  open,
  children,
  onBackdropPress,
  backdropClassName = "bg-transparent",
  zIndexClassName = "z-50",
  lockScroll = true,
}: SurfaceLayerProps) {
  useDocumentScrollLock(open && lockScroll)

  if (!open || typeof document === "undefined") {
    return null
  }

  return createPortal(
    <div className={`fixed inset-0 ${zIndexClassName}`} style={{ overscrollBehavior: "contain" }}>
      <div
        aria-hidden="true"
        className={`absolute inset-0 ${backdropClassName}`}
        onPointerDown={(event) => {
          event.stopPropagation()
        }}
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          onBackdropPress?.()
        }}
      />
      <div className="relative h-full w-full pointer-events-none">{children}</div>
    </div>,
    document.body,
  )
}
