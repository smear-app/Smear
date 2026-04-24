export type WorkingGradeAxis = {
  domainMin: number
  domainMax: number
  domainRange: number
  ticks: number[]
  formatTick: (value: number) => string
}

const MIN_SUPPORTED_GRADE = 0
const DEFAULT_HALF_SPAN = 2
const DEFAULT_DOMAIN_SPAN = DEFAULT_HALF_SPAN * 2
const WIDE_SPREAD_THRESHOLD = 3

function getFiniteValues(values: readonly (number | null | undefined)[]): number[] {
  return values.filter((value): value is number => typeof value === "number" && Number.isFinite(value)).sort((left, right) => left - right)
}

function getMedian(values: readonly number[]): number {
  const midpoint = Math.floor(values.length / 2)

  if (values.length % 2 === 1) {
    return values[midpoint]
  }

  return (values[midpoint - 1] + values[midpoint]) / 2
}

function getWholeGradeTicks(domainMin: number, domainMax: number) {
  return Array.from({ length: domainMax - domainMin + 1 }, (_, index) => domainMin + index)
}

export function formatWorkingGradeAxisTick(value: number) {
  return `V${Math.round(value)}`
}

export function buildWorkingGradeAxis(values: readonly (number | null | undefined)[]): WorkingGradeAxis {
  const finiteValues = getFiniteValues(values)

  if (finiteValues.length === 0) {
    return {
      domainMin: MIN_SUPPORTED_GRADE,
      domainMax: MIN_SUPPORTED_GRADE + DEFAULT_DOMAIN_SPAN,
      domainRange: DEFAULT_DOMAIN_SPAN,
      ticks: getWholeGradeTicks(MIN_SUPPORTED_GRADE, MIN_SUPPORTED_GRADE + DEFAULT_DOMAIN_SPAN),
      formatTick: formatWorkingGradeAxisTick,
    }
  }

  const minValue = finiteValues[0]
  const maxValue = finiteValues[finiteValues.length - 1]
  const spread = maxValue - minValue
  let domainMin: number
  let domainMax: number

  if (spread > WIDE_SPREAD_THRESHOLD) {
    domainMin = Math.max(MIN_SUPPORTED_GRADE, Math.floor(minValue))
    domainMax = Math.max(domainMin + 1, Math.ceil(maxValue))
  } else {
    const median = getMedian(finiteValues)
    domainMin = Math.max(MIN_SUPPORTED_GRADE, Math.floor(median - DEFAULT_HALF_SPAN))
    domainMax = Math.ceil(median + DEFAULT_HALF_SPAN)

    if (domainMax - domainMin < DEFAULT_DOMAIN_SPAN) {
      domainMax = domainMin + DEFAULT_DOMAIN_SPAN
    }
  }

  return {
    domainMin,
    domainMax,
    domainRange: domainMax - domainMin,
    ticks: getWholeGradeTicks(domainMin, domainMax),
    formatTick: formatWorkingGradeAxisTick,
  }
}
