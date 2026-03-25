import { FiSun, FiMoon, FiMonitor } from "react-icons/fi"
import { useTheme } from "../context/ThemeContext"

export default function ThemeToggle() {
  const { theme, cycleTheme } = useTheme()

  const Icon = theme === "light" ? FiSun : theme === "dark" ? FiMoon : FiMonitor
  const label = theme === "light" ? "Light" : theme === "dark" ? "Dark" : "System"

  return (
    <button
      type="button"
      onClick={cycleTheme}
      aria-label={`Theme: ${label}`}
      title={`Theme: ${label}`}
      className="rounded-full p-2 text-stone-muted hover:text-stone-text focus:outline-none focus:ring-2 focus:ring-ember"
    >
      <Icon className="h-5 w-5" />
    </button>
  )
}
