import { useEffect, useState } from "react"
import { FiUser } from "react-icons/fi"
import { useAuth } from "../context/AuthContext"
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
    <section className="flex items-center justify-between rounded-[28px] bg-[#f2f2f2] px-5 py-4 shadow-sm">
      <div>
        <p className="text-xs font-medium text-gray-500">Welcome Back</p>
        <p className="text-2xl font-bold text-gray-900">
          {displayName ?? "Climber"}
        </p>
      </div>
      <div
        aria-label="Default user avatar"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm"
      >
        <FiUser className="h-6 w-6" />
      </div>
    </section>
  )
}

export default WelcomeCard
