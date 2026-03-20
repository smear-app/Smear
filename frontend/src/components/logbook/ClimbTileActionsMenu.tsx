import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react"
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
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
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

        {isOpen ? (
          <div className="absolute right-0 top-[calc(100%+0.35rem)] z-10 w-32 rounded-[16px] border border-stone-border bg-stone-surface p-1.5 shadow-[0_18px_38px_rgba(89,68,51,0.16)]">
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
          </div>
        ) : null}
      </div>
    </div>
  )
}
