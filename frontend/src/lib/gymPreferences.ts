import { getMe, patchGymPreferences } from './api'

export interface GymPreferences {
  bookmarkedGymIds: string[]
  recentGymIds: string[]
}

export async function loadGymPreferences(userId: string): Promise<GymPreferences | null> {
  void userId
  try {
    const me = await getMe()
    return {
      bookmarkedGymIds: me.bookmarked_gym_ids ?? [],
      recentGymIds: me.recent_gym_ids ?? [],
    }
  } catch {
    return null
  }
}

export async function saveGymPreferences(
  userId: string,
  bookmarkedGymIds: string[],
  recentGymIds: string[],
): Promise<void> {
  void userId
  await patchGymPreferences({ bookmarked_gym_ids: bookmarkedGymIds, recent_gym_ids: recentGymIds })
}
