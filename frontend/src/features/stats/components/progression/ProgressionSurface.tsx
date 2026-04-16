import type { ReactNode } from "react"

type ProgressionSurfaceProps = {
  children: ReactNode
  className?: string
}

export default function ProgressionSurface({ children, className = "" }: ProgressionSurfaceProps) {
  return (
    <section
      className={[
        "rounded-[30px] border border-stone-border bg-stone-surface px-5 py-5",
        "shadow-[0_14px_34px_rgba(89,68,51,0.08)] dark:border-white/[0.06] dark:shadow-[0_16px_34px_rgba(0,0,0,0.22)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </section>
  )
}
