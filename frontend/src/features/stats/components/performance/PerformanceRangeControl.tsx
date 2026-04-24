import StatsSegmentedControl from "../StatsSegmentedControl"
import type { PerformanceRange, PerformanceRangeOption } from "../../domain/performance/types"

type PerformanceRangeControlProps = {
  options: PerformanceRangeOption[]
  value: PerformanceRange
  onChange: (value: PerformanceRange) => void
}

export default function PerformanceRangeControl({
  options,
  value,
  onChange,
}: PerformanceRangeControlProps) {
  return <StatsSegmentedControl options={options} value={value} onChange={onChange} />
}
