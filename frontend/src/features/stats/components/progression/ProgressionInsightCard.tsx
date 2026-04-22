import Insight from "../Insight"

type ProgressionInsightCardProps = {
  insight: string
}

export default function ProgressionInsightCard({ insight }: ProgressionInsightCardProps) {
  return <Insight body={insight} />
}
