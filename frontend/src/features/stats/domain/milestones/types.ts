export type StatsMilestoneMetadata = Record<string, boolean | number | string | null>

export type StatsMilestone = {
  id: string
  title: string
  achievedAt: string
  metadata?: StatsMilestoneMetadata
}
