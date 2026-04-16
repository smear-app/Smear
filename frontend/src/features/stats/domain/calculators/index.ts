export type StatsCalculationContext = {
  userId: string
}

export type StatsCalculator<TOutput> = (context: StatsCalculationContext) => Promise<TOutput> | TOutput
