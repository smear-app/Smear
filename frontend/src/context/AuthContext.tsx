import { createContext, useContext, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { signOut } from '../lib/auth'
import { clearMeCache, getMe } from '../lib/api'

interface AuthContextValue {
  session: Session | null
  user: User | null
  displayName: string | null
  isAdmin: boolean
  loading: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    let cancelled = false

    const userId = session?.user?.id ?? null
    if (!userId) {
      queueMicrotask(() => {
        if (!cancelled) {
          setDisplayName(null)
          setIsAdmin(false)
        }
      })
      return () => { cancelled = true }
    }

    getMe().then(
      (me) => {
        if (!cancelled) {
          setDisplayName(me.display_name ?? null)
          setIsAdmin(me.is_admin ?? false)
        }
      },
      () => {
        if (!cancelled) {
          setDisplayName(null)
          setIsAdmin(false)
        }
      },
    )

    return () => { cancelled = true }
  }, [session?.user?.id])

  async function logout() {
    clearMeCache()
    await signOut()
    setSession(null)
    setIsAdmin(false)
  }

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, displayName, isAdmin, loading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
