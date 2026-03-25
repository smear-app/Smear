import { createContext, useContext, useEffect, useState } from "react"
import type { ReactNode } from "react"

export type Theme = "light" | "dark" | "system"

type ThemeContextType = {
  theme: Theme
  setTheme: (t: Theme) => void
  cycleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const STORAGE_KEY = "smear:theme"

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "system"
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Theme | null
      if (saved === "light" || saved === "dark" || saved === "system") {
        return saved
      }
    } catch {
      /* ignore */
    }
    return "system"
  })

  useEffect(() => {
    const apply = (t: Theme) => {
      const m = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)")
      const isDark = t === "dark" || (t === "system" && m && m.matches)
      if (isDark) {
        document.documentElement.classList.add("dark")
        document.documentElement.style.colorScheme = "dark"
      } else {
        document.documentElement.classList.remove("dark")
        document.documentElement.style.colorScheme = "light"
      }
    }

    apply(theme)

    const media = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)")
    const handler = () => {
      if (theme === "system") {
        apply("system")
      }
    }

    if (media) {
      media.addEventListener("change", handler)
    }

    return () => {
      if (media) {
        media.removeEventListener("change", handler)
      }
    }
  }, [theme])

  const setTheme = (t: Theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, t)
    } catch {
      /* ignore */
    }
    setThemeState(t)
  }

  const cycleTheme = () => {
    setThemeState((prev) => {
      const next = prev === "light" ? "dark" : prev === "dark" ? "system" : "light"
      try {
        localStorage.setItem(STORAGE_KEY, next)
      } catch {
        /* ignore */
      }
      return next
    })
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider")
  return ctx
}
