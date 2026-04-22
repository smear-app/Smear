import { useEffect, useSyncExternalStore } from "react"
import { useAuth } from "../../../context/AuthContext"
import {
  getSharedStatsBaseSnapshot,
  loadSharedStatsBase,
  resetSharedStatsBase,
  subscribeSharedStatsBase,
} from "../domain/base"

export function useSharedStatsBase() {
  const { user } = useAuth()
  const snapshot = useSyncExternalStore(
    subscribeSharedStatsBase,
    getSharedStatsBaseSnapshot,
    getSharedStatsBaseSnapshot,
  )

  useEffect(() => {
    if (!user?.id) {
      if (snapshot.userId !== null || snapshot.status !== "idle") {
        resetSharedStatsBase()
      }
      return
    }

    if (snapshot.userId === user.id && snapshot.status === "error") {
      return
    }

    void loadSharedStatsBase(user.id)
  }, [snapshot.status, snapshot.userId, snapshot.version, user?.id])

  return snapshot.userId === user?.id
    ? snapshot
    : {
        ...snapshot,
        statsBase: null,
        enrichedClimbs: [],
        status: user?.id ? "loading" as const : "idle" as const,
        error: null,
      }
}
