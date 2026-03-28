import {
  CLIMB_TAG_CATEGORIES,
  getClimbTagSelectionCount,
  isClimbTagDisabled,
  isClimbTagSelected,
  toggleClimbTag,
} from "../lib/climbTags"

function TagChip({ label, isSelected, isDisabled, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      aria-pressed={isSelected}
      aria-label={`${label}${isSelected ? ", selected" : ""}${isDisabled ? ", unavailable, category limit reached" : ""}`}
      className={`rounded-full border px-3 py-2 text-sm font-medium transition-all duration-200 ${
        isSelected
          ? "border-ember/25 bg-ember-soft text-ember shadow-[0_8px_18px_rgba(201,86,26,0.14)]"
          : isDisabled
            ? "cursor-not-allowed border-stone-border/70 bg-stone-surface/70 text-stone-muted opacity-55"
            : "border-stone-border bg-stone-surface text-stone-secondary active:scale-[0.98]"
      }`}
    >
      <span>{label}</span>
    </button>
  )
}

function CategoryCard({ category, selectedTags, onChange, disabled }) {
  const selectedCount = getClimbTagSelectionCount(selectedTags, category.id)

  return (
    <section className="rounded-[20px] border border-stone-border bg-stone-alt px-4 py-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-stone-text">{category.title}</h3>
        <span aria-live="polite" className="shrink-0 text-xs font-medium text-stone-secondary">
          {selectedCount}/{category.limit} selected
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {category.options.map((tag) => {
          const isSelected = isClimbTagSelected(selectedTags, tag)
          const isDisabled = disabled || isClimbTagDisabled(selectedTags, tag)

          return (
            <TagChip
              key={tag}
              label={tag}
              isSelected={isSelected}
              isDisabled={isDisabled}
              onClick={() => onChange(toggleClimbTag(selectedTags, tag))}
            />
          )
        })}
      </div>
    </section>
  )
}

function ClimbTagSelector({ selectedTags, onChange, disabled = false, helperText = null }) {
  return (
    <div className={helperText ? "space-y-3" : ""}>
      {helperText ? <p className="text-xs leading-5 text-stone-muted">{helperText}</p> : null}

      <div className="space-y-3">
        {CLIMB_TAG_CATEGORIES.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            selectedTags={selectedTags}
            onChange={onChange}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  )
}

export default ClimbTagSelector
