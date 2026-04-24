import { NavLink } from "react-router-dom"
import { FiBarChart2, FiHome, FiPlus, FiUsers } from "react-icons/fi"
import { useLogClimbAction } from "../hooks/useLogClimbAction"

const navItems = [
  { label: "Home", icon: FiHome, to: "/home" },
  { label: "Stats", icon: FiBarChart2, to: "/stats" },
  { label: "Social", icon: FiUsers, to: "/social" },
]

const tabClassName = ({ isActive }: { isActive: boolean }) =>
  `flex flex-1 flex-col items-center justify-center gap-0.5 text-[13px] font-medium ${
    isActive ? "text-ember" : "text-stone-muted"
  }`

function BottomNavItem({ label, icon: Icon, to }: { label: string; icon: typeof FiHome; to: string }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={tabClassName}
      aria-label={label}
    >
      <Icon className="h-[1.625rem] w-[1.625rem]" />
      <span>{label}</span>
    </NavLink>
  )
}

const BottomNav = () => {
  const { onOpen, disabled } = useLogClimbAction()

  return (
    <nav className="app-safe-fixed-bottom fixed bottom-0 left-0 right-0 z-30 border-t border-stone-border bg-stone-surface px-5">
      <div className="mx-auto grid w-full max-w-[380px] grid-cols-[1fr_1fr_auto_1fr] items-end gap-1 py-3">
        {navItems.slice(0, 2).map(({ label, icon: Icon, to }) => (
          <BottomNavItem key={label} label={label} icon={Icon} to={to} />
        ))}
        <div className="flex justify-center self-stretch px-2">
          <div className="flex min-h-[3.25rem] items-start justify-center pt-0.5">
            <button
              type="button"
              aria-label="Log a climb"
              disabled={disabled}
              onClick={onOpen}
              className={`app-touch-control flex h-12 w-12 -translate-y-1 items-center justify-center rounded-full text-stone-surface shadow-[0_10px_24px_rgba(171,83,41,0.24)] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember/40 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-surface ${
                disabled
                  ? "cursor-not-allowed bg-stone-muted shadow-none"
                  : "bg-ember hover:scale-[1.02] hover:bg-ember-dark active:scale-95"
              }`}
            >
              <FiPlus className="h-5 w-5" />
              <span className="sr-only">Log Climb</span>
            </button>
          </div>
        </div>
        {navItems.slice(2, 3).map(({ label, icon: Icon, to }) => (
          <BottomNavItem key={label} label={label} icon={Icon} to={to} />
        ))}
      </div>
    </nav>
  )
}

export default BottomNav
