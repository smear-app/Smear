type UserTagDifferenceBarProps = {
  tags: string[]
}

function formatTagList(tags: string[]) {
  const labels = tags.map((tag) => tag.replace(/_/g, " "))

  if (labels.length <= 1) {
    return labels[0] ?? ""
  }

  if (labels.length === 2) {
    return `${labels[0]} and ${labels[1]}`
  }

  return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`
}

export default function UserTagDifferenceBar({ tags }: UserTagDifferenceBarProps) {
  if (tags.length === 0) {
    return null
  }

  return (
    <div className="mt-3 rounded-[20px] border border-ember/15 bg-ember-soft/70 px-4 py-3 text-sm text-stone-secondary">
      <span className="font-semibold text-stone-text">You tagged this as</span>{" "}
      <span className="capitalize">{formatTagList(tags)}</span>
    </div>
  )
}
