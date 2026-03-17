import { useEffect, useMemo, useRef, useState } from "react"
import { FiChevronDown, FiChevronLeft, FiChevronRight } from "react-icons/fi"
import type { Climb } from "../../lib/climbs"

type LogbookCalendarScaffoldProps = {
  climbs: Climb[]
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

export default function LogbookCalendarScaffold({ climbs }: LogbookCalendarScaffoldProps) {
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()))
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null)
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const pickerRef = useRef<HTMLDivElement | null>(null)

  const climbCounts = useMemo(() => buildClimbCounts(climbs), [climbs])
  const calendarDays = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth])
  const availableYears = useMemo(() => {
    const years = new Set<number>([visibleMonth.getFullYear()])

    for (const climb of climbs) {
      years.add(new Date(climb.created_at).getFullYear())
    }

    const currentYear = new Date().getFullYear()
    for (let offset = -2; offset <= 2; offset += 1) {
      years.add(currentYear + offset)
    }

    return Array.from(years.values()).sort((left, right) => right - left)
  }, [climbs, visibleMonth])

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
    if (!isPickerOpen) {
      return undefined
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) {
        setIsPickerOpen(false)
      }
    }

    window.addEventListener("mousedown", handlePointerDown)
    return () => window.removeEventListener("mousedown", handlePointerDown)
  }, [isPickerOpen])

  return (
    <section className="rounded-[28px] border border-stone-border bg-stone-surface px-5 py-5 shadow-[0_14px_34px_rgba(89,68,51,0.08)]">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => {
            setVisibleMonth((current) => addMonths(current, -1))
            setSelectedDateKey(null)
          }}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-border bg-stone-alt text-stone-secondary transition-colors hover:bg-[#EFE7DD]"
        >
          <FiChevronLeft className="h-4 w-4" />
        </button>

        <div ref={pickerRef} className="relative">
          <button
            type="button"
            onClick={() => setIsPickerOpen((current) => !current)}
            className="inline-flex items-center gap-1 rounded-full border border-stone-border bg-stone-alt px-3 py-1.5 text-base font-semibold text-stone-text transition-colors hover:bg-[#EFE7DD]"
          >
            <span>{formatMonthHeading(visibleMonth)}</span>
            <FiChevronDown className={`h-4 w-4 text-stone-secondary transition-transform ${isPickerOpen ? "rotate-180" : ""}`} />
          </button>

          {isPickerOpen ? (
            <div className="absolute left-1/2 top-[calc(100%+0.5rem)] z-20 w-[min(18rem,calc(100vw-3.5rem))] -translate-x-1/2 rounded-[20px] border border-stone-border bg-stone-surface p-3 shadow-[0_20px_48px_rgba(89,68,51,0.16)]">
              <div className="grid gap-3">
                <div className="grid gap-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-muted">
                    Year
                  </p>
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {availableYears.map((year) => (
                      <button
                        key={year}
                        type="button"
                        onClick={() =>
                          setVisibleMonth((current) => new Date(year, current.getMonth(), 1))
                        }
                        className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                          visibleMonth.getFullYear() === year
                            ? "border-ember/20 bg-ember-soft text-ember"
                            : "border-stone-border bg-stone-alt text-stone-secondary"
                        }`}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  {Array.from({ length: 12 }, (_, monthIndex) => {
                    const monthDate = new Date(visibleMonth.getFullYear(), monthIndex, 1)
                    const isSelectedMonth = visibleMonth.getMonth() === monthIndex

                    return (
                      <button
                        key={monthIndex}
                        type="button"
                        onClick={() => {
                          setVisibleMonth(monthDate)
                          setSelectedDateKey(null)
                          setIsPickerOpen(false)
                        }}
                        className={`rounded-[14px] border px-2 py-2 text-sm font-semibold transition-colors ${
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
              </div>
            </div>
          ) : null}
        </div>

        <button
          type="button"
          aria-label="Next month"
          onClick={() => {
            setVisibleMonth((current) => addMonths(current, 1))
            setSelectedDateKey(null)
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

            return (
              <button
                key={dayKey}
                type="button"
                onClick={() => setSelectedDateKey((current) => (current === dayKey ? null : dayKey))}
                className={`relative aspect-square rounded-[14px] border text-sm transition-colors ${
                  isSelected
                    ? "border-ember/25 bg-ember-soft text-ember"
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
