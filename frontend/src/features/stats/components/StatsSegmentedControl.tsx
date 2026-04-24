export type StatsSegmentedControlOption<TValue extends string> = {
  value: TValue
  label: string
}

type StatsSegmentedControlProps<TValue extends string> = {
  options: StatsSegmentedControlOption<TValue>[]
  value: TValue
  onChange: (value: TValue) => void
}

export default function StatsSegmentedControl<TValue extends string>({
  options,
  value,
  onChange,
}: StatsSegmentedControlProps<TValue>) {
  const activeIndex = Math.max(0, options.findIndex((option) => option.value === value))

  return (
    <div className="relative flex rounded-full border border-stone-border bg-stone-surface p-1 shadow-[0_10px_24px_rgba(89,68,51,0.05)] dark:border-white/[0.06] dark:shadow-[0_12px_28px_rgba(0,0,0,0.18)]">
      <span
        aria-hidden="true"
        className="absolute inset-y-1 left-1 rounded-full bg-stone-bg shadow-sm transition-transform duration-200 ease-out"
        style={{
          width: `calc((100% - 0.5rem) / ${options.length})`,
          transform: `translateX(${activeIndex * 100}%)`,
        }}
      />

      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
          className={`relative z-10 flex min-h-9 flex-1 items-center justify-center rounded-full px-3 py-1.5 text-center text-sm font-medium transition-colors ${
            option.value === value ? "text-stone-text" : "text-stone-secondary"
          }`}
        >
          <span className="block leading-[1.12]">{option.label}</span>
        </button>
      ))}
    </div>
  )
}
