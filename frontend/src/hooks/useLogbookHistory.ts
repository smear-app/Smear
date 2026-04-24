import { useEffect, useMemo, useRef, useState } from "react"
import { fetchPaginatedClimbs } from "../lib/climbs"
import {
  DEFAULT_LOGBOOK_FILTERS,
  LOGBOOK_PAGE_SIZE,
  getVisibleClimbs,
  getVisibleSessions,
  isChronologicalSort,
  type LogbookFilters,
} from "../lib/logbook"
import type { Climb } from "../lib/climbs"
import type { LogbookSession } from "../lib/logbook"
import type { LogbookSort } from "../lib/logbookTypes"

interface UseLogbookHistoryParams {
  userId?: string
  filters?: LogbookFilters
  sort: LogbookSort
  pageSize?: number
  reloadKey?: number
}

interface UseLogbookHistoryResult {
  climbs: Climb[]
  sessions: LogbookSession[]
  totalCount: number
  loadedCount: number
  visibleCount: number
  isLoading: boolean
  isLoadingMore: boolean
  error: string | null
  canLoadMore: boolean
  loadMore: () => void
  removeClimb: (climbId: string) => void
  isChronological: boolean
}

const EMPTY_CLIMBS: Climb[] = []
const EMPTY_SESSIONS: LogbookSession[] = []

type LogbookHistoryCacheEntry = {
  climbs: Climb[]
  totalCount: number
}

const logbookHistoryCache = new Map<string, LogbookHistoryCacheEntry>()

export function useLogbookHistory({
  userId,
  filters = DEFAULT_LOGBOOK_FILTERS,
  sort,
  pageSize = LOGBOOK_PAGE_SIZE,
  reloadKey = 0,
}: UseLogbookHistoryParams): UseLogbookHistoryResult {
  const chronological = isChronologicalSort(sort)
  const requestKey = JSON.stringify({ userId, filters, sort, pageSize, chronological, reloadKey })
  const cachedHistory = userId ? logbookHistoryCache.get(requestKey) : undefined
  const [loadedClimbs, setLoadedClimbs] = useState<Climb[]>(() => cachedHistory?.climbs ?? [])
  const [totalCount, setTotalCount] = useState(() => cachedHistory?.totalCount ?? 0)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestKeyRef = useRef("")

  useEffect(() => {
    if (!userId) {
      requestKeyRef.current = ""
      setLoadedClimbs([])
      setTotalCount(0)
      setError(null)
      setIsLoading(false)
      setIsLoadingMore(false)
      return
    }

    let cancelled = false
    requestKeyRef.current = requestKey

    const cachedPage = logbookHistoryCache.get(requestKey)
    if (cachedPage) {
      setLoadedClimbs(cachedPage.climbs)
      setTotalCount(cachedPage.totalCount)
      setError(null)
      setIsLoading(false)
      setIsLoadingMore(false)
      return
    }

    setIsLoading(true)
    setIsLoadingMore(false)
    setError(null)
    setLoadedClimbs([])
    setTotalCount(0)

    const loadInitialPage = async () => {
      try {
        const page = await fetchPaginatedClimbs({
          userId,
          limit: pageSize,
          offset: 0,
          sort,
          gymId: filters.gymId,
          sendTypes: filters.sendTypes,
          wallTypes: filters.wallTypes,
          holdTypes: filters.holdTypes,
          movementTypes: filters.movementTypes,
          mechanicTypes: filters.mechanicTypes,
          grades: filters.grades,
        })

        if (cancelled || requestKeyRef.current !== requestKey) {
          return
        }

        setLoadedClimbs(page.climbs)
        setTotalCount(page.totalCount)
        logbookHistoryCache.set(requestKey, {
          climbs: page.climbs,
          totalCount: page.totalCount,
        })
      } catch (loadError) {
        if (cancelled || requestKeyRef.current !== requestKey) {
          return
        }

        setError(loadError instanceof Error ? loadError.message : "Failed to load climbs")
      } finally {
        if (!cancelled && requestKeyRef.current === requestKey) {
          setIsLoading(false)
        }
      }
    }

    void loadInitialPage()

    return () => {
      cancelled = true
    }
  }, [
    filters.gymId,
    filters.grades,
    filters.holdTypes,
    filters.mechanicTypes,
    filters.movementTypes,
    filters.sendTypes,
    filters.wallTypes,
    pageSize,
    requestKey,
    sort,
    userId,
    chronological,
    reloadKey,
  ])

  const removeClimb = (climbId: string) => {
    const nextTotalCount = Math.max(0, totalCount - 1)

    setLoadedClimbs((prev) => {
      const nextClimbs = prev.filter((c) => c.id !== climbId)

      logbookHistoryCache.set(requestKey, {
        climbs: nextClimbs,
        totalCount: nextTotalCount,
      })

      return nextClimbs
    })
    setTotalCount(nextTotalCount)
  }

  const loadMore = () => {
    if (!userId || isLoading || isLoadingMore || loadedClimbs.length >= totalCount) {
      return
    }

    const activeRequestKey = requestKey
    setIsLoadingMore(true)
    setError(null)

    void fetchPaginatedClimbs({
      userId,
      limit: pageSize,
      offset: loadedClimbs.length,
      sort,
      gymId: filters.gymId,
      sendTypes: filters.sendTypes,
      wallTypes: filters.wallTypes,
      holdTypes: filters.holdTypes,
      movementTypes: filters.movementTypes,
      mechanicTypes: filters.mechanicTypes,
      grades: filters.grades,
    })
      .then((page) => {
        if (requestKeyRef.current !== activeRequestKey) {
          return
        }

        setLoadedClimbs((current) => {
          const nextClimbs = [...current, ...page.climbs]

          logbookHistoryCache.set(activeRequestKey, {
            climbs: nextClimbs,
            totalCount: page.totalCount,
          })

          return nextClimbs
        })
        setTotalCount(page.totalCount)
      })
      .catch((loadError) => {
        if (requestKeyRef.current !== activeRequestKey) {
          return
        }

        setError(loadError instanceof Error ? loadError.message : "Failed to load more climbs")
      })
      .finally(() => {
        if (requestKeyRef.current === activeRequestKey) {
          setIsLoadingMore(false)
        }
      })
  }

  const sessions = useMemo(
    () => (chronological ? getVisibleSessions(loadedClimbs, filters) : EMPTY_SESSIONS),
    [chronological, filters, loadedClimbs],
  )

  const climbs = useMemo(
    () => (chronological ? EMPTY_CLIMBS : getVisibleClimbs(loadedClimbs, filters, sort)),
    [chronological, filters, loadedClimbs, sort],
  )

  return {
    climbs,
    sessions,
    totalCount,
    loadedCount: loadedClimbs.length,
    visibleCount: chronological
      ? sessions.reduce((sum, session) => sum + session.climbs.length, 0)
      : climbs.length,
    isLoading,
    isLoadingMore,
    error,
    canLoadMore: loadedClimbs.length < totalCount,
    loadMore,
    removeClimb,
    isChronological: chronological,
  }
}
