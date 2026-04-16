import ProgressionSurface from "./ProgressionSurface"

type ProgressionInsightCardProps = {
  insight: string
}

export default function ProgressionInsightCard({ insight }: ProgressionInsightCardProps) {
  return (
    <ProgressionSurface className="border-ember/15 bg-ember-soft/45 dark:border-ember/10 dark:bg-ember-soft/25">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ember">Insight</p>
      <p className="mt-2 text-sm leading-6 text-stone-text">{insight}</p>
    </ProgressionSurface>
  )
}
