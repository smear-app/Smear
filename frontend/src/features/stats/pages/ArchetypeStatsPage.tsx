import { getStatsCard } from "../config/statsCards"
import StatsDetailPlaceholderPage from "./StatsDetailPlaceholderPage"

export default function ArchetypeStatsPage() {
  return <StatsDetailPlaceholderPage card={getStatsCard("archetype")} />
}
