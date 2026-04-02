import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { fetchReferralCode } from "../lib/auth"
import { fetchUserProfile } from "../lib/profile"
import type { UserProfile } from "../lib/profile"
import BottomNav from "../components/BottomNav"
import ThemeToggle from "../components/ThemeToggle"
import ProfileModal from "../components/ProfileModal"

export default function ProfilePage() {
  const { user, logout, isAdmin } = useAuth()
  const [referralCode, setReferralCode] = useState<string | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)

  useEffect(() => {
    if (!user) return
    fetchReferralCode(user.id).then(setReferralCode).catch(console.error)
    fetchUserProfile(user.id).then(setProfile).catch(console.error)
  }, [user])

  return (
    <div className="app-safe-shell min-h-screen bg-stone-bg">
      <main className="app-safe-shell__main mx-auto flex min-h-screen max-w-[420px] flex-col px-5 pb-32 pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-muted">Profile</p>
            <h1 className="mt-1 text-2xl font-bold text-stone-text">Your account</h1>
          </div>
          <div className="ml-2">
            <ThemeToggle />
          </div>
        </div>

        <div className="mt-6 rounded-[28px] border border-stone-border bg-stone-surface px-5 py-6 shadow-[0_14px_34px_rgba(89,68,51,0.08)] transition-colors hover:bg-stone-alt">
          <button
            type="button"
            onClick={() => setIsProfileModalOpen(true)}
            className="w-full text-left"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Profile"
                    className="h-14 w-14 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ember-soft text-2xl font-bold text-ember">
                    {user?.email?.[0].toUpperCase() ?? "?"}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-stone-text">{user?.email}</p>
                  {referralCode && (
                    <p className="mt-0.5 text-xs text-stone-secondary">
                      Referral code: <span className="font-semibold text-stone-text">{referralCode}</span>
                    </p>
                  )}
                </div>
              </div>
              <div className="text-stone-secondary">
                &gt;
              </div>
            </div>
          </button>
        </div>

        {isAdmin && (
          <Link
            to="/admin/duplicates"
            className="mt-4 block w-full rounded-[28px] border border-stone-border bg-stone-surface px-5 py-4 text-left text-sm font-semibold text-stone-muted shadow-[0_14px_34px_rgba(89,68,51,0.08)]"
          >
            Review Duplicate Flags
          </Link>
        )}

        <button
          type="button"
          onClick={logout}
          className="mt-4 w-full rounded-[28px] border border-stone-border bg-stone-surface px-5 py-4 text-left text-sm font-semibold text-ember shadow-[0_14px_34px_rgba(89,68,51,0.08)]"
        >
          Log out
        </button>

        <ProfileModal 
          isOpen={isProfileModalOpen} 
          onClose={() => setIsProfileModalOpen(false)}
          onSave={() => {
            setIsProfileModalOpen(false)
            if (user?.id) {
              fetchReferralCode(user.id).then(setReferralCode).catch(console.error)
              fetchUserProfile(user.id).then(setProfile).catch(console.error)
            }
          }}
        />
      </main>
      <BottomNav />
    </div>
  )
}
