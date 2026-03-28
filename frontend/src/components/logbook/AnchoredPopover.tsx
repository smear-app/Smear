import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"
import SurfaceLayer from "../surfaces/SurfaceLayer"

type AnchoredPopoverProps = {
  open: boolean
  onClose: () => void
  trigger: ReactNode
  children: ReactNode
  align?: "left" | "center" | "right"
  panelClassName?: string
}

export default function AnchoredPopover({
  open,
  onClose,
  trigger,
  children,
  align = "right",
  panelClassName = "",
}: AnchoredPopoverProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const [panelStyle, setPanelStyle] = useState<CSSProperties | null>(null)

  useLayoutEffect(() => {
    if (!open) {
      return
    }

    const updatePosition = () => {
      const container = containerRef.current
      const panel = panelRef.current

      if (!container || !panel) {
        return
      }

      const containerRect = container.getBoundingClientRect()
      const panelRect = panel.getBoundingClientRect()
      const gap = 9
      const viewportPadding = 12
      const availableBelow = window.innerHeight - containerRect.bottom - viewportPadding
      const availableAbove = containerRect.top - viewportPadding
      const shouldOpenUpward = availableBelow < panelRect.height + gap && availableAbove > availableBelow

      let top = shouldOpenUpward
        ? containerRect.top - panelRect.height - gap
        : containerRect.bottom + gap
      top = Math.max(viewportPadding, Math.min(top, window.innerHeight - panelRect.height - viewportPadding))

      let left =
        align === "left"
          ? containerRect.left
          : align === "center"
            ? containerRect.left + containerRect.width / 2 - panelRect.width / 2
            : containerRect.right - panelRect.width

      left = Math.max(viewportPadding, Math.min(left, window.innerWidth - panelRect.width - viewportPadding))

      setPanelStyle({
        position: "fixed",
        top,
        left,
      })
    }

    updatePosition()
    window.addEventListener("resize", updatePosition)
    window.addEventListener("scroll", updatePosition, true)

    return () => {
      window.removeEventListener("resize", updatePosition)
      window.removeEventListener("scroll", updatePosition, true)
    }
  }, [align, open])

  return (
    <div ref={containerRef} className="relative">
      {trigger}

      {open ? (
        <SurfaceLayer open onBackdropPress={onClose} backdropClassName="bg-transparent">
          <div
            ref={panelRef}
            style={panelStyle ?? { position: "fixed", top: -9999, left: -9999 }}
            className="pointer-events-auto"
          >
            <div
              className={`w-[min(18rem,calc(100vw-2.75rem))] rounded-[18px] border border-stone-border bg-stone-surface/98 p-2.5 shadow-[0_20px_48px_rgba(89,68,51,0.16)] backdrop-blur dark:shadow-[0_20px_48px_rgba(0,0,0,0.44)] ${panelClassName}`}
            >
              {children}
            </div>
          </div>
        </SurfaceLayer>
      ) : null}
    </div>
  )
}
