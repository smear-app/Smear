const BALANCED_PERFORMANCE_MIN_RADIUS = 62
const BALANCED_PERFORMANCE_MAX_RADIUS = 88
const AGGRESSIVE_PERFORMANCE_MIN_RADIUS = 38
const AGGRESSIVE_PERFORMANCE_MAX_RADIUS = 95
const PERFORMANCE_LOW_DELTA = 0.5
const PERFORMANCE_HIGH_DELTA = 3
const VOLUME_MIN_RADIUS = 18
const VOLUME_MAX_RADIUS = 90

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function isFiniteNumber(value: number | null): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

function scalePresentValues(
  values: readonly (number | null)[],
  minRadius: number,
  maxRadius: number,
): number[] {
  const presentValues = values.filter(isFiniteNumber)

  if (presentValues.length === 0) {
    return values.map(() => 0)
  }

  const minimum = Math.min(...presentValues)
  const maximum = Math.max(...presentValues)

  if (maximum === minimum) {
    return values.map((value) => (isFiniteNumber(value) ? maxRadius : 0))
  }

  return values.map((value) => {
    if (!isFiniteNumber(value)) {
      return 0
    }

    const ratio = (value - minimum) / (maximum - minimum)
    return Math.round(minRadius + clamp(ratio, 0, 1) * (maxRadius - minRadius))
  })
}

function interpolate(start: number, end: number, strength: number) {
  return start + (end - start) * strength
}

function getPerformanceRadiusRange(values: readonly number[]) {
  const minimum = Math.min(...values)
  const maximum = Math.max(...values)
  const gradeDelta = maximum - minimum
  const strength = clamp(
    (gradeDelta - PERFORMANCE_LOW_DELTA) / (PERFORMANCE_HIGH_DELTA - PERFORMANCE_LOW_DELTA),
    0,
    1,
  )

  return {
    minRadius: interpolate(BALANCED_PERFORMANCE_MIN_RADIUS, AGGRESSIVE_PERFORMANCE_MIN_RADIUS, strength),
    maxRadius: interpolate(BALANCED_PERFORMANCE_MAX_RADIUS, AGGRESSIVE_PERFORMANCE_MAX_RADIUS, strength),
  }
}

export function scaleArchetypePerformanceRadarValues(values: readonly (number | null)[]): number[] {
  const presentValues = values.filter(isFiniteNumber)

  if (presentValues.length === 0) {
    return values.map(() => 0)
  }

  const { minRadius, maxRadius } = getPerformanceRadiusRange(presentValues)
  return scalePresentValues(values, minRadius, maxRadius)
}

export function scaleArchetypeVolumeRadarValues(values: readonly number[]): number[] {
  const transformedValues = values.map((value) =>
    Number.isFinite(value) && value > 0 ? Math.sqrt(value) : null,
  )

  return scalePresentValues(transformedValues, VOLUME_MIN_RADIUS, VOLUME_MAX_RADIUS)
}
