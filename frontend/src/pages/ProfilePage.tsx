import { useEffect, useState } from "react"
import { useAuth } from "../context/AuthContext"
import { fetchReferralCode } from "../lib/auth"
import BottomNav from "../components/BottomNav"

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const [referralCode, setReferralCode] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    fetchReferralCode(user.id).then(setReferralCode).catch(console.error)
  }, [user])

  return (
    <div className="min-h-screen bg-stone-bg">
      <main className="mx-auto flex min-h-screen max-w-[420px] flex-col px-5 pb-32 pt-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-muted">Profile</p>
        <h1 className="mt-1 text-2xl font-bold text-stone-text">Your account</h1>

        <div className="mt-6 rounded-[28px] border border-stone-border bg-stone-surface px-5 py-6 shadow-[0_14px_34px_rgba(89,68,51,0.08)]">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ember-soft text-2xl font-bold text-ember">
              {user?.email?.[0].toUpperCase() ?? "?"}
            </div>
            <div>
              <p className="font-semibold text-stone-text">{user?.email}</p>
              {referralCode && (
                <p className="mt-0.5 text-xs text-stone-secondary">
                  Referral code: <span className="font-semibold text-stone-text">{referralCode}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          className="mt-6 w-full rounded-[28px] border border-stone-border bg-stone-surface px-5 py-4 text-left text-sm font-semibold text-ember shadow-[0_14px_34px_rgba(89,68,51,0.08)]"
        >
          Log out
        </button>
      </main>
      <BottomNav />
    </div>
  )
}
