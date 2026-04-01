import { createContext, useContext, type ReactNode } from "react"

type LogClimbActionContextValue = {
  onOpen: () => void
  disabled: boolean
}

const LogClimbActionContext = createContext<LogClimbActionContextValue | null>(null)

type LogClimbActionProviderProps = {
  value: LogClimbActionContextValue
  children: ReactNode
}

export function LogClimbActionProvider({ value, children }: LogClimbActionProviderProps) {
  return <LogClimbActionContext.Provider value={value}>{children}</LogClimbActionContext.Provider>
}

export function useLogClimbAction() {
  const context = useContext(LogClimbActionContext)

  if (!context) {
    throw new Error("useLogClimbAction must be used within a LogClimbActionProvider")
  }

  return context
}
