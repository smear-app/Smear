import type { ArchetypeSegment, ArchetypeSegmentOption } from "../../domain/archetype/types"

type ArchetypeSegmentControlProps = {
  options: ArchetypeSegmentOption[]
  value: ArchetypeSegment
  onChange: (value: ArchetypeSegment) => void
}

export default function ArchetypeSegmentControl({
  options,
  value,
  onChange,
}: ArchetypeSegmentControlProps) {
  const activeIndex = options.findIndex((option) => option.value === value)
  const segmentWidth = 100 / options.length

  return (
    <div className="relative flex rounded-full border border-stone-border bg-stone-surface p-1 shadow-[0_10px_24px_rgba(89,68,51,0.05)] dark:border-white/[0.06] dark:shadow-[0_12px_28px_rgba(0,0,0,0.18)]">
      <span
        aria-hidden="true"
        className="absolute inset-y-1 rounded-full bg-stone-bg shadow-sm transition-all duration-200 ease-out"
        style={{
          width: `calc(${segmentWidth}% - 0.25rem)`,
          left: `calc(${activeIndex * segmentWidth}% + 0.125rem)`,
        }}
      />

      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
          className={`relative z-10 flex-1 rounded-full px-3 py-2 text-sm font-medium transition-colors ${
            option.value === value ? "text-stone-text" : "text-stone-secondary"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
