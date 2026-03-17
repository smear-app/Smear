import { useEffect, useMemo, useState } from "react"
import { FiChevronDown, FiChevronLeft, FiChevronRight } from "react-icons/fi"
import type { Climb } from "../../lib/climbs"
import AnchoredPopover from "./AnchoredPopover"

type LogbookCalendarScaffoldProps = {
  climbs: Climb[]
  visibleMonth: Date
  onVisibleMonthChange: (nextMonth: Date) => void
  selectedDateKey: string | null
  onSelectedDateKeyChange: (nextDateKey: string | null) => void
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function addMonths(date: Date, delta: number) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1)
}

function toLocalDateKey(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

function formatMonthHeading(date: Date) {
  return date.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  })
}

function formatSummaryDate(dateKey: string) {
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function buildClimbCounts(climbs: Climb[]) {
  const counts = new Map<string, number>()

  for (const climb of climbs) {
    const key = toLocalDateKey(climb.created_at)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  return counts
}

function buildCalendarDays(visibleMonth: Date) {
  const monthStart = startOfMonth(visibleMonth)
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0)
  const gridStart = new Date(monthStart)
  gridStart.setDate(monthStart.getDate() - monthStart.getDay())
  const gridEnd = new Date(monthEnd)
  gridEnd.setDate(monthEnd.getDate() + (6 - monthEnd.getDay()))

  const days: Date[] = []
  const cursor = new Date(gridStart)

  while (cursor <= gridEnd) {
    days.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }

  return days
}

function isSameLocalDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  )
}

