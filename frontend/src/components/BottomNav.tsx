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
    <nav className="app-safe-fixed-bottom fixed bottom-0 left-0 right-0 z-30 border-t border-stone-border bg-stone-surface px-5">
      <div className="mx-auto flex w-full max-w-[380px] items-center justify-between py-3">
        {navItems.map(({ label, icon: Icon, to }) => (
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
