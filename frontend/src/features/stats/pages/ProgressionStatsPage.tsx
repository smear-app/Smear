import { getStatsCard } from "../config/statsCards"
import StatsDetailPlaceholderPage from "./StatsDetailPlaceholderPage"

export default function ProgressionStatsPage() {
  return <StatsDetailPlaceholderPage card={getStatsCard("progression")} />
}
