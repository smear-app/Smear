type StatsMetricTileProps = {
  label: string
  value: string
  description?: string
}

export default function StatsMetricTile({ label, value, description }: StatsMetricTileProps) {
  const secondaryText = description?.trim() ?? ""

  return (
    <article className="grid h-full min-h-[94px] grid-rows-[2rem_auto_1rem] rounded-[20px] bg-stone-bg px-3.5 py-2.5 dark:bg-stone-alt">
      <p
        className="text-[11px] font-semibold uppercase leading-4 tracking-[0.12em] text-stone-muted"
        style={{
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: 2,
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {label}
      </p>
      <div className="flex items-center">
        <p className="self-center text-[1.125rem] font-semibold leading-none text-stone-text">{value}</p>
      </div>
      <div className="min-h-4">
        {secondaryText ? (
          <p
            className="text-[11px] leading-4 text-stone-secondary"
            style={{
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {secondaryText}
          </p>
        ) : null}
      </div>
    </article>
  )
}
