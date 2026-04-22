import Insight from "../Insight"

type PerformanceInsightProps = {
  insight: string | null
}

export default function PerformanceInsight({ insight }: PerformanceInsightProps) {
  if (insight === null) {
    return null
  }

  return <Insight body={insight} />
}
