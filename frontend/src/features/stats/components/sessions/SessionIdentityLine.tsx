import type { SessionIdentity } from "../../domain/sessions/types"

type SessionIdentityLineProps = {
  identity: SessionIdentity
  align?: "left" | "center"
}

export default function SessionIdentityLine({ identity, align = "left" }: SessionIdentityLineProps) {
  return (
    <p
      className={`flex max-w-full min-w-0 items-center gap-1.5 truncate text-sm leading-5 ${
        align === "center" ? "mx-auto justify-center" : "justify-start"
      }`}
    >
      <span className="min-w-0 truncate font-semibold text-stone-text">{identity.label}</span>
      <span aria-hidden="true" className="shrink-0 text-stone-muted">
        ·
      </span>
      <span className="min-w-0 truncate text-stone-secondary">{identity.reason}</span>
    </p>
  )
}
