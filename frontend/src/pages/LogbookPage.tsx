import { useEffect, useState, type ReactNode } from "react"
import { FiArrowUp, FiChevronDown, FiMapPin } from "react-icons/fi"
import { useLocation, useSearchParams } from "react-router-dom"
import BackButton from "../components/BackButton"
import BottomNav from "../components/BottomNav"
import AnchoredPopover from "../components/logbook/AnchoredPopover"
import LogbookCalendarScaffold from "../components/logbook/LogbookCalendarScaffold"
import LogbookClimbList from "../components/logbook/LogbookClimbList"
import { useAuth } from "../context/AuthContext"
import { useLogbookHistory } from "../hooks/useLogbookHistory"
import { fetchLoggedGrades, fetchLoggedGyms, type LoggedGradeOption, type LoggedGymOption } from "../lib/climbs"
import {
  DEFAULT_LOGBOOK_FILTERS,
  LOGBOOK_SORT_OPTIONS,
  formatTagLabel,
  getAttributeFilterSections,
  getClimbsForDateKey,
  getTagCategory,
  getSortLabel,
  type LogbookFilters,
  type LogbookSort,
  type LogbookView,
} from "../lib/logbook"

const SORT_PANEL_OPTIONS: LogbookSort[] = [...LOGBOOK_SORT_OPTIONS]
const VIEW_OPTIONS: LogbookView[] = ["list", "calendar"]
const SEND_TYPE_OPTIONS = ["flash", "send", "attempt"]
const POPUP_CARD_SHELL_CLASS =
  "rounded-[18px] border border-stone-border/80 bg-stone-surface p-1.5 shadow-[0_14px_30px_rgba(89,68,51,0.08)]"

type OpenPanel = "filters" | "sort" | null
type AttributeSectionKey = "wallTypes" | "holdTypes" | "movementTypes"
type LogbookRestoreState = {
  restoreLogbookState?: {
    view: LogbookView
    visibleMonth: string
    selectedDateKey: string | null
  }
}

type LogbookPageProps = {
  onDeleteClimb: (climbId: string) => Promise<void> | void
  onEditClimb: (climb: import("../lib/climbs").Climb) => void
  refreshKey?: number
}

function isValidSort(value: string | null): value is LogbookSort {
  return Boolean(value && LOGBOOK_SORT_OPTIONS.includes(value as LogbookSort))
}

function isValidView(value: string | null): value is LogbookView {
  return value === "list" || value === "calendar"
}

