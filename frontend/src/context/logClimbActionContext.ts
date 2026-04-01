import { createContext } from "react"

export type LogClimbActionContextValue = {
  onOpen: () => void
  disabled: boolean
}

export const LogClimbActionContext = createContext<LogClimbActionContextValue | null>(null)
