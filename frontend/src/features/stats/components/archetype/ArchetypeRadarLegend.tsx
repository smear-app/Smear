const PERFORMANCE_FILL = "color-mix(in srgb, var(--ember) 26%, transparent)"
const PERFORMANCE_STROKE = "var(--ember)"
const VOLUME_STROKE = "color-mix(in srgb, var(--stone-secondary) 78%, var(--stone-border) 22%)"

export default function ArchetypeRadarLegend() {
  return (
    <div className="rounded-[16px] border border-stone-border/80 bg-stone-surface/92 px-3 py-2 text-[11px] shadow-[0_10px_24px_rgba(89,68,51,0.06)] backdrop-blur-sm dark:border-white/[0.06] dark:shadow-[0_12px_28px_rgba(0,0,0,0.16)]">
      <div className="flex items-center gap-2 text-stone-secondary">
        <span
          aria-hidden="true"
          className="h-2.5 w-2.5 rounded-[3px] border"
          style={{
            backgroundColor: PERFORMANCE_FILL,
            borderColor: PERFORMANCE_STROKE,
          }}
        />
        <span>Performance</span>
      </div>
      <div className="mt-1.5 flex items-center gap-2 text-stone-secondary">
        <svg aria-hidden="true" viewBox="0 0 18 6" className="h-1.5 w-[18px] overflow-visible">
          <line
            x1="0"
            y1="3"
            x2="18"
            y2="3"
            stroke={VOLUME_STROKE}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <span>Volume</span>
      </div>
    </div>
  )
}