export default function LogbookCalendarScaffold({
  climbs,
  visibleMonth,
  onVisibleMonthChange,
  selectedDateKey,
  onSelectedDateKeyChange,
}: LogbookCalendarScaffoldProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [pickerYear, setPickerYear] = useState(() => new Date().getFullYear())
  const today = useMemo(() => new Date(), [])

  const climbCounts = useMemo(() => buildClimbCounts(climbs), [climbs])
  const calendarDays = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth])
  const availableYears = useMemo(() => {
    const loggedYears = climbs.map((climb) => new Date(climb.created_at).getFullYear())
    const currentYear = new Date().getFullYear()
    const earliestLoggedYear = loggedYears.length > 0 ? Math.min(...loggedYears) : currentYear
    const latestLoggedYear = loggedYears.length > 0 ? Math.max(...loggedYears) : currentYear
    const startYear = Math.min(earliestLoggedYear - 2, currentYear - 20)
    const endYear = Math.max(latestLoggedYear + 3, currentYear + 20)

    const years: number[] = []
    for (let year = startYear; year <= endYear; year += 1) {
      years.push(year)
    }

    return years
  }, [climbs, visibleMonth])

  const pickerMinYear = availableYears[0]
  const pickerMaxYear = availableYears[availableYears.length - 1]

  const monthSummary = useMemo(() => {
    const visibleMonthKey = `${visibleMonth.getFullYear()}-${`${visibleMonth.getMonth() + 1}`.padStart(2, "0")}`

    return Array.from(climbCounts.entries())
      .filter(([dateKey]) => dateKey.startsWith(visibleMonthKey))
      .sort(([left], [right]) => right.localeCompare(left))
  }, [climbCounts, visibleMonth])

  const selectedSummary = selectedDateKey
    ? monthSummary.filter(([dateKey]) => dateKey === selectedDateKey)
    : monthSummary

  useEffect(() => {
    if (isPickerOpen) {
      setPickerYear(visibleMonth.getFullYear())
    }
  }, [isPickerOpen, visibleMonth])

  return (
    <section className="rounded-[28px] border border-stone-border bg-stone-surface px-5 py-5 shadow-[0_14px_34px_rgba(89,68,51,0.08)]">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => {
            onVisibleMonthChange(addMonths(visibleMonth, -1))
            onSelectedDateKeyChange(null)
          }}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-border bg-stone-alt text-stone-secondary transition-colors hover:bg-[#EFE7DD]"
        >
          <FiChevronLeft className="h-4 w-4" />
        </button>

        <AnchoredPopover
          open={isPickerOpen}
          onClose={() => setIsPickerOpen(false)}
          align="center"
          panelClassName="w-[min(19rem,calc(100vw-2.5rem))] rounded-[20px] p-2.5"
          trigger={
            <button
              type="button"
              onClick={() => setIsPickerOpen((current) => !current)}
              className="inline-flex items-center gap-1 rounded-full border border-stone-border bg-stone-alt px-3 py-1.5 text-base font-semibold text-stone-text transition-colors hover:bg-[#EFE7DD]"
            >
              <span>{formatMonthHeading(visibleMonth)}</span>
              <FiChevronDown
                className={`h-4 w-4 text-stone-secondary transition-transform ${isPickerOpen ? "rotate-180" : ""}`}
              />
            </button>
          }
        >
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              aria-label="Previous year"
              disabled={pickerYear <= pickerMinYear}
              onClick={() => setPickerYear((current) => Math.max(pickerMinYear, current - 1))}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-stone-border bg-stone-alt text-stone-secondary transition-colors hover:bg-[#EFE7DD] disabled:opacity-40"
            >
              <FiChevronLeft className="h-4 w-4" />
            </button>

            <div className="text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-muted">
                Jump To
              </p>
              <p className="mt-0.5 text-lg font-semibold text-stone-text">{pickerYear}</p>
            </div>

            <button
              type="button"
              aria-label="Next year"
              disabled={pickerYear >= pickerMaxYear}
              onClick={() => setPickerYear((current) => Math.min(pickerMaxYear, current + 1))}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-stone-border bg-stone-alt text-stone-secondary transition-colors hover:bg-[#EFE7DD] disabled:opacity-40"
            >
              <FiChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-2.5 grid grid-cols-4 gap-1">
            {Array.from({ length: 12 }, (_, monthIndex) => {
              const monthDate = new Date(pickerYear, monthIndex, 1)
              const isSelectedMonth =
                visibleMonth.getFullYear() === pickerYear && visibleMonth.getMonth() === monthIndex

              return (
                <button
                  key={monthIndex}
                  type="button"
                  onClick={() => {
                    onVisibleMonthChange(monthDate)
                    onSelectedDateKeyChange(null)
                    setIsPickerOpen(false)
                  }}
                  className={`rounded-[11px] border px-1 py-1.5 text-xs font-semibold transition-colors ${
                    isSelectedMonth
                      ? "border-ember/20 bg-ember-soft text-ember"
                      : "border-stone-border bg-stone-alt text-stone-secondary"
                  }`}
                >
                  {monthDate.toLocaleDateString(undefined, { month: "short" })}
                </button>
              )
            })}
          </div>

          <div className="mt-2.5 flex justify-center">
            <button
              type="button"
              onClick={() => setIsPickerOpen(false)}
              className="inline-flex rounded-[11px] border border-stone-border bg-stone-alt px-2.5 py-1.5 text-sm font-semibold text-stone-text transition-colors hover:bg-[#EFE7DD]"
            >
              Close
            </button>
          </div>
        </AnchoredPopover>

        <button
          type="button"
          aria-label="Next month"
          onClick={() => {
            onVisibleMonthChange(addMonths(visibleMonth, 1))
            onSelectedDateKeyChange(null)
          }}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-border bg-stone-alt text-stone-secondary transition-colors hover:bg-[#EFE7DD]"
        >
          <FiChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 rounded-[24px] border border-stone-border/80 bg-[#F6F1EA] p-3">
        <div className="grid grid-cols-7 gap-1.5">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="pb-1 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-muted"
            >
              {label}
            </div>
          ))}

          {calendarDays.map((day) => {
            const dayKey = toLocalDateKey(day)
            const isInVisibleMonth = day.getMonth() === visibleMonth.getMonth()
            const climbCount = climbCounts.get(dayKey) ?? 0
            const isSelected = selectedDateKey === dayKey
            const isToday = isSameLocalDay(day, today)

            return (
              <button
                key={dayKey}
                type="button"
                onClick={() => onSelectedDateKeyChange(selectedDateKey === dayKey ? null : dayKey)}
                className={`relative aspect-square rounded-[14px] border text-sm transition-colors ${
                  isSelected
                    ? "border-ember/25 bg-ember-soft text-ember"
                    : isToday
                      ? "border-ember/70 bg-stone-surface text-stone-text"
                    : climbCount > 0
                      ? "border-stone-border/80 bg-stone-surface text-stone-text"
                      : "border-stone-border/60 bg-stone-surface/70 text-stone-secondary"
                } ${isInVisibleMonth ? "" : "opacity-45"}`}
              >
                <span className="flex h-full items-center justify-center">{day.getDate()}</span>
                {climbCount > 0 ? (
                  <span
                    className={`absolute bottom-1.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full ${
                      isSelected ? "bg-ember" : "bg-lichen"
                    }`}
                  />
                ) : null}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {selectedDateKey && selectedSummary.length === 0 ? (
          <p className="text-sm text-stone-muted">
            No climbs logged on {formatSummaryDate(selectedDateKey)}.
          </p>
        ) : selectedSummary.length === 0 ? (
          <p className="text-sm text-stone-muted">No climbs logged this month.</p>
        ) : (
          selectedSummary.map(([dateKey, count]) => (
            <div
              key={dateKey}
              className={`flex items-center justify-between rounded-[18px] border px-3 py-2 text-sm ${
                selectedDateKey === dateKey
                  ? "border-ember/20 bg-ember-soft text-ember"
                  : "border-stone-border/70 bg-stone-alt text-stone-secondary"
              }`}
            >
              <span>{formatSummaryDate(dateKey)}</span>
              <span className="font-semibold text-stone-text">{count} climbs</span>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
