import { supabase } from './supabase'
import { uploadToCloudinary } from './cloudinary'
import { getMe, patchMe } from './api'

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

export async function fetchUserProfile(userId: string): Promise<UserProfile> {
  void userId
  const me = await getMe()
  return {
    id: me.id,
    username: me.username ?? '',
    display_name: me.display_name,
    avatar_url: me.avatar_url,
    email: me.email,
    created_at: me.created_at,
  }
}

export async function updateProfile(
  _userId: string,
  updates: UpdateProfileData,
): Promise<void> {
  await patchMe(updates)
}

/**
 * Re-authenticate user with email and password.
 * This is required before changing password for security.
 */
export async function reauthenticateUser(
  email: string,
  password: string,
): Promise<boolean> {
  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return false
    return true
  } catch {
    return false
  }
}

/**
 * Change user password. Requires reauthenticateUser() to have been called first.
 * Note: Supabase requires reauthentication before password change.
 */
export async function changePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
}

/**
 * Upload profile image to Cloudinary.
 * Returns the secure URL of the uploaded image.
 */
export async function uploadProfileImage(file: File): Promise<string> {
  return uploadToCloudinary(file, 'smear/avatars')
}
