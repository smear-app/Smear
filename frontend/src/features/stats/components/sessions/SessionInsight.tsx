import ProgressionSurface from "../progression/ProgressionSurface"

type SessionInsightProps = {
  insight: string
}

export default function SessionInsight({ insight }: SessionInsightProps) {
  return (
    <ProgressionSurface className="border-ember/15 bg-ember-soft/45 dark:border-ember/10 dark:bg-ember-soft/25">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ember">Insight</p>
      <p className="mt-2 text-sm leading-6 text-stone-text">{insight}</p>
    </ProgressionSurface>
  )
}
