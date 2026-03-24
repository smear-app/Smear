import { useEffect, useRef, useState } from "react"

const CLOSE_DRAG_THRESHOLD_PX = 96
const CLOSE_VELOCITY_THRESHOLD = 0.55

function BottomSheet({ isVisible, onClose, closeLabel, children }) {
  const pointerStateRef = useRef({
    pointerId: null,
    startY: 0,
    startTime: 0,
  })
  const dragOffsetRef = useRef(0)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const isNativeIOS =
    typeof document !== "undefined" &&
    document.documentElement.dataset.platform === "capacitor-ios"

  useEffect(() => {
    if (!isVisible) {
      dragOffsetRef.current = 0
      setDragOffset(0)
      setIsDragging(false)
      pointerStateRef.current = {
        pointerId: null,
        startY: 0,
        startTime: 0,
      }
    }
  }, [isVisible])

  const updateDragOffset = (nextOffset) => {
    dragOffsetRef.current = nextOffset
    setDragOffset(nextOffset)
  }

  const resetDrag = () => {
    pointerStateRef.current = {
      pointerId: null,
      startY: 0,
      startTime: 0,
    }
    setIsDragging(false)
    updateDragOffset(0)
  }

  const finishDrag = () => {
    const elapsedMs = Math.max(1, performance.now() - pointerStateRef.current.startTime)
    const velocity = dragOffsetRef.current / elapsedMs
    const shouldClose =
      dragOffsetRef.current >= CLOSE_DRAG_THRESHOLD_PX ||
      (dragOffsetRef.current >= 24 && velocity >= CLOSE_VELOCITY_THRESHOLD)

    resetDrag()

    if (shouldClose) {
      onClose()
    }
  }

  const handlePointerDown = (event) => {
    if (isNativeIOS || !isVisible) {
      return
    }

    pointerStateRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startTime: performance.now(),
    }

    setIsDragging(true)
    updateDragOffset(0)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event) => {
    if (pointerStateRef.current.pointerId !== event.pointerId) {
      return
    }

    const deltaY = Math.max(0, event.clientY - pointerStateRef.current.startY)
    updateDragOffset(deltaY)
  }

  const handlePointerEnd = (event) => {
    if (pointerStateRef.current.pointerId !== event.pointerId) {
      return
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    finishDrag()
  }

  const handleTouchStart = (event) => {
    if (!isNativeIOS || !isVisible) {
      return
    }

    const touch = event.touches[0]

    if (!touch) {
      return
    }

    pointerStateRef.current = {
      pointerId: null,
      startY: touch.clientY,
      startTime: performance.now(),
    }

    setIsDragging(true)
    updateDragOffset(0)
  }

  const handleTouchMove = (event) => {
    if (!isNativeIOS || !isDragging) {
      return
    }

    const touch = event.touches[0]

    if (!touch) {
      return
    }

    const deltaY = Math.max(0, touch.clientY - pointerStateRef.current.startY)
    updateDragOffset(deltaY)
    event.preventDefault()
  }

  const handleTouchEnd = () => {
    if (!isNativeIOS || !isDragging) {
      return
    }

    finishDrag()
  }

  return (
    <div className="fixed inset-0 z-40">
      <button
        type="button"
        aria-label={closeLabel}
        onClick={onClose}
        className={`absolute inset-0 bg-[#2E2A26]/35 transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      />

      <div className="absolute inset-x-0 bottom-0 flex justify-center">
        <div
          className={`flex h-[92vh] w-full max-w-[420px] flex-col overflow-hidden rounded-t-[32px] border border-b-0 border-stone-border bg-stone-surface shadow-[0_-18px_40px_rgba(89,68,51,0.16)] ${
            isDragging ? "" : "transition-transform duration-300"
          } ${isVisible ? "translate-y-0" : "translate-y-full"}`}
          style={isVisible && dragOffset > 0 ? { transform: `translateY(${dragOffset}px)` } : undefined}
        >
          <div
            aria-hidden="true"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            className="flex min-h-11 items-center justify-center py-3"
            style={{ touchAction: isNativeIOS ? "none" : "auto" }}
          >
            <span className="h-1.5 w-14 rounded-full bg-stone-border" />
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

export default BottomSheet
