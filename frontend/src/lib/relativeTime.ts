const MINUTE_MS = 60 * 1000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS
const WEEK_MS = 7 * DAY_MS
const MONTH_MS = 30 * DAY_MS

function pluralize(value: number, unit: string) {
  return `${value} ${unit}${value === 1 ? "" : "s"} ago`
}

export function formatRelativeTime(value: string | number | Date, now: Date = new Date()) {
  const timestamp = new Date(value).getTime()

  if (Number.isNaN(timestamp)) {
    return ""
  }

  const diffMs = Math.max(0, now.getTime() - timestamp)

  if (diffMs < DAY_MS) {
    return "today"
  }

  if (diffMs < DAY_MS * 2) {
    return "yesterday"
  }

  if (diffMs < WEEK_MS) {
    return pluralize(Math.floor(diffMs / DAY_MS), "day")
  }

  if (diffMs < MONTH_MS) {
    return pluralize(Math.floor(diffMs / WEEK_MS), "week")
  }

  return pluralize(Math.floor(diffMs / MONTH_MS), "month")
}
