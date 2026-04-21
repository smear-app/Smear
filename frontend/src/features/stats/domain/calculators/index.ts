export type StatsCalculationContext = {
  userId: string
}

export type StatsCalculator<TOutput> = (context: StatsCalculationContext) => Promise<TOutput> | TOutput

export * from "./performance"
export * from "./progression"
export * from "./sessions"
export * from "./archetype"
