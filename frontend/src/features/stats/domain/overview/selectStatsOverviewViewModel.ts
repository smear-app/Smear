import { calculateArchetypeMetrics, calculatePerformanceMetrics, calculateProgressionMetrics, calculateSessionMetrics } from "../calculators"
import { normalizeSoftRadarValues } from "../archetype/selectArchetypeViewModel"
import type { ArchetypeGroupKey, ArchetypeTagMetric } from "../calculators/archetype"
import type { EnrichedClimb } from "../primitives"
import type { StatsAreaId, StatsAreaPlaceholder, StatsPreviewVisualModel } from "../types"

const DAY_MS = 24 * 60 * 60 * 1000
const SESSIONS_WINDOW_DAYS = 7
const DEFAULT_WINDOW_DAYS = 30
const PROGRESSION_HALF_DAYS = 15
const MEANINGFUL_GRADE_DELTA = 0.5
const PERFORMANCE_MIN_CLIMBS = 8
const ARCHETYPE_MIN_TAGGED_CLIMBS = 6
const ARCHETYPE_SEPARATION_MARGIN = 8
const PERFORMANCE_VALUE_OFFSET = 1
const THIRTY_DAY_LABEL = "last 30 days"

type OverviewTile = StatsAreaPlaceholder

export type StatsOverviewViewModel = {
  tiles: Record<StatsAreaId, OverviewTile>
  visuals: Record<StatsAreaId, StatsPreviewVisualModel>
}

type WindowBounds = {
  start: Date
  end: Date
}

type ArchetypeCandidate = {
  metric: ArchetypeTagMetric
  group: ArchetypeGroupKey
  volumeScore: number
  performanceScore: number
  identityScore: number
}

type ArchetypeTileResult = {
  tile: OverviewTile
  visual: StatsPreviewVisualModel
}

type PerformanceTileResult = {
  tile: OverviewTile
  visual: StatsPreviewVisualModel
}

type SessionsTileResult = {
  tile: OverviewTile
  visual: StatsPreviewVisualModel
}

type ProgressionTileResult = {
  tile: OverviewTile
  visual: StatsPreviewVisualModel
}

const GROUP_LABELS: Record<ArchetypeGroupKey, string> = {
  holdType: "Hold",
  movement: "Movement",
  terrain: "Wall",
  mechanics: "Mechanic",
}

const STYLE_DESCRIPTORS: Partial<Record<string, string>> = {
  slab: "Technical",
  vertical: "Technical",
  overhang: "Powerful",
  cave: "Steep",
  dynamic: "Dynamic",
  static: "Controlled",
  coordination: "Coordinated",
  crimp: "Precise",
  sloper: "Open-hand",
  pinch: "Tension",
  pocket: "Precise",
  jug: "Positive",
  volume: "Technical",
  undercling: "Tension",
  balance: "Technical",
  power: "Powerful",
  dyno: "Explosive",
}

const STYLE_SUMMARIES: Partial<Record<string, string>> = {
  slab: "technical footwork and balance lately",
  vertical: "controlled wall climbing lately",
  overhang: "powerful steep terrain lately",
  cave: "steep compression and tension lately",
  dynamic: "explosive movement lately",
  static: "controlled movement lately",
  coordination: "coordinated sequences lately",
  crimp: "precise finger-driven climbing lately",
  sloper: "open-hand tension lately",
  pinch: "compression and pinch strength lately",
  pocket: "precise pocket climbing lately",
  jug: "positive holds lately",
  volume: "volume-based movement lately",
  undercling: "body tension and underclings lately",
  balance: "balance-heavy mechanics lately",
  power: "powerful moves lately",
  dyno: "explosive mechanics lately",
}

function getNow(options: { now?: Date | string } = {}) {
  const date = options.now ? new Date(options.now) : new Date()
  return Number.isFinite(date.getTime()) ? date : new Date()
}

function getWindowBounds(now: Date, days: number): WindowBounds {
  return {
    start: new Date(now.getTime() - days * DAY_MS),
    end: now,
  }
}

function filterClimbsInWindow(climbs: readonly EnrichedClimb[], bounds: WindowBounds): EnrichedClimb[] {
  const startTime = bounds.start.getTime()
  const endTime = bounds.end.getTime()

  return climbs.filter((climb) => {
    const loggedAt = new Date(climb.loggedAt).getTime()
    return Number.isFinite(loggedAt) && loggedAt >= startTime && loggedAt <= endTime
  })
}

