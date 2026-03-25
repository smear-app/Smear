import { Capacitor } from "@capacitor/core"
import { useEffect, useRef, useState } from "react"

const CLOSE_DRAG_THRESHOLD_PX = 132
const CLOSE_VELOCITY_THRESHOLD = 0.55
const CLOSE_ANIMATION_MS = 300
const REOPEN_VELOCITY_THRESHOLD = -0.2

function BottomSheet({ isVisible, onClose, closeLabel, children }) {
  const sheetRef = useRef(null)
  const closeTimeoutRef = useRef(null)
  const closeAnimationFrameRef = useRef(null)
  const pointerStateRef = useRef({
    pointerId: null,
    startY: 0,
    startTime: 0,
    lastY: 0,
    lastTime: 0,
  })
  const dragOffsetRef = useRef(0)
  const releaseVelocityRef = useRef(0)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isClosingFromDrag, setIsClosingFromDrag] = useState(false)

  const isNativeIOS = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios"
  const shouldDebugNativeSheet = import.meta.env.DEV && isNativeIOS

  useEffect(() => {
    if (!isVisible) {
      if (closeAnimationFrameRef.current !== null) {
        window.cancelAnimationFrame(closeAnimationFrameRef.current)
        closeAnimationFrameRef.current = null
      }
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current)
        closeTimeoutRef.current = null
      }
      dragOffsetRef.current = 0
      setDragOffset(0)
      setIsDragging(false)
      setIsClosingFromDrag(false)
      pointerStateRef.current = {
        pointerId: null,
        startY: 0,
        startTime: 0,
        lastY: 0,
        lastTime: 0,
      }
      releaseVelocityRef.current = 0
    }
  }, [isVisible])

  useEffect(() => {
    if (!isNativeIOS || !isVisible || typeof window === "undefined") {
      return
    }

    const scrollY = window.scrollY
    const previousHtmlOverflow = document.documentElement.style.overflow
    const previousBodyOverflow = document.body.style.overflow
    const previousBodyPosition = document.body.style.position
    const previousBodyTop = document.body.style.top
    const previousBodyWidth = document.body.style.width
    let lastTouchY = 0

    const findScrollableAncestor = (startNode) => {
      let node = startNode instanceof Element ? startNode : null

      while (node && sheetRef.current?.contains(node)) {
        const styles = window.getComputedStyle(node)
        const overflowY = styles.overflowY
        const canScroll =
          (overflowY === "auto" || overflowY === "scroll") && node.scrollHeight > node.clientHeight

        if (canScroll) {
          return node
        }

        node = node.parentElement
      }

      return null
    }

    const handleDocumentTouchStart = (event) => {
      const touch = event.touches[0]
      lastTouchY = touch ? touch.clientY : 0
    }

    const handleDocumentTouchMove = (event) => {
      const touch = event.touches[0]

      if (!touch) {
        return
      }

      const target = event.target

      if (!sheetRef.current?.contains(target)) {
        event.preventDefault()
        return
      }

      const scrollableAncestor = findScrollableAncestor(target)

      if (!scrollableAncestor) {
        event.preventDefault()
        lastTouchY = touch.clientY
        return
      }

      const deltaY = touch.clientY - lastTouchY
      const isPullingDown = deltaY > 0
      const isPushingUp = deltaY < 0
      const atTop = scrollableAncestor.scrollTop <= 0
      const atBottom =
        scrollableAncestor.scrollTop + scrollableAncestor.clientHeight >= scrollableAncestor.scrollHeight - 1

      if ((isPullingDown && atTop) || (isPushingUp && atBottom)) {
        event.preventDefault()
      }

      lastTouchY = touch.clientY
    }

    document.documentElement.style.overflow = "hidden"
    document.body.style.overflow = "hidden"
    document.body.style.position = "fixed"
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = "100%"

    if (shouldDebugNativeSheet) {
      console.debug("[BottomSheet] iOS scroll lock enabled", { closeLabel, scrollY })
    }

    document.addEventListener("touchstart", handleDocumentTouchStart, { passive: true, capture: true })
    document.addEventListener("touchmove", handleDocumentTouchMove, { passive: false, capture: true })

    return () => {
      document.removeEventListener("touchstart", handleDocumentTouchStart, true)
      document.removeEventListener("touchmove", handleDocumentTouchMove, true)
      document.documentElement.style.overflow = previousHtmlOverflow
      document.body.style.overflow = previousBodyOverflow
      document.body.style.position = previousBodyPosition
      document.body.style.top = previousBodyTop
      document.body.style.width = previousBodyWidth
      window.scrollTo({ top: scrollY, left: 0, behavior: "auto" })

      if (shouldDebugNativeSheet) {
        console.debug("[BottomSheet] iOS scroll lock released", { closeLabel, scrollY })
      }
    }
  }, [closeLabel, isNativeIOS, isVisible, shouldDebugNativeSheet])

  const updateDragOffset = (nextOffset) => {
    dragOffsetRef.current = nextOffset
    setDragOffset(nextOffset)
  }

  const resetDrag = () => {
    pointerStateRef.current = {
      pointerId: null,
      startY: 0,
      startTime: 0,
      lastY: 0,
      lastTime: 0,
    }
    releaseVelocityRef.current = 0
    setIsDragging(false)
    setIsClosingFromDrag(false)
    updateDragOffset(0)
  }

  const getCloseOffset = () => {
    const sheetHeight = sheetRef.current?.getBoundingClientRect().height

    if (sheetHeight && Number.isFinite(sheetHeight)) {
      return sheetHeight
    }

    if (typeof window !== "undefined") {
      return window.innerHeight
    }

    return CLOSE_DRAG_THRESHOLD_PX
  }

  const animateDragClose = () => {
    const startOffset = dragOffsetRef.current
    const closeOffset = getCloseOffset()

    pointerStateRef.current = {
      pointerId: null,
      startY: 0,
      startTime: 0,
      lastY: 0,
      lastTime: 0,
    }
    setIsDragging(false)
    setIsClosingFromDrag(true)
    updateDragOffset(startOffset)

    closeAnimationFrameRef.current = window.requestAnimationFrame(() => {
      closeAnimationFrameRef.current = null
      updateDragOffset(closeOffset)
    })

    closeTimeoutRef.current = window.setTimeout(() => {
      closeTimeoutRef.current = null
      onClose()
    }, CLOSE_ANIMATION_MS)
  }

  const finishDrag = () => {
    const elapsedMs = Math.max(1, performance.now() - pointerStateRef.current.startTime)
    const velocity = dragOffsetRef.current / elapsedMs
    const releaseVelocity = releaseVelocityRef.current
    const crossedCloseThreshold = dragOffsetRef.current >= CLOSE_DRAG_THRESHOLD_PX
    const hasUpwardReleaseIntent = crossedCloseThreshold && releaseVelocity <= REOPEN_VELOCITY_THRESHOLD
    const shouldClose =
      !hasUpwardReleaseIntent &&
      (crossedCloseThreshold || (dragOffsetRef.current >= 24 && velocity >= CLOSE_VELOCITY_THRESHOLD))

    if (shouldDebugNativeSheet) {
      console.debug("[BottomSheet] drag end", {
        closeLabel,
        dragOffset: dragOffsetRef.current,
        velocity,
        releaseVelocity,
        hasUpwardReleaseIntent,
        shouldClose,
      })
    }

    if (shouldClose) {
      animateDragClose()
      return
    }

    resetDrag()
  }

  const handlePointerDown = (event) => {
    if (isNativeIOS || !isVisible || isClosingFromDrag) {
      return
    }

    pointerStateRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startTime: performance.now(),
      lastY: event.clientY,
      lastTime: performance.now(),
    }

    releaseVelocityRef.current = 0
    setIsDragging(true)
    updateDragOffset(0)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event) => {
    if (pointerStateRef.current.pointerId !== event.pointerId) {
      return
    }

    const now = performance.now()
    const elapsedMs = Math.max(1, now - pointerStateRef.current.lastTime)
    releaseVelocityRef.current = (event.clientY - pointerStateRef.current.lastY) / elapsedMs
    pointerStateRef.current.lastY = event.clientY
    pointerStateRef.current.lastTime = now

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
    if (!isNativeIOS || !isVisible || isClosingFromDrag) {
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
      lastY: touch.clientY,
      lastTime: performance.now(),
    }

    releaseVelocityRef.current = 0
    if (shouldDebugNativeSheet) {
      console.debug("[BottomSheet] drag start", {
        closeLabel,
        target:
          event.target instanceof Element
            ? `${event.target.tagName.toLowerCase()}.${event.target.className || ""}`
            : String(event.target),
      })
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

    const now = performance.now()
    const elapsedMs = Math.max(1, now - pointerStateRef.current.lastTime)
    releaseVelocityRef.current = (touch.clientY - pointerStateRef.current.lastY) / elapsedMs
    pointerStateRef.current.lastY = touch.clientY
    pointerStateRef.current.lastTime = now

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
    <div className="fixed inset-0 z-40" style={{ overscrollBehavior: isNativeIOS ? "contain" : "auto" }}>
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
          ref={sheetRef}
          className={`relative flex h-[92vh] w-full max-w-[420px] flex-col overflow-hidden rounded-t-[32px] border border-b-0 border-stone-border bg-stone-surface shadow-[0_-18px_40px_rgba(89,68,51,0.16)] ${
            isDragging ? "" : "transition-transform duration-300"
          } ${isVisible ? "translate-y-0" : "translate-y-full"}`}
          style={{
            ...(dragOffset > 0 ? { transform: `translateY(${dragOffset}px)` } : undefined),
            overscrollBehavior: isNativeIOS ? "contain" : "auto",
          }}
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
            className="absolute left-1/2 top-0 z-10 h-12 w-40 -translate-x-1/2"
            style={{ touchAction: isNativeIOS ? "none" : "auto" }}
          />
          <div className="pointer-events-none flex items-center justify-center pt-3">
            <span className="h-1.5 w-14 rounded-full bg-stone-border" />
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

export default BottomSheet
