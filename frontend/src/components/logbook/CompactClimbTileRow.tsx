import { useCallback, useRef, useState, type ReactNode } from "react"
import ClimbStatusPill from "../ClimbStatusPill"
import ClimbTileTitle from "./ClimbTileTitle"
import { getClimbColorBadgeStyle } from "../../lib/climbColors"
import { formatTagLabel, getPrimaryLogbookAttribute } from "../../lib/logbook"
import type { Climb } from "../../lib/climbs"

type CompactClimbTileRowProps = {
  climb: Climb
  metaText?: ReactNode
  density?: "logbook" | "home"
}

const DENSITY_CONFIG = {
  home: {
    chipSlotClass: "min-w-0 max-w-[8rem] shrink",
    chipThreshold: 72,
    gapClass: "gap-1",
    gridClass: "grid-cols-[4rem_minmax(0,1fr)_4.5rem]",
    metaClass: "mt-1 flex min-w-0 items-center gap-1.5 text-[11px] text-stone-muted",
    titleSlotClass: "min-w-0 flex-1",
    titleClass: "text-[13px] font-semibold",
  },
  logbook: {
    chipSlotClass: "min-w-0 max-w-[7rem] flex-none",
    chipThreshold: 120,
    gapClass: "gap-1",
    gridClass: "grid-cols-[4.25rem_minmax(0,1fr)_4.75rem]",
    metaClass: "mt-0.5 truncate text-[11px] text-stone-muted",
    titleSlotClass: "min-w-0 flex-1",
    titleClass: "",
  },
} as const

const GRADE_SLOT_WIDTH_CLASS = "w-[4.25rem]"
const STATUS_SLOT_WIDTH_CLASS = "w-[4.75rem]"

export default function CompactClimbTileRow({
  climb,
  metaText,
  density = "logbook",
}: CompactClimbTileRowProps) {
  const config = DENSITY_CONFIG[density]
  const badgeStyle = getClimbColorBadgeStyle(climb.climbColor)
  const primaryAttribute = getPrimaryLogbookAttribute(climb)
  const middleZoneObserverRef = useRef<ResizeObserver | null>(null)
  const [middleZoneWidth, setMiddleZoneWidth] = useState(0)
  const canShowChip = Boolean(primaryAttribute) && (middleZoneWidth === 0 || middleZoneWidth >= config.chipThreshold)

  const setMiddleZoneRef = useCallback((element: HTMLDivElement | null) => {
    middleZoneObserverRef.current?.disconnect()
    middleZoneObserverRef.current = null

    if (!element) {
      setMiddleZoneWidth(0)
      return
    }

    const updateMiddleZoneWidth = () => setMiddleZoneWidth(element.clientWidth)
    updateMiddleZoneWidth()

    const resizeObserver = new ResizeObserver(updateMiddleZoneWidth)
    resizeObserver.observe(element)
    middleZoneObserverRef.current = resizeObserver
  }, [])

  return (
    <div className={`grid items-center gap-2.5 ${config.gridClass}`}>
      <div className={`flex shrink-0 justify-start ${GRADE_SLOT_WIDTH_CLASS}`}>
        <div
          className="min-w-[3.5rem] rounded-[16px] border px-3 py-1.5 text-center text-sm font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]"
          style={badgeStyle}
        >
          {climb.gym_grade}
        </div>
      </div>

      <div ref={setMiddleZoneRef} className="min-w-0 overflow-hidden">
        {density === "home" ? (
          <div className="min-w-0">
            <div className={config.titleSlotClass}>
              <ClimbTileTitle climb={climb} className={`flex min-w-0 items-center leading-none ${config.titleClass}`.trim()} />
            </div>
            {primaryAttribute && canShowChip ? (
              <div className={`mt-1 flex min-w-0 items-center ${config.chipSlotClass}`}>
                <span className="inline-flex min-w-0 max-w-full items-center rounded-full border border-stone-border/70 bg-stone-alt px-2 py-0.5 leading-none text-[10px] font-medium text-stone-secondary">
                  <span className="truncate">{formatTagLabel(primaryAttribute)}</span>
                </span>
              </div>
            ) : null}
            {metaText ? (
              <div className={config.metaClass}>
                <div className="min-w-0 flex-1 truncate">{metaText}</div>
              </div>
            ) : null}
          </div>
        ) : (
          <>
            <div className={`flex min-w-0 items-center overflow-hidden ${config.gapClass}`}>
              <div className={config.titleSlotClass}>
                <ClimbTileTitle climb={climb} className={`flex min-w-0 items-center leading-none ${config.titleClass}`.trim()} />
              </div>

              {primaryAttribute && canShowChip ? (
                <div className={`flex items-center ${config.chipSlotClass}`}>
                  <span className="inline-flex min-w-0 max-w-full items-center rounded-full border border-stone-border/70 bg-stone-alt px-2 py-0.5 leading-none text-[10px] font-medium text-stone-secondary">
                    <span className="truncate">{formatTagLabel(primaryAttribute)}</span>
                  </span>
                </div>
              ) : null}
            </div>

            {metaText ? (
              <p className={config.metaClass}>{metaText}</p>
            ) : null}
          </>
        )}
      </div>

      <div className={`flex shrink-0 justify-end ${STATUS_SLOT_WIDTH_CLASS}`}>
        <ClimbStatusPill sendType={climb.send_type} className="w-full shrink-0 justify-center text-center" />
      </div>
    </div>
  )
}
