import { filterSentClimbs, getGradeIndexes, type EnrichedClimb } from "../primitives"
import {
  calculateArchetypeMetrics,
  type ArchetypeGroupKey,
  type ArchetypeMetrics,
} from "../calculators/archetype"
import type { StatsPipelineValidationIssue } from "./validateStatsPipeline"

const ARCHETYPE_GROUPS: ArchetypeGroupKey[] = ["holdType", "movement", "terrain", "mechanics"]

export type ArchetypeMetricsValidationResult = {
  ok: boolean
  summary: {
    inputClimbs: number
    groupCount: number
    metricCount: number
    attributedClimbContributions: number
  }
  issues: StatsPipelineValidationIssue[]
  metrics: ArchetypeMetrics
}

function findSourceClimbsForTag(climbs: readonly EnrichedClimb[], tagKey: string): EnrichedClimb[] {
  return climbs.filter((climb) => climb.tags.some((tag) => tag.id === tagKey))
}

export function validateArchetypeMetrics(climbs: readonly EnrichedClimb[]): ArchetypeMetricsValidationResult {
  const metrics = calculateArchetypeMetrics(climbs)
  const issues: StatsPipelineValidationIssue[] = []
  let metricCount = 0
  let attributedClimbContributions = 0

  for (const group of ARCHETYPE_GROUPS) {
    const groupMetrics = metrics[group]
    const groupContributionCount = groupMetrics.reduce((sum, metric) => sum + metric.climbCount, 0)
    const groupShareTotal = groupMetrics.reduce((sum, metric) => sum + metric.climbShare, 0)
    metricCount += groupMetrics.length
    attributedClimbContributions += groupContributionCount

    if (!Array.isArray(groupMetrics)) {
      issues.push({
        code: "archetype-missing-group",
        message: "Archetype metrics are missing a required group array.",
        details: { group },
      })
      continue
    }

    if (groupContributionCount > 0 && Math.abs(groupShareTotal - 1) > 0.000001) {
      issues.push({
        code: "archetype-share-total-mismatch",
        message: "Archetype group climb shares do not sum to 1 for attributed climbs.",
        details: { group, groupShareTotal },
      })
    }

    for (const metric of groupMetrics) {
      if (metric.group !== group) {
        issues.push({
          code: "archetype-group-mismatch",
          message: "Archetype metric is stored under a different group than its group field.",
          details: { metricGroup: metric.group, expectedGroup: group, tagKey: metric.tagKey },
        })
      }

      if (metric.climbCount < 0 || metric.sentCount < 0) {
        issues.push({
          code: "archetype-negative-count",
          message: "Archetype metric has a negative count.",
          details: { tagKey: metric.tagKey, climbCount: metric.climbCount, sentCount: metric.sentCount },
        })
      }

      if (metric.sentCount > metric.climbCount) {
        issues.push({
          code: "archetype-sent-exceeds-volume",
          message: "Archetype sent count exceeds climb count.",
          details: { tagKey: metric.tagKey, climbCount: metric.climbCount, sentCount: metric.sentCount },
        })
      }

      if (metric.climbShare < 0 || metric.climbShare > 1 || !Number.isFinite(metric.climbShare)) {
        issues.push({
          code: "archetype-invalid-share",
          message: "Archetype climb share is outside the expected range.",
          details: { tagKey: metric.tagKey, climbShare: metric.climbShare },
        })
      }

      const sourceClimbs = findSourceClimbsForTag(climbs, metric.tagKey)
      const sentSourceClimbs = filterSentClimbs(sourceClimbs)
      const sentGradeCount = getGradeIndexes(sentSourceClimbs).length

      if (metric.climbCount !== sourceClimbs.length) {
        issues.push({
          code: "archetype-source-count-mismatch",
          message: "Archetype climb count does not match source attribution climbs.",
          details: { tagKey: metric.tagKey, climbCount: metric.climbCount, sourceClimbs: sourceClimbs.length },
        })
      }

      if (metric.sentCount !== sentSourceClimbs.length) {
        issues.push({
          code: "archetype-source-sent-count-mismatch",
          message: "Archetype sent count does not match source attribution sent climbs.",
          details: { tagKey: metric.tagKey, sentCount: metric.sentCount, sourceSentClimbs: sentSourceClimbs.length },
        })
      }

      if (sentGradeCount === 0 && (metric.averageSentGrade !== null || metric.medianSentGrade !== null || metric.workingGrade !== null)) {
        issues.push({
          code: "archetype-attempt-grade-leak",
          message: "Archetype grade metrics are non-null despite no sent climbs with valid grades.",
          details: { tagKey: metric.tagKey },
        })
      }
    }
  }

  return {
    ok: issues.length === 0,
    summary: {
      inputClimbs: climbs.length,
      groupCount: ARCHETYPE_GROUPS.length,
      metricCount,
      attributedClimbContributions,
    },
    issues,
    metrics,
  }
}
