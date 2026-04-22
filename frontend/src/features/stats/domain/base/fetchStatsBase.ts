import { getClimbs, type ClimbObject, type ClimbsMetaResponse } from "../../../../lib/api"

const STATS_BASE_PAGE_SIZE = 100

export type RawStatsClimb = ClimbObject

export type StatsBaseData = {
  climbs: RawStatsClimb[]
  gyms?: ClimbsMetaResponse["gyms"]
}

export type FetchStatsBaseOptions = {
  pageSize?: number
}

function toPageSize(value: number | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return STATS_BASE_PAGE_SIZE
  }

  return Math.min(Math.max(Math.floor(value), 1), STATS_BASE_PAGE_SIZE)
}

function getLoggedGyms(climbs: readonly RawStatsClimb[]): ClimbsMetaResponse["gyms"] {
  const gymsById = new Map<string, ClimbsMetaResponse["gyms"][number]>()

  for (const climb of climbs) {
    if (climb.gym_id && climb.gym_name) {
      gymsById.set(climb.gym_id, { id: climb.gym_id, name: climb.gym_name })
    }
  }

  return [...gymsById.values()]
}

export async function fetchStatsBase(userId: string, options: FetchStatsBaseOptions = {}): Promise<StatsBaseData> {
  void userId

  const pageSize = toPageSize(options.pageSize)
  const firstPage = await getClimbs({
    limit: pageSize,
    offset: 0,
    sort: "oldest",
  })
  const climbs = [...firstPage.climbs]

  for (let offset = climbs.length; offset < firstPage.total_count; offset += pageSize) {
    const page = await getClimbs({
      limit: pageSize,
      offset,
      sort: "oldest",
    })

    climbs.push(...page.climbs)
  }

  return {
    climbs,
    gyms: getLoggedGyms(climbs),
  }
}
