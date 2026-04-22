import type { ProgressionMilestone, ProgressionViewModel } from "./types"

export function selectProgressionMilestones(viewModel: ProgressionViewModel): ProgressionMilestone[] {
  return [...viewModel.milestones].sort(
    (left, right) => new Date(right.achievedAt).getTime() - new Date(left.achievedAt).getTime(),
  )
}
