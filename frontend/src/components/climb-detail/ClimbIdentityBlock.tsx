import { getClimbColorBadgeStyle, getClimbColorName } from "../../lib/climbColors"

type ClimbIdentityBlockProps = {
  gymGrade: string
  climbColor?: string | null
  officialName?: string | null
}

export default function ClimbIdentityBlock({
  gymGrade,
  climbColor,
  officialName,
}: ClimbIdentityBlockProps) {
  const badgeStyle = getClimbColorBadgeStyle(climbColor)
  const climbColorName = getClimbColorName(climbColor)

  return (
    <div>
      <div className="flex items-center gap-3">
        <div
          className="rounded-[18px] border px-3.5 py-2 text-base font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]"
          style={badgeStyle}
        >
          {gymGrade}
        </div>
        <p className="text-sm font-semibold text-stone-secondary">{climbColorName}</p>
      </div>

      {officialName ? (
        <h1 className="mt-4 text-[1.7rem] font-semibold leading-tight tracking-[-0.02em] text-stone-text">
          {officialName}
        </h1>
      ) : null}
    </div>
  )
}
