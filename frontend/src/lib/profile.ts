import { supabase } from './supabase'

export interface UserProfile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  email: string
  created_at: string | null
}

export interface UpdateProfileData {
  display_name?: string
  username?: string
  avatar_url?: string
}

/**
 * Fetch full user profile data including date of birth
 */
export async function fetchUserProfile(userId: string): Promise<UserProfile> {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user?.email) {
    throw new Error('Unable to fetch user authentication data')
  }

  // Fetch profile with safe column selection (created_at is the join date)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, created_at')
    .eq('id', userId)
    .single()

  if (profileError) {
    console.error('Profile fetch error details:', profileError)
    throw new Error(profileError.message || 'Failed to load profile data')
  }

  if (!profile) {
    throw new Error('Profile not found')
  }

  return {
    ...profile,
    email: user.email,
  }
}

/**
 * Update user profile fields (display_name, username, date_of_birth, avatar_url)
 */
export async function updateProfile(
  userId: string,
  updates: UpdateProfileData,
): Promise<void> {
  // Verify the current user matches the userId to prevent RLS violations
  const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
  if (authError || !currentUser || currentUser.id !== userId) {
    throw new Error('Unauthorized: Cannot update another user\'s profile')
  }

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)

  if (error) throw error
}

/**
 * Re-authenticate user with email and password
 * This is required before changing password for security
 */
export async function reauthenticateUser(
  email: string,
  password: string,
): Promise<boolean> {
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) return false
    return true
  } catch {
    return false
  }
}

/**
 * Change user password with current password verification
 * Note: Supabase requires reauthentication before password change
 * The current password should be verified via reauthenticateUser() first
 */
export async function changePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
}

/**
 * Upload profile image to Supabase storage
 * Returns the public URL of the uploaded image
 */
export async function uploadProfileImage(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}.${fileExt}`
  const filePath = `profile-images/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true })

  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
  return data.publicUrl
}

/**
 * Delete old profile image from storage
 * Accepts either a full public URL or just the file path
 */
export async function deleteProfileImage(urlOrPath: string): Promise<void> {
  if (!urlOrPath) return

  // Extract file path from public URL if needed
  let filePath = urlOrPath
  if (urlOrPath.includes('/storage/v1/object/public/avatars/')) {
    // Extract path from URL: https://xxx.supabase.co/storage/v1/object/public/avatars/profile-images/123.jpg
    const parts = urlOrPath.split('/storage/v1/object/public/avatars/')
    if (parts.length === 2) {
      filePath = parts[1]
    }
  }

  const { error } = await supabase.storage.from('avatars').remove([filePath])
  if (error) console.warn('Failed to delete old profile image:', error)
}
