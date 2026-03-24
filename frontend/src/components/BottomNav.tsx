import { NavLink } from "react-router-dom"
import { FiBarChart2, FiHome, FiSend, FiUser, FiUsers } from "react-icons/fi"

const navItems = [
  { label: "Home", icon: FiHome, to: "/home" },
  { label: "Stats", icon: FiBarChart2, to: "/stats" },
  { label: "Feed", icon: FiSend, to: "/feed" },
  { label: "Social", icon: FiUsers, to: "/social" },
  { label: "Profile", icon: FiUser, to: "/profile" },
]

const BottomNav = () => {
  return (
    <nav className="app-safe-fixed-bottom fixed bottom-0 left-0 right-0 z-30 border-t border-stone-border bg-stone-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-[420px] items-center justify-between px-6 py-3">
        {navItems.map(({ label, icon: Icon, to }) => (
          <NavLink
            key={label}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 text-[11px] font-medium ${
                isActive ? "text-ember" : "text-stone-muted"
              }`
            }
            aria-label={label}
          >
            <Icon className="h-[1.375rem] w-[1.375rem]" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export default BottomNav
