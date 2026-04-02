import { useContext } from "react"
import { LogClimbActionContext } from "../context/logClimbActionContext"

export function useLogClimbAction() {
  const context = useContext(LogClimbActionContext)

  if (!context) {
    throw new Error("useLogClimbAction must be used within a LogClimbActionContext provider")
  }

  return context
}
