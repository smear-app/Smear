import type { StatsPreviewTrendPoint } from "../types"
import type { ProgressionChartPoint, ProgressionViewModel } from "./types"

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum)
}

const MIN_TREND_HEIGHT_PERCENT = 34
const MAX_TREND_HEIGHT_PERCENT = 100

export function selectRecentProgressionPoints(points: ProgressionChartPoint[], count = 3) {
  return points.slice(Math.max(0, points.length - count))
}

export function selectProgressionPreviewPoints(
  progression: Pick<ProgressionViewModel, "chartPoints">,
  count = 3,
): StatsPreviewTrendPoint[] {
  const recentPoints = selectRecentProgressionPoints(progression.chartPoints, count)
  const gradeValues = recentPoints.map((point) => point.avgGrade)

  if (gradeValues.length === 0) {
    return []
  }

  const minGrade = Math.min(...gradeValues)
  const maxGrade = Math.max(...gradeValues)

  if (maxGrade <= 0) {
    return recentPoints.map((point) => ({
      id: point.label,
      heightPercent: 0,
    }))
  }

  if (maxGrade === minGrade) {
    return recentPoints.map((point) => ({
      id: point.label,
      heightPercent: MAX_TREND_HEIGHT_PERCENT,
    }))
  }

  return recentPoints.map((point) => ({
    id: point.label,
    heightPercent: clamp(
      MIN_TREND_HEIGHT_PERCENT +
        ((point.avgGrade - minGrade) / (maxGrade - minGrade)) *
          (MAX_TREND_HEIGHT_PERCENT - MIN_TREND_HEIGHT_PERCENT),
      MIN_TREND_HEIGHT_PERCENT,
      MAX_TREND_HEIGHT_PERCENT,
    ),
  }))
}
