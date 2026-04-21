export type OutcomeDonutTone = "flash" | "send" | "unfinished"

export type OutcomeDonutBreakdownItem = {
  label: string
  count: number
  percentage: number
  percentageLabel?: string
  tone: OutcomeDonutTone
}

type OutcomeDonutBreakdownProps = {
  items: OutcomeDonutBreakdownItem[]
  centerLabel: string
  ariaLabel: string
}

const TONE_STYLES: Record<OutcomeDonutTone, string> = {
  flash: "var(--ember)",
  send: "color-mix(in srgb, var(--ember) 76%, white 24%)",
  unfinished: "color-mix(in srgb, var(--stone-border) 90%, transparent)",
}

export default function OutcomeDonutBreakdown({ items, centerLabel, ariaLabel }: OutcomeDonutBreakdownProps) {
  const totalCount = items.reduce((sum, item) => sum + item.count, 0)
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const chartSegments = items.map((item, index) => {
    const dash = totalCount > 0 ? (item.percentage / 100) * circumference : 0
    const priorPercentage = items.slice(0, index).reduce((sum, entry) => sum + entry.percentage, 0)

    return {
      ...item,
      dash,
      dashOffset: -(priorPercentage / 100) * circumference,
    }
  })

  return (
    <div className="mt-4 flex items-center gap-5">
      <div className="relative shrink-0">
        <svg viewBox="0 0 112 112" className="h-[104px] w-[104px]" role="img" aria-label={ariaLabel}>
          <circle
            cx="56"
            cy="56"
            r={radius}
            fill="none"
            stroke="color-mix(in srgb, var(--stone-border) 76%, transparent)"
            strokeWidth="12"
          />
          {chartSegments.map((item) => (
            <circle
              key={item.label}
              cx="56"
              cy="56"
              r={radius}
              fill="none"
              stroke={TONE_STYLES[item.tone]}
              strokeWidth="12"
              strokeLinecap="butt"
              strokeDasharray={`${item.dash} ${circumference - item.dash}`}
              strokeDashoffset={item.dashOffset}
              transform="rotate(-90 56 56)"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-semibold leading-none text-stone-text">{totalCount}</span>
          <span className="mt-1 text-[11px] font-medium text-stone-secondary">{centerLabel}</span>
        </div>
      </div>

      <div className="grid min-w-0 flex-1 grid-cols-1 gap-y-2.5">
        {items.map((item) => (
          <article key={item.label} className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 rounded-[3px]"
                style={{ backgroundColor: TONE_STYLES[item.tone] }}
              />
              <span className="truncate text-sm font-medium text-stone-text">{item.label}</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-stone-text">{item.percentageLabel ?? `${item.percentage}%`}</p>
              <p className="text-[11px] text-stone-secondary">{item.count}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
