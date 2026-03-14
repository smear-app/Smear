import type { IconType } from "react-icons"
import { FiArrowLeft } from "react-icons/fi"
import { Link } from "react-router-dom"

type BackButtonSize = "sm" | "md" | "lg"

type BackButtonProps = {
  to?: string
  onClick?: () => void
  label?: string
  showLabel?: boolean
  icon?: IconType
  size?: BackButtonSize
  className?: string
  ariaLabel?: string
  state?: unknown
}

const SIZE_STYLES: Record<BackButtonSize, { button: string; icon: string; gap: string }> = {
  sm: {
    button: "h-9 w-9",
    icon: "h-4.5 w-4.5",
    gap: "gap-2",
  },
  md: {
    button: "h-11 w-11",
    icon: "h-5 w-5",
    gap: "gap-2.5",
  },
  lg: {
    button: "h-12 w-12",
    icon: "h-5.5 w-5.5",
    gap: "gap-3",
  },
}

export default function BackButton({
  to,
  onClick,
  label = "Back",
  showLabel = false,
  icon: Icon = FiArrowLeft,
  size = "md",
  className = "",
  ariaLabel,
  state,
}: BackButtonProps) {
  const sizeStyles = SIZE_STYLES[size]
  const sharedClassName = [
    "inline-flex items-center justify-center rounded-full border border-stone-border bg-stone-surface text-stone-text",
    "shadow-[0_10px_24px_rgba(89,68,51,0.05)] transition-colors duration-200 hover:border-ember/20 hover:text-ember",
    showLabel ? `px-3 ${sizeStyles.gap}` : sizeStyles.button,
    className,
  ]
    .filter(Boolean)
    .join(" ")

  const content = (
    <>
      <Icon className={sizeStyles.icon} />
      {showLabel ? <span className="text-sm font-medium">{label}</span> : null}
    </>
  )

  // TODO: reuse this across future nested detail/settings screens to keep stack navigation consistent.
  if (to) {
    return (
      <Link to={to} state={state} aria-label={ariaLabel ?? label} className={sharedClassName}>
        {content}
      </Link>
    )
  }

  return (
    <button type="button" onClick={onClick} aria-label={ariaLabel ?? label} className={sharedClassName}>
      {content}
    </button>
  )
}
