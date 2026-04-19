import Insight from "../Insight"

type SessionInsightProps = {
  insight: string
}

export default function SessionInsight({ insight }: SessionInsightProps) {
  return <Insight body={insight} />
}
