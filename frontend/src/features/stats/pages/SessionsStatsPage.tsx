import { getStatsCard } from "../config/statsCards"
import StatsDetailPlaceholderPage from "./StatsDetailPlaceholderPage"

export default function SessionsStatsPage() {
  return <StatsDetailPlaceholderPage card={getStatsCard("sessions")} />
}
