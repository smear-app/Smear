import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react"
import { createPortal } from "react-dom"
import { FiMoreHorizontal } from "react-icons/fi"

type ClimbTileActionsMenuProps = {
  onDelete: () => Promise<void> | void
  onEdit: () => void
}

export default function ClimbTileActionsMenu({
  onDelete,
  onEdit,
}: ClimbTileActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [menuStyle, setMenuStyle] = useState<CSSProperties | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    if (!isOpen) {
      setMenuStyle(null)
      return
    }

    const updatePosition = () => {
      const trigger = triggerRef.current
      const menu = menuRef.current
      if (!trigger || !menu) {
        return
      }

      const triggerRect = trigger.getBoundingClientRect()
      const menuRect = menu.getBoundingClientRect()
      const gap = 6
      const viewportPadding = 12
      const spaceBelow = window.innerHeight - triggerRect.bottom - viewportPadding
      const spaceAbove = triggerRect.top - viewportPadding
      const shouldOpenUpward = spaceBelow < menuRect.height + gap && spaceAbove > spaceBelow

      let top = shouldOpenUpward
        ? triggerRect.top - menuRect.height - gap
        : triggerRect.bottom + gap

      top = Math.max(viewportPadding, Math.min(top, window.innerHeight - menuRect.height - viewportPadding))

      let left = triggerRect.right - menuRect.width
      left = Math.max(viewportPadding, Math.min(left, window.innerWidth - menuRect.width - viewportPadding))

      setMenuStyle({
        position: "fixed",
        top,
        left,
        zIndex: 60,
      })
    }

    updatePosition()
    window.addEventListener("resize", updatePosition)
    window.addEventListener("scroll", updatePosition, true)

    return () => {
      window.removeEventListener("resize", updatePosition)
      window.removeEventListener("scroll", updatePosition, true)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (!containerRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setIsOpen(false)
      }
    }

    window.addEventListener("mousedown", handlePointerDown)
    return () => window.removeEventListener("mousedown", handlePointerDown)
  }, [isOpen])

  const stopTriggerEvent = (event: ReactMouseEvent | ReactPointerEvent) => {
    event.preventDefault()
    event.stopPropagation()
  }

  return (
    <div ref={containerRef} className="absolute inset-y-0 right-1.5 flex items-center">
      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          aria-label="Open climb actions"
          onPointerDown={stopTriggerEvent}
          onClick={(event) => {
            stopTriggerEvent(event)
            setIsOpen((current) => !current)
          }}
          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-transparent text-stone-muted transition-colors hover:bg-stone-alt/70"
        >
          <FiMoreHorizontal className="h-4 w-4" />
        </button>

        {isOpen && typeof document !== "undefined"
          ? createPortal(
              <div
                ref={menuRef}
                style={menuStyle ?? { position: "fixed", top: -9999, left: -9999, zIndex: 60 }}
                className="w-32 rounded-[16px] border border-stone-border bg-stone-surface p-1.5 shadow-[0_18px_38px_rgba(89,68,51,0.16)] dark:shadow-[0_18px_38px_rgba(0,0,0,0.42)]"
              >
                <button
                  type="button"
                  onClick={(event) => {
                    stopTriggerEvent(event)
                    setIsOpen(false)
                    onEdit()
                  }}
                  className="w-full rounded-[12px] px-3 py-2 text-left text-sm font-semibold text-stone-text transition-colors hover:bg-stone-alt"
                >
                  Edit
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={async (event) => {
                    stopTriggerEvent(event)
                    if (!window.confirm("Delete this log?")) {
                      return
                    }

                    setIsDeleting(true)
                    try {
                      await onDelete()
                      setIsOpen(false)
                    } finally {
                      setIsDeleting(false)
                    }
                  }}
                  className="mt-1 w-full rounded-[12px] px-3 py-2 text-left text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
                >
                  Delete
                </button>
              </div>,
              document.body,
            )
          : null}
      </div>
    </div>
  )
}
