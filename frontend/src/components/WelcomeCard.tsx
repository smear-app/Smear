import { useEffect, useState } from "react"
import { FiUser } from "react-icons/fi"
import { useAuth } from "../context/AuthContext"
import GymSelector from "./GymSelector"
import { supabase } from "../lib/supabase"

const WelcomeCard = () => {
  const { user } = useAuth()
  const [displayName, setDisplayName] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single()
      .then(({ data }) => setDisplayName(data?.display_name ?? null))
  }, [user])

  return (
    <section className="rounded-[28px] border border-stone-border bg-stone-surface px-5 py-4 shadow-[0_12px_28px_rgba(89,68,51,0.07)]">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-gray-500">Welcome Back</p>
          <p className="truncate text-2xl font-bold text-gray-900">
            {displayName ?? "Climber"}
          </p>
        </div>
        <div
          aria-label="Default user avatar"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ember text-stone-surface shadow-[0_12px_24px_rgba(201,86,26,0.25)]"
        >
          <FiUser className="h-6 w-6" />
        </div>
      </div>

      <div className="mt-3.5">
        <GymSelector />
      </div>
    </section>
  )
}

export default WelcomeCard
