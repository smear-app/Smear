import { useEffect, useState, useRef, useCallback } from 'react'
import type { ChangeEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  fetchUserProfile,
  updateProfile,
  changePassword,
  reauthenticateUser,
  uploadProfileImage,
  deleteProfileImage,
  type UserProfile,
} from '../lib/profile'
// @ts-expect-error - BottomSheet is JSX without type definitions
import BottomSheet from './BottomSheet'

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
  onSave?: () => void
}

interface DraftData {
  display_name: string
  username: string
  email: string
  avatar_url: string
  photoFile?: File
}

interface PasswordData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export default function ProfileModal({ isOpen, onClose, onSave }: ProfileModalProps) {
  const { user } = useAuth()
  const [isVisible, setIsVisible] = useState(false)
  const [isRendered, setIsRendered] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [draft, setDraft] = useState<DraftData>({
    display_name: '',
    username: '',
    email: '',
    avatar_url: '',
  })
  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initialize modal state with animation
  useEffect(() => {
    if (isOpen) {
      setIsRendered(true)
      setIsVisible(false)
      setIsEditMode(false)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsVisible(true))
      })
      loadProfile()
    } else {
      setIsVisible(false)
      setTimeout(() => setIsRendered(false), 280)
    }
  }, [isOpen, loadProfile])

  // Load user profile data
  const loadProfile = useCallback(async () => {
    if (!user?.id) return
    try {
      setLoading(true)
      setError(null)
      const profileData = await fetchUserProfile(user.id)
      setProfile(profileData)
      setDraft({
        display_name: profileData.display_name || '',
        username: profileData.username || '',
        email: profileData.email || '',
        avatar_url: profileData.avatar_url || '',
      })
      if (profileData.avatar_url) {
        setProfileImagePreview(profileData.avatar_url)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      setError('Failed to load profile: ' + errorMsg)
      console.error('Failed to load profile:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  const handleDraftChange = (field: string, value: string) => {
    setDraft((prev) => ({ ...prev, [field]: value }))
    setError(null)
  }

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }))
    setError(null)
  }

  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB')
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('File must be an image')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result
      if (typeof result === 'string') {
        setProfileImagePreview(result)
        setDraft((prev) => ({ ...prev, photoFile: file }))
      }
    }
    reader.readAsDataURL(file)
  }

  const validateForm = () => {
    if (!draft.display_name.trim()) {
      setError('Display name is required')
      return false
    }
    if (draft.display_name.trim().length < 2) {
      setError('Display name must be at least 2 characters')
      return false
    }
    if (draft.display_name.trim().length > 100) {
      setError('Display name must be less than 100 characters')
      return false
    }

    if (!draft.username.trim()) {
      setError('Username is required')
      return false
    }
    if (draft.username.trim().length < 3) {
      setError('Username must be at least 3 characters')
      return false
    }
    if (draft.username.trim().length > 50) {
      setError('Username must be less than 50 characters')
      return false
    }
    // Username format validation (alphanumeric and underscores only)
    if (!/^[a-zA-Z0-9_]+$/.test(draft.username.trim())) {
      setError('Username can only contain letters, numbers, and underscores')
      return false
    }

    if (!draft.email.trim()) {
      setError('Email is required')
      return false
    }
    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) {
      setError('Please enter a valid email address')
      return false
    }

    // Validate password change if attempting
    if (passwordData.newPassword || passwordData.currentPassword || passwordData.confirmPassword) {
      if (!passwordData.currentPassword) {
        setError('Current password is required to change password')
        return false
      }
      if (!passwordData.newPassword) {
        setError('New password is required')
        return false
      }
      if (passwordData.newPassword.length < 8) {
        setError('New password must be at least 8 characters')
        return false
      }
      if (passwordData.newPassword.length > 128) {
        setError('New password must be less than 128 characters')
        return false
      }
      if (passwordData.currentPassword === passwordData.newPassword) {
        setError('New password must be different from current password')
        return false
      }
      if (!passwordData.confirmPassword) {
        setError('Please confirm new password')
        return false
      }
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setError('Passwords do not match')
        return false
      }
    }

    return true
  }

  const handleSave = async () => {
    if (!validateForm() || !user?.id || !profile) return

    try {
      setLoading(true)
      setError(null)

      let avatarUrl = draft.avatar_url

      // Upload new image if selected
      if (draft.photoFile) {
        avatarUrl = await uploadProfileImage(draft.photoFile)
        // Delete old avatar if it exists
        if (profile.avatar_url) {
          await deleteProfileImage(profile.avatar_url)
        }
      }

      // Update profile
      await updateProfile(user.id, {
        display_name: draft.display_name,
        username: draft.username,
        avatar_url: avatarUrl,
      })

      // Change password if provided
      if (passwordData.newPassword) {
        // Verify current password before changing
        const isAuthenticated = await reauthenticateUser(
          profile.email,
          passwordData.currentPassword,
        )
        if (!isAuthenticated) {
          setError('Current password is incorrect')
          setLoading(false)
          return
        }
        await changePassword(passwordData.newPassword)
      }

      setIsEditMode(false)
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      if (onSave) onSave()
      setTimeout(() => {
        loadProfile()
      }, 500)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      if (errorMsg.includes('password')) {
        setError('Password change failed: ' + errorMsg)
      } else if (errorMsg.includes('username')) {
        setError('Username is already taken')
      } else {
        setError('Failed to save profile: ' + errorMsg)
      }
      console.error('Failed to save profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setIsEditMode(false)
    loadProfile()
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    setProfileImagePreview(profile?.avatar_url || null)
  }

  if (!isRendered) return null

  const initials = profile?.display_name
    ? profile.display_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?'

  return (
    <BottomSheet isVisible={isVisible} onClose={onClose}>
      <div className="flex max-h-[90vh] flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-border px-5 py-4">
          <h2 className="text-lg font-bold text-stone-text">Profile</h2>
          {!isEditMode && (
            <button
              onClick={() => setIsEditMode(true)}
              className="rounded-full px-4 py-2 text-sm font-semibold text-ember hover:bg-stone-surface"
            >
              Edit
            </button>
          )}
          {isEditMode && (
            <button
              onClick={handleCancel}
              className="text-stone-secondary hover:text-stone-text"
            >
              ✕
            </button>
          )}
        </div>

        {/* Content - scrollable */}
        <div className="flex-1 overflow-y-auto">
          {error && (
            <div className="m-4 rounded-lg border border-ember bg-ember/10 p-3 text-sm text-ember">
              {error}
            </div>
          )}

          {loading && !isEditMode && (
            <div className="space-y-4 p-5">
              <div className="flex justify-center py-8">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-stone-border border-t-ember" />
              </div>
            </div>
          )}

          {!loading && !isEditMode && profile && (
            <div className="space-y-6 p-5">
              {/* Profile Image */}
              <div className="flex justify-center">
                {profileImagePreview ? (
                  <img
                    src={profileImagePreview}
                    alt={profile.display_name || 'Profile'}
                    className="h-24 w-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-ember-soft text-4xl font-bold text-ember">
                    {initials}
                  </div>
                )}
              </div>

              {/* Display Name */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-muted">
                  Display Name
                </p>
                <p className="mt-1 text-lg text-stone-text">{profile.display_name || '—'}</p>
              </div>

              {/* Username */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-muted">
                  Username
                </p>
                <p className="mt-1 text-lg text-stone-text">@{profile.username || '—'}</p>
              </div>

              {/* Email */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-muted">
                  Email
                </p>
                <p className="mt-1 text-lg text-stone-text">{profile.email || '—'}</p>
              </div>

              {/* Join Date */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-muted">
                  Joined
                </p>
                <p className="mt-1 text-lg text-stone-text">
                  {profile.created_at
                    ? new Date(profile.created_at).toLocaleDateString()
                    : '—'}
                </p>
              </div>

              {/* Password */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-muted">
                  Password
                </p>
                <p className="mt-1 text-lg text-stone-text">••••••••</p>
              </div>
            </div>
          )}

          {!loading && !isEditMode && !profile && (
            <div className="flex justify-center p-5 text-center">
              <p className="text-stone-muted">Unable to load profile data</p>
            </div>
          )}

          {/* Edit Mode Form */}
          {isEditMode && (
            <div className="space-y-5 p-5">
              {/* Profile Image */}
              <div className="flex justify-center">
                <div className="relative">
                  {profileImagePreview ? (
                    <img
                      src={profileImagePreview}
                      alt={draft.display_name}
                      className="h-24 w-24 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-ember-soft text-4xl font-bold text-ember">
                      {initials}
                    </div>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-ember text-xs text-stone-surface shadow-md"
                  >
                    📷
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Display Name */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-muted">
                  Display Name
                </label>
                <input
                  type="text"
                  value={draft.display_name}
                  onChange={(e) => handleDraftChange('display_name', e.target.value)}
                  className="mt-1 w-full rounded-[18px] border border-stone-border bg-stone-surface px-4 py-3 text-stone-text placeholder-stone-muted focus:outline-none focus:ring-2 focus:ring-ember"
                  placeholder="Your name"
                />
              </div>

              {/* Username */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-muted">
                  Username
                </label>
                <input
                  type="text"
                  value={draft.username}
                  onChange={(e) => handleDraftChange('username', e.target.value)}
                  className="mt-1 w-full rounded-[18px] border border-stone-border bg-stone-surface px-4 py-3 text-stone-text placeholder-stone-muted focus:outline-none focus:ring-2 focus:ring-ember"
                  placeholder="@username"
                />
              </div>

              {/* Email */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-muted">
                  Email
                </label>
                <input
                  type="email"
                  value={draft.email}
                  onChange={(e) => handleDraftChange('email', e.target.value)}
                  className="mt-1 w-full rounded-[18px] border border-stone-border bg-stone-surface px-4 py-3 text-stone-text placeholder-stone-muted focus:outline-none focus:ring-2 focus:ring-ember"
                  placeholder="you@example.com"
                />
              </div>

              {/* Join Date (Read-only) */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-muted">
                  Joined
                </label>
                <input
                  type="text"
                  value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '—'}
                  disabled
                  className="mt-1 w-full rounded-[18px] border border-stone-border bg-stone-alt px-4 py-3 text-stone-muted cursor-not-allowed opacity-75"
                />
              </div>

              {/* Password Section */}
              <div className="space-y-4 border-t border-stone-border pt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-muted">
                  Change Password (Optional)
                </p>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-muted">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                    className="mt-1 w-full rounded-[18px] border border-stone-border bg-stone-surface px-4 py-3 text-stone-text placeholder-stone-muted focus:outline-none focus:ring-2 focus:ring-ember"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-muted">
                    New Password
                  </label>
                  <div className="relative mt-1">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                      className="w-full rounded-[18px] border border-stone-border bg-stone-surface px-4 py-3 pr-12 text-stone-text placeholder-stone-muted focus:outline-none focus:ring-2 focus:ring-ember"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-secondary hover:text-stone-text transition-colors"
                      title={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-muted">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                    className="mt-1 w-full rounded-[18px] border border-stone-border bg-stone-surface px-4 py-3 text-stone-text placeholder-stone-muted focus:outline-none focus:ring-2 focus:ring-ember"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Action Buttons */}
        {isEditMode && (
          <div className="flex gap-3 border-t border-stone-border px-5 py-4">
            <button
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 rounded-full border border-stone-border px-6 py-3 text-sm font-semibold text-stone-text hover:bg-stone-alt disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 rounded-full bg-ember px-6 py-3 text-sm font-semibold text-stone-surface transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>
    </BottomSheet>
  )
}
