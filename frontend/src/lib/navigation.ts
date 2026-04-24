import type { Climb } from "./climbs"
import type { LogbookView } from "./logbookTypes"

export type StackTransition = "forward" | "back"

export type HomeNavigationState = {
  stackTransition?: StackTransition
}

export type LogbookRestoreState = {
  restoreLogbookState?: {
    view: LogbookView
    visibleMonth: string
    selectedDateKey: string | null
  }
  focusSessionId?: string
}

export type SessionsStatsLocationState = {
  selectedSessionIndex?: number
  climbsExpanded?: boolean
}

export type StatsNavigationState = {
  fromStatsOverview?: boolean
}

export type ClimbDetailReturnState =
  | HomeNavigationState
  | LogbookRestoreState
  | SessionsStatsLocationState
  | StatsNavigationState

export type ClimbLocationState = {
  climb?: Climb
  from?: string
  fromState?: ClimbDetailReturnState
  transition?: "card-open" | "card-close"
}
