import Insight from "../Insight"

type PerformanceInsightProps = {
  insight: string
}

export default function PerformanceInsight({ insight }: PerformanceInsightProps) {
  return <Insight body={insight} />
}
