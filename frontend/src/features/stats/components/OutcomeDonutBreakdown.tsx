import { OUTCOME_TONE_STYLES, type OutcomeTone } from "./outcomeToneStyles"

export type OutcomeDonutTone = OutcomeTone

export type OutcomeDonutBreakdownItem = {
  label: string
  count: number
  percentage: number
  percentageLabel?: string
  tone: OutcomeDonutTone
}

type OutcomeDonutBreakdownProps = {
  items: OutcomeDonutBreakdownItem[]
  totalCount: number
  centerLabel: string
  ariaLabel: string
}

const CHART_CENTER = 56
const RADIUS = 42
const STROKE_WIDTH = 12

function polarToCartesian(angleDegrees: number) {
  const angleRadians = (angleDegrees * Math.PI) / 180

  return {
    x: CHART_CENTER + RADIUS * Math.cos(angleRadians),
    y: CHART_CENTER + RADIUS * Math.sin(angleRadians),
  }
}

function describeArc(startPercent: number, endPercent: number) {
  const startAngle = startPercent * 3.6 - 90
  const endAngle = endPercent * 3.6 - 90
  const start = polarToCartesian(startAngle)
  const end = polarToCartesian(endAngle)
  const largeArcFlag = endPercent - startPercent > 50 ? 1 : 0

  return `M ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`
}

export default function OutcomeDonutBreakdown({ items, totalCount, centerLabel, ariaLabel }: OutcomeDonutBreakdownProps) {
  const chartSegments = items.map((item, index) => {
    const priorPercentage = items.slice(0, index).reduce((sum, entry) => sum + entry.percentage, 0)
    const startPercent = Math.min(100, Math.max(0, priorPercentage))
    const endPercent = Math.min(100, Math.max(startPercent, priorPercentage + item.percentage))

    return {
      ...item,
      startPercent,
      endPercent,
    }
  })

  return (
    <div className="mt-4 flex items-center gap-5">
      <div className="relative shrink-0">
        <svg viewBox="0 0 112 112" className="h-[104px] w-[104px]" role="img" aria-label={ariaLabel}>
            <circle
            cx={CHART_CENTER}
            cy={CHART_CENTER}
            r={RADIUS}
            fill="none"
            stroke="color-mix(in srgb, var(--stone-border) 76%, transparent)"
            strokeWidth={STROKE_WIDTH}
          />
          {chartSegments
            .filter((item) => totalCount > 0 && item.percentage > 0)
            .map((item) =>
              item.endPercent - item.startPercent >= 99.999 ? (
                <circle
                  key={item.label}
                  cx={CHART_CENTER}
                  cy={CHART_CENTER}
                  r={RADIUS}
                  fill="none"
                  stroke={OUTCOME_TONE_STYLES[item.tone]}
                  strokeWidth={STROKE_WIDTH}
                />
              ) : (
                <path
                  key={item.label}
                  d={describeArc(item.startPercent, item.endPercent)}
                  fill="none"
                  stroke={OUTCOME_TONE_STYLES[item.tone]}
                  strokeWidth={STROKE_WIDTH}
                  strokeLinecap="butt"
                />
              ),
            )}
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
                style={{ backgroundColor: OUTCOME_TONE_STYLES[item.tone] }}
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
