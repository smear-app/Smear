import ProgressionSurface from "../progression/ProgressionSurface"
import type { SessionGradeDistributionItem, SessionOutcomeItem } from "../../domain/sessions/types"
import SessionGradeDistribution from "./SessionGradeDistribution"
import SessionOutcomeBreakdown from "./SessionOutcomeBreakdown"

type SessionDetailBreakdownProps = {
  outcomes: SessionOutcomeItem[]
  gradeDistribution: SessionGradeDistributionItem[]
}

export default function SessionDetailBreakdown({
  outcomes,
  gradeDistribution,
}: SessionDetailBreakdownProps) {
  return (
    <ProgressionSurface>
      <div className="space-y-5">
        <SessionGradeDistribution items={gradeDistribution} />
        <div className="border-t border-stone-border/80 pt-5 dark:border-white/[0.06]">
          <SessionOutcomeBreakdown items={outcomes} />
        </div>
      </div>
    </ProgressionSurface>
  )
}
