import { useEffect, useMemo, useState } from "react"
import { useLocation, useSearchParams } from "react-router-dom"
import BackButton from "../components/BackButton"
import BottomNav from "../components/BottomNav"
import LogbookCalendarScaffold from "../components/logbook/LogbookCalendarScaffold"
import LogbookClimbTile from "../components/logbook/LogbookClimbTile"
import { useAuth } from "../context/AuthContext"
import { useGym } from "../context/GymContext"
import { useLogbookHistory } from "../hooks/useLogbookHistory"
import {
  DEFAULT_LOGBOOK_FILTERS,
  LOGBOOK_SORT_OPTIONS,
  formatTagLabel,
  getAttributeFilterOptions,
  getSortLabel,
  type LogbookFilters,
  type LogbookSort,
  type LogbookView,
} from "../lib/logbook"

const SORT_PANEL_OPTIONS: LogbookSort[] = [...LOGBOOK_SORT_OPTIONS]
const VIEW_OPTIONS: LogbookView[] = ["list", "calendar"]
const SEND_TYPE_OPTIONS = ["all", "send", "flash", "attempt"]

type OpenPanel = "filters" | "sort" | null

function isValidSort(value: string | null): value is LogbookSort {
  return Boolean(value && LOGBOOK_SORT_OPTIONS.includes(value as LogbookSort))
}

function isValidView(value: string | null): value is LogbookView {
  return value === "list" || value === "calendar"
}

function buildInitialFilters(searchParams: URLSearchParams): LogbookFilters {
  return {
    gymId: searchParams.get("gymId") ?? DEFAULT_LOGBOOK_FILTERS.gymId,
    sendType: searchParams.get("sendType") ?? DEFAULT_LOGBOOK_FILTERS.sendType,
    attribute: searchParams.get("attribute") ?? DEFAULT_LOGBOOK_FILTERS.attribute,
  }
}

function formatSessionDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export default function LogbookPage() {
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  const { searchGyms } = useGym()
  const isOpeningFromHome = location.state?.stackTransition === "forward"
  const [view, setView] = useState<LogbookView>(() =>
    isValidView(searchParams.get("view")) ? (searchParams.get("view") as LogbookView) : "list",
  )
  const [sort, setSort] = useState<LogbookSort>(() =>
    isValidSort(searchParams.get("sort")) ? (searchParams.get("sort") as LogbookSort) : "newest",
  )
  const [filters, setFilters] = useState<LogbookFilters>(() => buildInitialFilters(searchParams))
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null)

  const gyms = useMemo(
    () => searchGyms("").sort((left, right) => left.name.localeCompare(right.name)),
    [searchGyms],
  )
  const {
    climbs,
    sessions,
    totalCount,
    loadedCount,
    visibleCount,
    isLoading,
    isLoadingMore,
    error,
    canLoadMore,
    loadMore,
    isChronological,
  } = useLogbookHistory({
    userId: user?.id,
    filters,
    sort,
  })

  useEffect(() => {
    const nextParams = new URLSearchParams()
    nextParams.set("view", view)
    nextParams.set("sort", sort)

    if (filters.gymId !== "all") {
      nextParams.set("gymId", filters.gymId)
    }

    if (filters.sendType !== "all") {
      nextParams.set("sendType", filters.sendType)
    }

    if (filters.attribute !== "all") {
      nextParams.set("attribute", filters.attribute)
    }

    setSearchParams(nextParams, { replace: true })
  }, [filters, setSearchParams, sort, view])

  const hasActiveFilters = Object.values(filters).some((value) => value !== "all")
  const listIsEmpty = isChronological ? sessions.length === 0 : climbs.length === 0

  return (
    <div className="min-h-screen bg-stone-bg">
      <main
        className="mx-auto flex min-h-screen max-w-[420px] flex-col px-5 pb-[calc(6.25rem+env(safe-area-inset-bottom))] pt-6"
        style={{
          animation: isOpeningFromHome ? "logbook-stack-enter 280ms cubic-bezier(0.22, 1, 0.36, 1)" : "none",
        }}
      >
        <style>{`
          @keyframes logbook-stack-enter {
            0% {
              opacity: 0.92;
              transform: translateX(18px);
            }
            100% {
              opacity: 1;
              transform: translateX(0);
            }
          }
        `}</style>

        <div className="flex items-center gap-3">
          <BackButton
            to="/home"
            state={{ stackTransition: "back" }}
            label="Back to Home"
            ariaLabel="Back to Home"
            size="sm"
          />

          <div className="min-w-0">
            <h1 className="text-base font-semibold text-stone-text">Logbook</h1>
            <p className="text-xs text-stone-muted">Canonical climb history</p>
          </div>
        </div>

        <section className="mt-5 rounded-[28px] border border-stone-border bg-stone-surface px-4 py-4 shadow-[0_14px_34px_rgba(89,68,51,0.08)]">
          <div className="flex items-center gap-2">
            <div className="flex min-w-0 flex-1 rounded-full border border-stone-border bg-stone-alt p-1">
              {VIEW_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setView(option)}
                  className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    view === option ? "bg-stone-surface text-stone-text shadow-sm" : "text-stone-secondary"
                  }`}
                >
                  {option === "list" ? "List" : "Calendar"}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setOpenPanel((current) => (current === "filters" ? null : "filters"))}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                openPanel === "filters" || hasActiveFilters
                  ? "border-ember/20 bg-ember-soft text-ember"
                  : "border-stone-border bg-stone-alt text-stone-secondary"
              }`}
            >
              Filter
            </button>

            <button
              type="button"
              onClick={() => setOpenPanel((current) => (current === "sort" ? null : "sort"))}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                openPanel === "sort"
                  ? "border-ember/20 bg-ember-soft text-ember"
                  : "border-stone-border bg-stone-alt text-stone-secondary"
              }`}
            >
              Sort
            </button>
          </div>

          {openPanel === "filters" ? (
            <div className="mt-4 grid gap-3 rounded-[24px] border border-stone-border/80 bg-[#F6F1EA] p-4">
              <label className="grid gap-1 text-sm">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-muted">
                  Gym
                </span>
                <select
                  value={filters.gymId}
                  onChange={(event) => setFilters((current) => ({ ...current, gymId: event.target.value }))}
                  className="rounded-[16px] border border-stone-border bg-stone-surface px-3 py-2.5 text-stone-text"
                >
                  <option value="all">All gyms</option>
                  {gyms.map((gym) => (
                    <option key={gym.id} value={gym.id}>
                      {gym.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1 text-sm">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-muted">
                  Status
                </span>
                <select
                  value={filters.sendType}
                  onChange={(event) => setFilters((current) => ({ ...current, sendType: event.target.value }))}
                  className="rounded-[16px] border border-stone-border bg-stone-surface px-3 py-2.5 text-stone-text"
                >
                  {SEND_TYPE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option === "all" ? "All results" : formatTagLabel(option)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1 text-sm">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-muted">
                  Attribute
                </span>
                <select
                  value={filters.attribute}
                  onChange={(event) => setFilters((current) => ({ ...current, attribute: event.target.value }))}
                  className="rounded-[16px] border border-stone-border bg-stone-surface px-3 py-2.5 text-stone-text"
                >
                  <option value="all">All attributes</option>
                  {getAttributeFilterOptions().map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={() => setFilters(DEFAULT_LOGBOOK_FILTERS)}
                className="rounded-full border border-stone-border bg-stone-surface px-4 py-2 text-sm font-semibold text-stone-secondary"
              >
                Reset filters
              </button>
            </div>
          ) : null}

          {openPanel === "sort" ? (
            <div className="mt-4 grid gap-2 rounded-[24px] border border-stone-border/80 bg-[#F6F1EA] p-4">
              {SORT_PANEL_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setSort(option)
                    setOpenPanel(null)
                  }}
                  className={`rounded-[18px] border px-4 py-3 text-left text-sm font-semibold transition-colors ${
                    sort === option
                      ? "border-ember/20 bg-ember-soft text-ember"
                      : "border-stone-border bg-stone-surface text-stone-secondary"
                  }`}
                >
                  {getSortLabel(option)}
                </button>
              ))}
            </div>
          ) : null}
        </section>

        <div className="mt-4 flex items-center justify-between gap-3 px-1 text-xs text-stone-muted">
          <p>{getSortLabel(sort)}</p>
          <p>
            {isChronological ? `${visibleCount} visible of ${loadedCount}/${totalCount} loaded` : `${loadedCount}/${totalCount} loaded`}
          </p>
        </div>

        {error ? (
          <div className="mt-4 rounded-[24px] border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-600">
            {error}
          </div>
        ) : null}

        {view === "calendar" ? (
          <div className="mt-4">
            <LogbookCalendarScaffold climbs={isChronological ? sessions.flatMap((session) => session.climbs) : climbs} />
          </div>
        ) : isLoading ? (
          <div className="mt-4 rounded-[28px] border border-dashed border-stone-border bg-stone-surface/70 px-5 py-8 text-center text-sm text-stone-secondary shadow-[0_14px_34px_rgba(89,68,51,0.05)]">
            Loading climbs…
          </div>
        ) : listIsEmpty ? (
          <div className="mt-4 rounded-[28px] border border-dashed border-stone-border bg-stone-surface/70 px-5 py-8 text-center text-sm text-stone-secondary shadow-[0_14px_34px_rgba(89,68,51,0.05)]">
            {hasActiveFilters ? "No climbs match the current filters." : "Your climb history will appear here."}
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {isChronological
              ? sessions.map((session) => (
                  <section key={session.id} className="space-y-2.5">
                    <div className="flex items-center gap-2 px-1">
                      <div className="h-px flex-1 bg-stone-border/70" />
                      <div className="shrink-0 text-right">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-muted">
                          {session.gymName || "Unknown gym"}
                        </p>
                        <p className="text-xs text-stone-secondary">{formatSessionDate(session.climbs[0].created_at)}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {session.climbs.map((climb) => (
                        <LogbookClimbTile
                          key={climb.id}
                          climb={climb}
                          from="/home/logbook"
                          showMeta={false}
                        />
                      ))}
                    </div>
                  </section>
                ))
              : climbs.map((climb) => (
                  <LogbookClimbTile
                    key={climb.id}
                    climb={climb}
                    from="/home/logbook"
                    showMeta
                  />
                ))}

            {canLoadMore ? (
              <button
                type="button"
                onClick={loadMore}
                disabled={isLoadingMore}
                className={`w-full rounded-full px-5 py-3 text-sm font-semibold text-stone-surface transition-colors ${
                  isLoadingMore ? "bg-stone-border text-stone-muted" : "bg-ember hover:bg-ember-dark"
                }`}
              >
                {isLoadingMore ? "Loading…" : "Load more climbs"}
              </button>
            ) : null}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