function formatSignedGradeDelta(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return "-"
  }

  const sign = value >= 0 ? "+" : ""
  return `${sign}${value.toFixed(1)} working grade`
}

function average(values: readonly number[]): number | null {
  if (values.length === 0) {
    return null
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function selectSessionsTile(climbs: readonly EnrichedClimb[], now: Date): OverviewTile {
  const windowClimbs = filterClimbsInWindow(climbs, getWindowBounds(now, SESSIONS_WINDOW_DAYS))
  const sessions = calculateSessionMetrics(windowClimbs).sessions
  const sessionCount = sessions.length
  const totalHours = sessions.reduce((sum, session) => sum + (session.session.durationMs ?? 0), 0) / (60 * 60 * 1000)
  const descriptor =
    sessionCount === 0 ? "No sessions yet" : sessionCount === 1 ? "Getting started" : sessionCount <= 3 ? "Consistent" : "High volume week"

  return {
    descriptor,
    primaryMetric: `${sessionCount} ${sessionCount === 1 ? "session" : "sessions"}`,
    secondaryText: `${totalHours.toFixed(1)} hrs on wall`,
  }
}

function getDailyWindowBounds(now: Date, daysAgoFromEnd: number): WindowBounds {
  const end = new Date(now.getTime() - daysAgoFromEnd * DAY_MS)
  const start = new Date(end.getTime() - DAY_MS)

  return { start, end }
}

function selectSessionsPreviewBars(climbs: readonly EnrichedClimb[], now: Date): StatsPreviewVisualModel {
  const dayWindows = Array.from({ length: SESSIONS_WINDOW_DAYS }, (_, index) =>
    getDailyWindowBounds(now, SESSIONS_WINDOW_DAYS - index - 1),
  )
  const dayDurations = dayWindows.map((bounds) => {
    const dayClimbs = filterClimbsInWindow(climbs, bounds)
    const durationMs = calculateSessionMetrics(dayClimbs).sessions.reduce(
      (sum, session) => sum + (session.session.durationMs ?? 0),
      0,
    )

    return {
      active: dayClimbs.length > 0,
      durationMs,
    }
  })
  const maximumDuration = Math.max(...dayDurations.map((day) => day.durationMs), 0)

  return {
    kind: "dailyBars",
    bars: dayDurations.map((day, index) => ({
      id: `day-${index}`,
      active: day.active,
      heightPercent: !day.active
        ? 8
        : maximumDuration > 0
          ? Math.max(18, Math.round((day.durationMs / maximumDuration) * 82))
          : 18,
    })),
  }
}

function selectSessionsOverview(climbs: readonly EnrichedClimb[], now: Date): SessionsTileResult {
  return {
    tile: selectSessionsTile(climbs, now),
    visual: selectSessionsPreviewBars(climbs, now),
  }
}

function getProgressionGradeBins(climbs: readonly EnrichedClimb[], now: Date) {
  const windowStart = now.getTime() - DEFAULT_WINDOW_DAYS * DAY_MS
  const bucketDays = 10

  return Array.from({ length: 3 }, (_, index) => {
    const start = new Date(windowStart + index * bucketDays * DAY_MS)
    const end = index === 2 ? now : new Date(windowStart + (index + 1) * bucketDays * DAY_MS)
    const workingGrades = calculateProgressionMetrics(filterClimbsInWindow(climbs, { start, end })).weekly.flatMap((bucket) =>
      bucket.workingGrade === null ? [] : [bucket.workingGrade],
    )

    return average(workingGrades)
  })
}

function selectProgressionTile(climbs: readonly EnrichedClimb[], now: Date): OverviewTile {
  const previousBounds = {
    start: new Date(now.getTime() - DEFAULT_WINDOW_DAYS * DAY_MS),
    end: new Date(now.getTime() - PROGRESSION_HALF_DAYS * DAY_MS),
  }
  const recentBounds = {
    start: previousBounds.end,
    end: now,
  }
  const previousWorkingGrade = calculateProgressionMetrics(filterClimbsInWindow(climbs, previousBounds)).weekly.flatMap((bucket) =>
    bucket.workingGrade === null ? [] : [bucket.workingGrade],
  )
  const recentWorkingGrade = calculateProgressionMetrics(filterClimbsInWindow(climbs, recentBounds)).weekly.flatMap((bucket) =>
    bucket.workingGrade === null ? [] : [bucket.workingGrade],
  )
  const previousAverage = average(previousWorkingGrade)
  const recentAverage = average(recentWorkingGrade)
  const workingGradeDelta = previousAverage === null || recentAverage === null ? null : recentAverage - previousAverage
  const descriptor =
    workingGradeDelta === null
      ? "Building baseline"
      : workingGradeDelta >= MEANINGFUL_GRADE_DELTA
        ? "Trending up"
        : workingGradeDelta <= -MEANINGFUL_GRADE_DELTA
          ? "Slight dip"
          : "Holding steady"

  return {
    descriptor,
    primaryMetric: formatSignedGradeDelta(workingGradeDelta),
    secondaryText: THIRTY_DAY_LABEL,
  }
}

function selectProgressionPreviewVisual(climbs: readonly EnrichedClimb[], now: Date, hasValidTrend: boolean): StatsPreviewVisualModel {
  const workingGradeBins = getProgressionGradeBins(climbs, now)
  const validGrades = workingGradeBins.flatMap((grade) => (grade === null ? [] : [grade]))
  const averageGrade = average(validGrades)

  return {
    kind: "trendDots",
    muted: !hasValidTrend,
    points: workingGradeBins.map((grade, index) => {
      const delta = grade === null || averageGrade === null ? 0 : grade - averageGrade
      const yPercent = grade === null ? 50 : Math.min(Math.max(50 - delta * 18, 20), 80)

      return {
        id: `grade-bin-${index}`,
        xPercent: index === 0 ? 18 : index === 1 ? 50 : 82,
        yPercent,
        active: grade !== null && hasValidTrend,
      }
    }),
  }
}

function selectProgressionOverview(climbs: readonly EnrichedClimb[], now: Date): ProgressionTileResult {
  const tile = selectProgressionTile(climbs, now)

  return {
    tile,
    visual: selectProgressionPreviewVisual(climbs, now, tile.primaryMetric !== "-"),
  }
}

function selectPerformanceOverview(climbs: readonly EnrichedClimb[], now: Date): PerformanceTileResult {
  const windowClimbs = filterClimbsInWindow(climbs, getWindowBounds(now, DEFAULT_WINDOW_DAYS))
  const metrics = calculatePerformanceMetrics(windowClimbs)
  const sendRatePercent = metrics.totalClimbs === 0 ? 0 : Math.round((metrics.totalSentClimbs / metrics.totalClimbs) * 100)
  const hasEnoughClimbs = metrics.totalClimbs >= PERFORMANCE_MIN_CLIMBS
  const descriptor =
    !hasEnoughClimbs
      ? "Log more climbs"
      : sendRatePercent >= 75
        ? "Strong conversion"
        : sendRatePercent >= 50
          ? "Converting well"
          : sendRatePercent >= 25
            ? "Projecting"
            : "Working moves"

  return {
    tile: {
      descriptor,
      primaryMetric: hasEnoughClimbs ? `Send rate ${sendRatePercent}%` : "-",
      secondaryText: THIRTY_DAY_LABEL,
    },
    visual: {
      kind: "conversionRing",
      percent: hasEnoughClimbs ? sendRatePercent : 0,
      active: hasEnoughClimbs,
    },
  }
}

function getKnownArchetypeTagIds(metricsByGroup: ReturnType<typeof calculateArchetypeMetrics>) {
  return new Set(Object.values(metricsByGroup).flat().map((metric) => metric.tagKey))
}

function countTaggedClimbs(climbs: readonly EnrichedClimb[], knownTagIds: ReadonlySet<string>) {
  return climbs.filter((climb) =>
    [...Object.values(climb.canonicalTags).flat(), ...climb.tags].some((tag) => knownTagIds.has(tag.id)),
  ).length
}

function toArchetypeCandidates(metricsByGroup: ReturnType<typeof calculateArchetypeMetrics>): ArchetypeCandidate[] {
  const metrics = Object.entries(metricsByGroup).flatMap(([group, groupMetrics]) =>
    groupMetrics.map((metric) => ({ metric, group: group as ArchetypeGroupKey })),
  )
  const volumeScores = normalizeSoftRadarValues(metrics.map(({ metric }) => (metric.climbCount === 0 ? null : metric.climbCount)))
  const performanceScores = normalizeSoftRadarValues(
    metrics.map(({ metric }) => (metric.workingGrade === null ? null : metric.workingGrade)),
    { valueOffset: PERFORMANCE_VALUE_OFFSET },
  )

  return metrics.map(({ metric, group }, index) => ({
    metric,
    group,
    volumeScore: volumeScores[index],
    performanceScore: performanceScores[index],
    identityScore: Math.round(volumeScores[index] * 0.75 + performanceScores[index] * 0.25),
  }))
}

function selectArchetypeRadarVisual(
  candidates: readonly ArchetypeCandidate[],
  state: "empty" | "balanced" | "active",
): StatsPreviewVisualModel {
  if (state === "empty") {
    return {
      kind: "radar",
      state,
      axes: Object.entries(GROUP_LABELS).map(([id, label]) => ({ id, label, value: 0 })),
    }
  }

  if (state === "balanced") {
    return {
      kind: "radar",
      state,
      axes: Object.entries(GROUP_LABELS).map(([id, label]) => ({ id, label, value: 84 })),
    }
  }

  return {
    kind: "radar",
    state,
    axes: Object.entries(GROUP_LABELS).map(([id, label]) => {
      const groupCandidates = candidates.filter((candidate) => candidate.group === id)
      const value = groupCandidates.length === 0
        ? 0
        : Math.max(...groupCandidates.map((candidate) => candidate.identityScore))

      return { id, label, value }
    }),
  }
}

function selectArchetypeOverview(climbs: readonly EnrichedClimb[], now: Date): ArchetypeTileResult {
  const windowClimbs = filterClimbsInWindow(climbs, getWindowBounds(now, DEFAULT_WINDOW_DAYS))
  const metricsByGroup = calculateArchetypeMetrics(windowClimbs)
  const taggedClimbCount = countTaggedClimbs(windowClimbs, getKnownArchetypeTagIds(metricsByGroup))
  const candidates = toArchetypeCandidates(metricsByGroup)
    .filter((candidate) => candidate.metric.climbCount > 0)
    .sort((left, right) => right.identityScore - left.identityScore)

  if (taggedClimbCount < ARCHETYPE_MIN_TAGGED_CLIMBS) {
    return {
      tile: {
        descriptor: "Log more climbs",
        primaryMetric: "",
        secondaryText: THIRTY_DAY_LABEL,
      },
      visual: selectArchetypeRadarVisual(candidates, "empty"),
    }
  }

  const top = candidates[0]
  const runnerUp = candidates[1]

  if (!top || (runnerUp && top.identityScore - runnerUp.identityScore < ARCHETYPE_SEPARATION_MARGIN)) {
    return {
      tile: {
        descriptor: "Well-rounded lately",
        primaryMetric: "",
        secondaryText: THIRTY_DAY_LABEL,
      },
      visual: selectArchetypeRadarVisual(candidates, "balanced"),
    }
  }

  const descriptor = STYLE_DESCRIPTORS[top.metric.tagKey] ?? GROUP_LABELS[top.group]

  return {
    tile: {
      descriptor: `${descriptor} / ${top.metric.tagLabel}`,
      primaryMetric: "",
      secondaryText: STYLE_SUMMARIES[top.metric.tagKey] ?? `${GROUP_LABELS[top.group].toLowerCase()} tendency lately`,
    },
    visual: selectArchetypeRadarVisual(candidates, "active"),
  }
}

export function selectStatsOverviewViewModel(
  climbs: readonly EnrichedClimb[],
  options: { now?: Date | string } = {},
): StatsOverviewViewModel {
  const now = getNow(options)
  const progression = selectProgressionOverview(climbs, now)
  const archetype = selectArchetypeOverview(climbs, now)
  const performance = selectPerformanceOverview(climbs, now)
  const sessions = selectSessionsOverview(climbs, now)

  return {
    tiles: {
      progression: progression.tile,
      archetype: archetype.tile,
      performance: performance.tile,
      sessions: sessions.tile,
    },
    visuals: {
      progression: progression.visual,
      archetype: archetype.visual,
      performance: performance.visual,
      sessions: sessions.visual,
    },
  }
}
