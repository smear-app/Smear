import { useEffect, useState } from "react"
import { useAuth } from "../context/AuthContext"
import { fetchReferralCode } from "../lib/auth"

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const [referralCode, setReferralCode] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    fetchReferralCode(user.id).then(setReferralCode).catch(console.error)
  }, [user])

  return (
    <div className="min-h-screen bg-[#f5f5f2]">
      <main className="mx-auto flex min-h-screen max-w-[420px] flex-col px-5 pb-32 pt-6">
        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>

        <div className="mt-6 rounded-[28px] bg-white px-5 py-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl font-bold text-slate-400">
              {user?.email?.[0].toUpperCase() ?? "?"}
            </div>
            <div>
              <p className="font-semibold text-slate-900">{user?.email}</p>
              {referralCode && (
                <p className="mt-0.5 text-xs text-slate-500">
                  Referral code: <span className="font-semibold text-slate-700">{referralCode}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          className="mt-6 w-full rounded-[28px] bg-white px-5 py-4 text-left text-sm font-semibold text-red-500 shadow-[0_10px_30px_rgba(15,23,42,0.06)]"
        >
          Log out
        </button>
      </main>
    </div>
  )
}
