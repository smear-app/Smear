import MilestonesList from "../MilestonesList"
import type { ProgressionMilestone } from "../../domain/progression/types"

type ProgressionMilestonesListProps = {
  milestones: ProgressionMilestone[]
}

export default function ProgressionMilestonesList({ milestones }: ProgressionMilestonesListProps) {
  return <MilestonesList milestones={milestones} />
}
