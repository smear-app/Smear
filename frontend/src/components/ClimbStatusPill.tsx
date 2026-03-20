type ClimbStatus = "send" | "flash" | "attempt" | "not_attempted"

type ClimbStatusPillProps = {
  sendType?: string | null
  className?: string
}

function normalizeClimbStatus(sendType?: string | null): ClimbStatus {
  const normalized = sendType?.toLowerCase()

  if (normalized === "flash") {
    return "flash"
  }

  if (normalized === "send") {
    return "send"
  }

  if (normalized === "not_attempted") {
    return "not_attempted"
  }

  return "attempt"
}

export default function ClimbStatusPill({ sendType, className = "" }: ClimbStatusPillProps) {
  const status = normalizeClimbStatus(sendType)

  const stylesByStatus: Record<ClimbStatus, string> = {
    flash: "border-ember/10 bg-ember-soft text-ember",
    send: "border-ember/10 bg-ember-soft text-ember",
    attempt: "border-stone-border bg-stone-alt text-stone-secondary",
    // TODO: Once the data model supports this explicitly, wire not_attempted from user-specific climb state.
    not_attempted: "border-stone-border/80 bg-stone-surface text-stone-muted",
  }

  const labelByStatus: Record<ClimbStatus, string> = {
    flash: "Flash",
    send: "Send",
    attempt: "Attempt",
    not_attempted: "Not attempted",
  }

  return (
    <div
      className={`inline-flex rounded-full border px-1.5 py-0.5 text-[11px] font-semibold ${stylesByStatus[status]} ${className}`.trim()}
    >
      {labelByStatus[status]}
    </div>
  )
}
