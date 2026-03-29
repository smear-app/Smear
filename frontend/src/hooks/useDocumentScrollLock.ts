import { useEffect } from "react"

type ScrollLockSnapshot = {
  scrollY: number
  htmlOverflow: string
  htmlOverscrollBehavior: string
  bodyOverflow: string
  bodyPosition: string
  bodyTop: string
  bodyLeft: string
  bodyRight: string
  bodyWidth: string
  bodyPaddingRight: string
  bodyOverscrollBehavior: string
}

let activeScrollLocks = 0
let scrollLockSnapshot: ScrollLockSnapshot | null = null

function acquireDocumentScrollLock() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return () => undefined
  }

  activeScrollLocks += 1

  if (activeScrollLocks === 1) {
    const html = document.documentElement
    const { body } = document
    const scrollY = window.scrollY
    const scrollbarCompensation = Math.max(0, window.innerWidth - html.clientWidth)

    scrollLockSnapshot = {
      scrollY,
      htmlOverflow: html.style.overflow,
      htmlOverscrollBehavior: html.style.overscrollBehavior,
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyLeft: body.style.left,
      bodyRight: body.style.right,
      bodyWidth: body.style.width,
      bodyPaddingRight: body.style.paddingRight,
      bodyOverscrollBehavior: body.style.overscrollBehavior,
    }

    html.dataset.surfaceScrollLock = "true"
    html.style.overflow = "hidden"
    html.style.overscrollBehavior = "none"

    body.style.overflow = "hidden"
    body.style.position = "fixed"
    body.style.top = `-${scrollY}px`
    body.style.left = "0"
    body.style.right = "0"
    body.style.width = "100%"
    body.style.overscrollBehavior = "none"

    if (scrollbarCompensation > 0) {
      body.style.paddingRight = `${scrollbarCompensation}px`
    }
  }

  let released = false

  return () => {
    if (released || typeof window === "undefined" || typeof document === "undefined") {
      return
    }

    released = true
    activeScrollLocks = Math.max(0, activeScrollLocks - 1)

    if (activeScrollLocks > 0 || !scrollLockSnapshot) {
      return
    }

    const html = document.documentElement
    const { body } = document
    const { scrollY } = scrollLockSnapshot

    delete html.dataset.surfaceScrollLock
    html.style.overflow = scrollLockSnapshot.htmlOverflow
    html.style.overscrollBehavior = scrollLockSnapshot.htmlOverscrollBehavior

    body.style.overflow = scrollLockSnapshot.bodyOverflow
    body.style.position = scrollLockSnapshot.bodyPosition
    body.style.top = scrollLockSnapshot.bodyTop
    body.style.left = scrollLockSnapshot.bodyLeft
    body.style.right = scrollLockSnapshot.bodyRight
    body.style.width = scrollLockSnapshot.bodyWidth
    body.style.paddingRight = scrollLockSnapshot.bodyPaddingRight
    body.style.overscrollBehavior = scrollLockSnapshot.bodyOverscrollBehavior

    scrollLockSnapshot = null
    window.scrollTo({ top: scrollY, left: 0, behavior: "auto" })
  }
}

export function useDocumentScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) {
      return undefined
    }

    return acquireDocumentScrollLock()
  }, [active])
}