function buildInitialFilters(searchParams: URLSearchParams): LogbookFilters {
  const legacyAttribute = searchParams.get("attribute")
  const legacyCategory = legacyAttribute ? getTagCategory(legacyAttribute) : null

  return {
    gymId: searchParams.get("gymId") ?? DEFAULT_LOGBOOK_FILTERS.gymId,
    sendTypes: searchParams.get("sendTypes")?.split(",").filter(Boolean) ?? DEFAULT_LOGBOOK_FILTERS.sendTypes,
    wallTypes:
      searchParams.get("wallTypes")?.split(",").filter(Boolean) ??
      (legacyCategory === "wall" && legacyAttribute ? [legacyAttribute] : DEFAULT_LOGBOOK_FILTERS.wallTypes),
    holdTypes:
      searchParams.get("holdTypes")?.split(",").filter(Boolean) ??
      (legacyCategory === "hold" && legacyAttribute ? [legacyAttribute] : DEFAULT_LOGBOOK_FILTERS.holdTypes),
    movementTypes:
      searchParams.get("movementTypes")?.split(",").filter(Boolean) ??
      (legacyCategory === "movement" && legacyAttribute ? [legacyAttribute] : DEFAULT_LOGBOOK_FILTERS.movementTypes),
    grades: searchParams.get("grades")?.split(",").filter(Boolean) ?? DEFAULT_LOGBOOK_FILTERS.grades,
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

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function getSelectionSummary(
  options: Array<{ value: string; label: string }>,
  selectedValues: string[],
) {
  if (selectedValues.length === 0) {
    return "All"
  }

  const selectedLabels = options.filter((option) => selectedValues.includes(option.value)).map((option) => option.label)

  if (selectedLabels.length === 1) {
    return selectedLabels[0]
  }

  if (selectedLabels.length === 2) {
    const summary = `${selectedLabels[0]} + ${selectedLabels[1]}`
    return summary.length <= 24 ? summary : `${selectedLabels.length} selected`
  }

  return `${selectedLabels.length} selected`
}

type CompactFilterSectionProps = {
  label: string
  summary: string
  expanded: boolean
  onToggle: () => void
  children: ReactNode
}

function CompactFilterSection({
  label,
  summary,
  expanded,
  onToggle,
  children,
}: CompactFilterSectionProps) {
  return (
    <section
      className={`rounded-[14px] border transition-all duration-200 ${
        expanded ? "border-ember/20 bg-ember-soft/55 px-2.5 py-2" : "border-stone-border/80 bg-stone-surface px-2.5 py-1.5"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2 text-left"
        aria-expanded={expanded}
      >
        <p
          className={`shrink-0 text-[11px] font-semibold uppercase tracking-[0.14em] ${
            expanded ? "text-ember" : "text-stone-muted"
          }`}
        >
          {label}
        </p>

        <p
          className={`min-w-0 flex-1 truncate text-right text-xs ${
            expanded ? "text-ember/80" : "text-stone-secondary"
          }`}
        >
          {summary}
        </p>

        <FiChevronDown
          className={`h-4 w-4 shrink-0 text-stone-secondary transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {expanded ? <div className="mt-2 flex flex-wrap gap-1.5">{children}</div> : null}
    </section>
  )
}

type CompactSelectorRowProps = {
  label: string
  value: string
  children: ReactNode
}

function CompactSelectorRow({ label, value, children }: CompactSelectorRowProps) {
  return (
    <div className="relative overflow-hidden rounded-[16px] border border-stone-border bg-stone-surface px-3 py-2 shadow-[0_8px_20px_rgba(89,68,51,0.05)]">
      <div className="flex items-center gap-2">
        <FiMapPin className="h-3.5 w-3.5 shrink-0 text-stone-secondary" />

        <p className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-muted">
          {label}
        </p>

        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-stone-text">{value}</p>

        <FiChevronDown className="h-4 w-4 shrink-0 text-stone-secondary" />
      </div>

      {children}
    </div>
  )
}

export default function LogbookPage({
  onEditClimb,
  onDeleteClimb,
  refreshKey = 0,
}: LogbookPageProps) {
  const location = useLocation()
  const locationState = (location.state ?? {}) as LogbookRestoreState & { stackTransition?: string }
  const restoredLogbookState = locationState.restoreLogbookState
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  const isOpeningFromHome = locationState.stackTransition === "forward"
  const [view, setView] = useState<LogbookView>(() =>
    restoredLogbookState?.view ??
      (isValidView(searchParams.get("view")) ? (searchParams.get("view") as LogbookView) : "list"),
  )
  const [sort, setSort] = useState<LogbookSort>(() =>
    isValidSort(searchParams.get("sort")) ? (searchParams.get("sort") as LogbookSort) : "newest",
  )
  const [filters, setFilters] = useState<LogbookFilters>(() => buildInitialFilters(searchParams))
  const [draftFilters, setDraftFilters] = useState<LogbookFilters>(() => buildInitialFilters(searchParams))
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null)
  const [showScrollToTop, setShowScrollToTop] = useState(false)
  const [loggedGyms, setLoggedGyms] = useState<LoggedGymOption[]>([])
  const [loggedGrades, setLoggedGrades] = useState<LoggedGradeOption[]>([])
  const [gymLoadError, setGymLoadError] = useState<string | null>(null)
  const [calendarVisibleMonth, setCalendarVisibleMonth] = useState(() =>
    restoredLogbookState?.visibleMonth ? startOfMonth(new Date(restoredLogbookState.visibleMonth)) : startOfMonth(new Date()),
  )
  const [calendarSelectedDateKey, setCalendarSelectedDateKey] = useState<string | null>(
    () => restoredLogbookState?.selectedDateKey ?? null,
  )
  const [expandedAttributeSections, setExpandedAttributeSections] = useState<Record<AttributeSectionKey, boolean>>({
    wallTypes: false,
    holdTypes: false,
    movementTypes: false,
  })
  const {
    climbs,
    sessions,
    totalCount,
    visibleCount,
    isLoading,
    isLoadingMore,
    error,
    canLoadMore,
    loadMore,
    removeClimb,
    isChronological,
  } = useLogbookHistory({
    userId: user?.id,
    filters,
    sort,
    reloadKey: refreshKey,
  })

  const handleDeleteClimb = async (climbId: string) => {
    removeClimb(climbId)
    await onDeleteClimb(climbId)
  }

  useEffect(() => {
    const nextParams = new URLSearchParams()
    nextParams.set("view", view)
    nextParams.set("sort", sort)

    if (filters.gymId !== "all") {
      nextParams.set("gymId", filters.gymId)
    }

    if (filters.sendTypes.length > 0) {
      nextParams.set("sendTypes", filters.sendTypes.join(","))
    }

    if (filters.wallTypes.length > 0) {
      nextParams.set("wallTypes", filters.wallTypes.join(","))
    }

    if (filters.holdTypes.length > 0) {
      nextParams.set("holdTypes", filters.holdTypes.join(","))
    }

    if (filters.movementTypes.length > 0) {
      nextParams.set("movementTypes", filters.movementTypes.join(","))
    }

    if (filters.grades.length > 0) {
      nextParams.set("grades", filters.grades.join(","))
    }

    setSearchParams(nextParams, { replace: true })
  }, [filters, setSearchParams, sort, view])

  useEffect(() => {
    if (!user) {
      return
    }

    let cancelled = false

    void fetchLoggedGyms(user.id)
      .then((gyms) => {
        if (!cancelled) {
          setLoggedGyms(gyms)
          setGymLoadError(null)
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setLoggedGyms([])
          setGymLoadError(loadError instanceof Error ? loadError.message : "Failed to load gyms")
        }
      })

    return () => {
      cancelled = true
    }
  }, [refreshKey, user])

  useEffect(() => {
    if (!user) {
      return
    }

    let cancelled = false

    void fetchLoggedGrades(user.id).then((grades) => {
      if (!cancelled) {
        setLoggedGrades(grades)
      }
    }).catch(() => {
      if (!cancelled) {
        setLoggedGrades([])
      }
    })

    return () => {
      cancelled = true
    }
  }, [user, refreshKey])

  useEffect(() => {
    const visibilityThreshold = Math.max(window.innerHeight * 1.25, 900)

    const updateScrollToTopVisibility = () => {
      setShowScrollToTop(window.scrollY > visibilityThreshold)
    }

    updateScrollToTopVisibility()
    window.addEventListener("scroll", updateScrollToTopVisibility, { passive: true })

    return () => {
      window.removeEventListener("scroll", updateScrollToTopVisibility)
    }
  }, [])

  const hasActiveFilters =
    filters.gymId !== "all" ||
    filters.sendTypes.length > 0 ||
    filters.wallTypes.length > 0 ||
    filters.holdTypes.length > 0 ||
    filters.movementTypes.length > 0 ||
    filters.grades.length > 0
  const listIsEmpty = isChronological ? sessions.length === 0 : climbs.length === 0
  const totalMatchingResults = totalCount
  const shownResults = Math.min(visibleCount, totalMatchingResults)
  const logbookReturnPath = `${location.pathname}${location.search}`
  const calendarSourceClimbs = isChronological ? sessions.flatMap((session) => session.climbs) : climbs
  const selectedDateClimbs = getClimbsForDateKey(calendarSourceClimbs, calendarSelectedDateKey)
  const calendarReturnState = calendarSelectedDateKey
    ? {
        restoreLogbookState: {
          view: "calendar" as const,
          visibleMonth: calendarVisibleMonth.toISOString(),
          selectedDateKey: calendarSelectedDateKey,
        },
      }
    : undefined
  const availableGyms = user ? loggedGyms : []
  const availableGrades = user ? loggedGrades : []
  const visibleGymLoadError = user ? gymLoadError : null
  const selectedGymLabel = draftFilters.gymId === "all"
    ? "All gyms"
    : availableGyms.find((gym) => gym.id === draftFilters.gymId)?.name ?? "All gyms"

  const closeFilterPopover = () => {
    setDraftFilters(filters)
    setOpenPanel(null)
  }

  const toggleDraftAttribute = (sectionKey: AttributeSectionKey, value: string) => {
    setDraftFilters((current) => ({
      ...current,
      [sectionKey]: current[sectionKey].includes(value)
        ? current[sectionKey].filter((item) => item !== value)
        : [...current[sectionKey], value],
    }))
  }

  return (
    <div className="app-safe-shell min-h-screen bg-stone-bg">
      <main
        className="app-safe-shell__main mx-auto flex min-h-screen max-w-[420px] flex-col px-5 pb-[calc(6.25rem+env(safe-area-inset-bottom))] pt-6"
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

          @keyframes logbook-view-enter {
            0% {
              opacity: 0;
              transform: translateY(8px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
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

          <h1 className="text-base font-semibold text-stone-text">Logbook</h1>
        </div>

        <section className="relative mt-2 rounded-[22px] border border-stone-border bg-stone-surface px-2.5 py-2.5 shadow-[0_14px_34px_rgba(89,68,51,0.08)]">
          <div className="flex items-center gap-1">
            <div className="relative flex min-w-0 flex-1 rounded-full border border-stone-border bg-stone-alt p-0.5">
              <span
                aria-hidden="true"
                className={`absolute inset-y-0.5 w-[calc(50%-0.125rem)] rounded-full bg-stone-surface shadow-sm transition-transform duration-200 ease-out ${
                  view === "calendar" ? "translate-x-full" : "translate-x-0"
                }`}
              />
              {VIEW_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setView(option)}
                  className={`relative z-10 flex-1 rounded-full px-2.5 py-1.5 text-[13px] font-semibold transition-colors duration-200 ${
                    view === option ? "text-stone-text" : "text-stone-secondary"
                  }`}
                >
                  {option === "list" ? "List" : "Calendar"}
                </button>
              ))}
            </div>

            <AnchoredPopover
              open={openPanel === "filters"}
              onClose={closeFilterPopover}
              align="right"
              trigger={
                <button
                  type="button"
                  onClick={() =>
                    setOpenPanel((current) => {
                      if (current === "filters") {
                        setDraftFilters(filters)
                        return null
                      }

                      setDraftFilters(filters)
                      return "filters"
                    })
                  }
                    className={`rounded-full border px-2.5 py-1.5 text-[13px] font-semibold transition-colors ${
                    openPanel === "filters" || hasActiveFilters
                      ? "border-ember/20 bg-ember-soft text-ember"
                      : "border-stone-border bg-stone-alt text-stone-secondary"
                  }`}
                >
                  Filter
                </button>
              }
            >
              <div className={POPUP_CARD_SHELL_CLASS}>
                <div className="grid gap-2">
                  <CompactSelectorRow label="Gym" value={selectedGymLabel}>
                    <select
                      value={draftFilters.gymId}
                      onChange={(event) => setDraftFilters((current) => ({ ...current, gymId: event.target.value }))}
                      aria-label="Gym"
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    >
                      <option value="all">All gyms</option>
                      {availableGyms.map((gym) => (
                        <option key={gym.id} value={gym.id}>
                          {gym.name}
                        </option>
                      ))}
                    </select>
                  </CompactSelectorRow>

                  <div className="grid gap-1">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-muted">
                      Status
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {SEND_TYPE_OPTIONS.map((option) => {
                        const isSelected = draftFilters.sendTypes.includes(option)

                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() =>
                              setDraftFilters((current) => ({
                                ...current,
                                sendTypes: current.sendTypes.includes(option)
                                  ? current.sendTypes.filter((status) => status !== option)
                                  : [...current.sendTypes, option],
                              }))
                            }
                            className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                              isSelected
                                ? "border-ember/20 bg-ember-soft text-ember"
                                : "border-stone-border bg-stone-alt text-stone-secondary"
                            }`}
                          >
                            {formatTagLabel(option)}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="grid gap-1.5">
                    {getAttributeFilterSections().map((section) => {
                      const selectedValues = draftFilters[section.key]
                      const isExpanded = expandedAttributeSections[section.key]
                      const summary = getSelectionSummary(section.options, selectedValues)

                      return (
                        <CompactFilterSection
                          key={section.key}
                          label={section.title}
                          summary={summary}
                          expanded={isExpanded}
                          onToggle={() =>
                            setExpandedAttributeSections((current) => ({
                              ...current,
                              [section.key]: !current[section.key],
                            }))
                          }
                        >
                          {section.options.map((option) => {
                            const isSelected = selectedValues.includes(option.value)

                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => toggleDraftAttribute(section.key, option.value)}
                                className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                                  isSelected
                                    ? "border-ember/20 bg-ember-soft text-ember"
                                    : "border-stone-border bg-stone-alt text-stone-secondary"
                                }`}
                              >
                                {option.label}
                              </button>
                            )
                          })}
                        </CompactFilterSection>
                      )
                    })}
                  </div>

                  <div className="grid gap-1">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-muted">
                      Grades
                    </span>
                    <div className="w-full px-1.5">
                      <div className="flex flex-wrap justify-center gap-x-2 gap-y-1.5">
                        {availableGrades.map((gradeOption) => {
                          const isSelected = draftFilters.grades.includes(gradeOption.grade)

                          return (
                            <button
                              key={gradeOption.grade}
                              type="button"
                              onClick={() =>
                                setDraftFilters((current) => ({
                                  ...current,
                                  grades: current.grades.includes(gradeOption.grade)
                                    ? current.grades.filter((grade) => grade !== gradeOption.grade)
                                    : [...current.grades, gradeOption.grade],
                                }))
                              }
                              className={`rounded-full border px-2.5 py-[0.3rem] text-xs font-semibold transition-colors ${
                                isSelected
                                  ? "border-ember/20 bg-ember-soft text-ember"
                                  : "border-stone-border bg-stone-alt text-stone-secondary"
                              }`}
                            >
                              {gradeOption.grade}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDraftFilters(DEFAULT_LOGBOOK_FILTERS)}
                    className="mt-1 w-full rounded-[14px] border border-stone-border/70 bg-stone-surface px-3 py-2 text-sm font-medium text-stone-secondary transition-colors active:bg-stone-alt"
                  >
                    Reset filters
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFilters(draftFilters)
                      setOpenPanel(null)
                    }}
                    className="rounded-full bg-ember px-3 py-1.5 text-sm font-semibold text-stone-surface"
                  >
                    Apply
                  </button>

                  {visibleGymLoadError ? (
                    <p className="text-xs text-red-500">{visibleGymLoadError}</p>
                  ) : null}
                </div>
              </div>
            </AnchoredPopover>

            <AnchoredPopover
              open={openPanel === "sort"}
              onClose={() => setOpenPanel(null)}
              align="right"
              trigger={
                <button
                  type="button"
                  onClick={() => setOpenPanel((current) => (current === "sort" ? null : "sort"))}
                  className={`rounded-full border px-2.5 py-1.5 text-[13px] font-semibold transition-colors ${
                    openPanel === "sort"
                      ? "border-ember/20 bg-ember-soft text-ember"
                      : "border-stone-border bg-stone-alt text-stone-secondary"
                  }`}
                >
                  Sort
                </button>
              }
            >
              <div className={`grid min-w-[11rem] gap-1.5 ${POPUP_CARD_SHELL_CLASS}`}>
                {SORT_PANEL_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setSort(option)
                      setOpenPanel(null)
                    }}
                    className={`rounded-[14px] border px-3 py-2 text-left text-[13px] font-semibold transition-colors ${
                      sort === option
                        ? "border-ember/20 bg-ember-soft text-ember"
                        : "border-stone-border/70 bg-stone-surface text-stone-secondary hover:bg-stone-alt"
                    }`}
                  >
                    {getSortLabel(option)}
                  </button>
                ))}
              </div>
            </AnchoredPopover>
          </div>
        </section>

        {view === "list" ? (
          <div className="mt-2 flex items-center justify-between gap-3 px-1 text-xs text-stone-muted">
            <p>{getSortLabel(sort)}</p>
            <p>{`Showing ${shownResults} of ${totalMatchingResults} results`}</p>
          </div>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-[24px] border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-600">
            {error}
          </div>
        ) : null}

        {view === "calendar" ? (
          <div
            key="calendar-view"
            className="mt-4 flex min-h-0 flex-1"
            style={{ animation: "logbook-view-enter 180ms cubic-bezier(0.22, 1, 0.36, 1)" }}
          >
            <LogbookCalendarScaffold
              climbs={calendarSourceClimbs}
              visibleMonth={calendarVisibleMonth}
              onVisibleMonthChange={setCalendarVisibleMonth}
              selectedDateKey={calendarSelectedDateKey}
              onSelectedDateKeyChange={setCalendarSelectedDateKey}
              selectedDateContent={
                <LogbookClimbList
                  climbs={selectedDateClimbs}
                  from={logbookReturnPath}
                  showMeta
                  showLoggedDate={false}
                  fromState={calendarReturnState}
                  onDelete={handleDeleteClimb}
                  onEdit={onEditClimb}
                  emptyState={
                    <div className="flex h-full min-h-full w-full items-center justify-center self-stretch rounded-[22px] border border-dashed border-stone-border/80 bg-stone-surface/65 px-4 py-6 text-center text-sm text-stone-secondary">
                      No climbs logged.
                    </div>
                  }
                />
              }
            />
          </div>
        ) : isLoading ? (
          <div
            key="list-loading"
            className="mt-4 rounded-[28px] border border-dashed border-stone-border bg-stone-surface/70 px-5 py-8 text-center text-sm text-stone-secondary shadow-[0_14px_34px_rgba(89,68,51,0.05)]"
            style={{ animation: "logbook-view-enter 180ms cubic-bezier(0.22, 1, 0.36, 1)" }}
          >
            Loading climbs…
          </div>
        ) : listIsEmpty ? (
          <div
            key="list-empty"
            className="mt-4 rounded-[28px] border border-dashed border-stone-border bg-stone-surface/70 px-5 py-8 text-center text-sm text-stone-secondary shadow-[0_14px_34px_rgba(89,68,51,0.05)]"
            style={{ animation: "logbook-view-enter 180ms cubic-bezier(0.22, 1, 0.36, 1)" }}
          >
            {hasActiveFilters ? "No climbs match the current filters." : "Your climb history will appear here."}
          </div>
        ) : (
          <div
            key="list-content"
            className="mt-4 space-y-4"
            style={{ animation: "logbook-view-enter 180ms cubic-bezier(0.22, 1, 0.36, 1)" }}
          >
            {isChronological
              ? sessions.map((session) => (
                  <section key={session.id} className="space-y-2.5">
                    <div className="flex items-center gap-2 px-1">
                      <p className="shrink-0 text-xs text-stone-secondary">
                        {formatSessionDate(session.climbs[0].created_at)}
                      </p>
                      <p className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-muted">
                        {session.gymName || "Unknown gym"}
                      </p>
                      <div className="h-px flex-1 bg-stone-border/70" />
                    </div>

                    <div className="space-y-1.5">
                      <LogbookClimbList
                        climbs={session.climbs}
                        from={logbookReturnPath}
                        showMeta={false}
                        onDelete={handleDeleteClimb}
                        onEdit={onEditClimb}
                      />
                    </div>
                  </section>
                ))
              : (
                  <LogbookClimbList
                    climbs={climbs}
                    from={logbookReturnPath}
                    showMeta
                    onDelete={handleDeleteClimb}
                    onEdit={onEditClimb}
                  />
                )}

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

      {showScrollToTop ? (
        <button
          type="button"
          aria-label="Scroll to top"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-[calc(6.5rem+env(safe-area-inset-bottom))] right-5 z-30 inline-flex h-11 w-11 items-center justify-center rounded-full border border-stone-border bg-stone-surface text-stone-secondary transition-all duration-200"
        >
          <FiArrowUp className="h-4 w-4" />
        </button>
      ) : null}

      <BottomNav />
    </div>
  )
}
