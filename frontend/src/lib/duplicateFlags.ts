import { apiFetch, getAdminDuplicateFlags, type DuplicateFlagObject, type CanonicalSummary } from './api'

export type { DuplicateFlagObject as DuplicateFlag, CanonicalSummary }

export async function fetchPendingFlags(): Promise<DuplicateFlagObject[]> {
  return getAdminDuplicateFlags()
}

export async function mergeFlag(flagId: string, winnerId: string, loserId: string): Promise<void> {
  const resp = await apiFetch<{ status: string }>(`/duplicate-flags/${flagId}/merge`, {
    method: 'POST',
    body: JSON.stringify({ winner_id: winnerId, loser_id: loserId }),
  })
  void resp
}

export async function dismissFlag(flagId: string): Promise<void> {
  await apiFetch<void>(`/duplicate-flags/${flagId}/dismiss`, { method: 'POST' })
}
