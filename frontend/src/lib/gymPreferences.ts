import { supabase } from './supabase'

export interface GymPreferences {
  bookmarkedGymIds: string[]
  recentGymIds: string[]
}

export async function loadGymPreferences(userId: string): Promise<GymPreferences | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('bookmarked_gym_ids, recent_gym_ids')
    .eq('id', userId)
    .single()

  if (error || !data) return null

  return {
    bookmarkedGymIds: (data.bookmarked_gym_ids as string[]) ?? [],
    recentGymIds: (data.recent_gym_ids as string[]) ?? [],
  }
}

export async function saveGymPreferences(
  userId: string,
  bookmarkedGymIds: string[],
  recentGymIds: string[],
): Promise<void> {
  await supabase
    .from('profiles')
    .update({ bookmarked_gym_ids: bookmarkedGymIds, recent_gym_ids: recentGymIds })
    .eq('id', userId)
}
