import { FiBarChart2, FiHome, FiSend, FiUser, FiUsers } from "react-icons/fi"

const navItems = [
  { label: "Home", icon: FiHome, active: true },
  { label: "Stats", icon: FiBarChart2, active: false },
  { label: "Feed", icon: FiSend, active: false },
  { label: "Social", icon: FiUsers, active: false },
  { label: "Profile", icon: FiUser, active: false },
]

const BottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-[#f2f2f2]">
      <div className="mx-auto flex max-w-[420px] items-center justify-between px-6 py-3">
        {navItems.map(({ label, icon: Icon, active }) => (
          <button
            key={label}
            type="button"
            className={`flex flex-1 flex-col items-center gap-1 text-[11px] font-medium ${
              active ? "text-gray-900" : "text-gray-400"
            }`}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}

export default BottomNav
