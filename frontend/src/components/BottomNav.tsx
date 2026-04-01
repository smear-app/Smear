import { NavLink } from "react-router-dom"
import { FiBarChart2, FiHome, FiPlus, FiUser, FiUsers } from "react-icons/fi"
import { useLogClimbAction } from "../context/LogClimbActionContext"

const navItems = [
  { label: "Home", icon: FiHome, to: "/home" },
  { label: "Stats", icon: FiBarChart2, to: "/stats" },
  { label: "Social", icon: FiUsers, to: "/social" },
  { label: "Profile", icon: FiUser, to: "/profile" },
]

const BottomNav = () => {
  const { onOpen, disabled } = useLogClimbAction()

  return (
    <nav className="app-safe-fixed-bottom fixed bottom-0 left-0 right-0 z-30 border-t border-stone-border bg-stone-surface px-5">
      <div className="mx-auto flex w-full max-w-[380px] items-center justify-between py-3">
        {navItems.slice(0, 2).map(({ label, icon: Icon, to }) => (
          <NavLink
            key={label}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center gap-0.5 text-[13px] font-medium ${
                isActive ? "text-ember" : "text-stone-muted"
              }`
            }
            aria-label={label}
          >
            <Icon className="h-[1.625rem] w-[1.625rem]" />
            <span>{label}</span>
          </NavLink>
        ))}
        <div className="flex flex-1 items-center justify-center">
          <button
            type="button"
            aria-label="Log a climb"
            disabled={disabled}
            onClick={onOpen}
            className={`app-touch-control flex h-12 w-12 items-center justify-center rounded-full text-stone-surface shadow-[0_10px_24px_rgba(171,83,41,0.24)] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember/40 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-surface ${
              disabled
                ? "cursor-not-allowed bg-stone-muted shadow-none"
                : "bg-ember hover:scale-[1.02] hover:bg-ember-dark active:scale-95"
            }`}
          >
            <FiPlus className="h-5 w-5" />
            <span className="sr-only">Log Climb</span>
          </button>
        </div>
        {navItems.slice(2).map(({ label, icon: Icon, to }) => (
          <NavLink
            key={label}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center gap-0.5 text-[13px] font-medium ${
                isActive ? "text-ember" : "text-stone-muted"
              }`
            }
            aria-label={label}
          >
            <Icon className="h-[1.625rem] w-[1.625rem]" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export default BottomNav
