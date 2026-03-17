import { useEffect, useRef, type ReactNode } from "react"

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

  useEffect(() => {
    if (!open) {
      return undefined
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        onClose()
      }
    }

    window.addEventListener("mousedown", handlePointerDown)
    return () => window.removeEventListener("mousedown", handlePointerDown)
  }, [onClose, open])

  return (
    <div ref={containerRef} className="relative">
      {trigger}

      <div
        className={`absolute top-[calc(100%+0.55rem)] z-30 transition-all duration-150 ${
          align === "left" ? "left-0" : align === "center" ? "left-1/2 -translate-x-1/2" : "right-0"
        } ${
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-1 opacity-0"
        }`}
      >
        <div
          className={`w-[min(18rem,calc(100vw-2.75rem))] rounded-[18px] border border-stone-border bg-stone-surface/98 p-2.5 shadow-[0_20px_48px_rgba(89,68,51,0.16)] backdrop-blur ${panelClassName}`}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
