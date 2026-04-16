import { getStatsCard } from "../config/statsCards"
import StatsDetailPlaceholderPage from "./StatsDetailPlaceholderPage"

export default function PerformanceStatsPage() {
  return <StatsDetailPlaceholderPage card={getStatsCard("performance")} />
}
