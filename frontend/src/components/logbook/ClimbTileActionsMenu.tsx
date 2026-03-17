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
    <div ref={containerRef} className="absolute right-1.5 top-1.5 z-20">
      <button
        type="button"
        aria-label="Open climb actions"
        onPointerDown={stopTriggerEvent}
        onClick={(event) => {
          stopTriggerEvent(event)
          setIsOpen((current) => !current)
        }}
        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-stone-surface/92 text-stone-muted shadow-[0_6px_16px_rgba(89,68,51,0.12)] backdrop-blur transition-colors hover:bg-stone-surface"
      >
        <FiMoreHorizontal className="h-4 w-4" />
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-[calc(100%+0.35rem)] w-32 rounded-[16px] border border-stone-border bg-stone-surface p-1.5 shadow-[0_18px_38px_rgba(89,68,51,0.16)]">
          <button
            type="button"
            onClick={(event) => {
              stopTriggerEvent(event)
              setIsOpen(false)
              onEdit()
            }}
            className="w-full rounded-[12px] px-3 py-2 text-left text-sm font-semibold text-stone-text transition-colors hover:bg-stone-alt"
          >
            Edit log
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
            Delete log
          </button>
        </div>
      ) : null}
    </div>
  )
}
