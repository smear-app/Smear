import ProgressionSurface from "./progression/ProgressionSurface"

type InsightProps = {
  body: string
  title?: string
  eyebrow?: string
}

export default function Insight({ body, title, eyebrow = "Insight" }: InsightProps) {
  return (
    <ProgressionSurface className="border-ember/15 bg-ember-soft/45 dark:border-ember/10 dark:bg-ember-soft/25">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ember">{eyebrow}</p>
      {title ? <h2 className="mt-2 text-lg font-semibold leading-snug text-stone-text">{title}</h2> : null}
      <p className={["text-sm leading-6 text-stone-text", title ? "mt-1.5" : "mt-2"].join(" ")}>{body}</p>
    </ProgressionSurface>
  )
}
