import StatsSegmentedControl from "../StatsSegmentedControl"
import type { ProgressionRange, ProgressionRangeOption } from "../../domain/progression/types"

type ProgressionRangeControlProps = {
  options: ProgressionRangeOption[]
  value: ProgressionRange
  onChange: (value: ProgressionRange) => void
}

export default function ProgressionRangeControl({
  options,
  value,
  onChange,
}: ProgressionRangeControlProps) {
  return <StatsSegmentedControl options={options} value={value} onChange={onChange} />
}
