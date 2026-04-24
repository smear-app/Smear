import StatsSegmentedControl from "../StatsSegmentedControl"
import type { ArchetypeSegment, ArchetypeSegmentOption } from "../../domain/archetype/types"

type ArchetypeSegmentControlProps = {
  options: ArchetypeSegmentOption[]
  value: ArchetypeSegment
  onChange: (value: ArchetypeSegment) => void
}

export default function ArchetypeSegmentControl({
  options,
  value,
  onChange,
}: ArchetypeSegmentControlProps) {
  return <StatsSegmentedControl options={options} value={value} onChange={onChange} />
}
