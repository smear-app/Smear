import { FiUser } from "react-icons/fi"
import { useAuth } from "../context/AuthContext"
import GymSelector from "./GymSelector"

const WelcomeCard = () => {
  const { displayName } = useAuth()

  return (
    <section className="rounded-[28px] border border-stone-border bg-stone-surface px-5 py-4 shadow-[0_12px_28px_rgba(89,68,51,0.07)]">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-stone-secondary">Welcome Back</p>
          <p className="truncate text-2xl font-bold text-stone-text">
            {displayName ?? "Climber"}
          </p>
        </div>
        <div
          aria-label="Default user avatar"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ember text-stone-surface"
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
