import StatsSegmentedControl from "../StatsSegmentedControl"
import type { ArchetypeTimeframe, ArchetypeTimeframeOption } from "../../domain/archetype/timeframes"

type ArchetypeTimeframeControlProps = {
  options: ArchetypeTimeframeOption[]
  value: ArchetypeTimeframe
  onChange: (value: ArchetypeTimeframe) => void
}

export default function ArchetypeTimeframeControl({
  options,
  value,
  onChange,
}: ArchetypeTimeframeControlProps) {
  return <StatsSegmentedControl options={options} value={value} onChange={onChange} />
}
