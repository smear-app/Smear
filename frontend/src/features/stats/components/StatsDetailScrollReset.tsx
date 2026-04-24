import { useLayoutEffect } from "react"
import { useLocation } from "react-router-dom"
import type { StatsNavigationState } from "../../../lib/navigation"

export default function StatsDetailScrollReset() {
  const location = useLocation()
  const fromStatsOverview = (location.state as StatsNavigationState | null)?.fromStatsOverview === true

  useLayoutEffect(() => {
    if (!fromStatsOverview || typeof window === "undefined" || typeof document === "undefined") {
      return
    }

    window.scrollTo({ top: 0, left: 0, behavior: "instant" })
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [fromStatsOverview, location.key])

  return null
}
