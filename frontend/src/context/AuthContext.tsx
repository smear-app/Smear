import { createContext, useContext, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { signOut } from '../lib/auth'

interface AuthContextValue {
  session: Session | null
  user: User | null
  displayName: string | null
  loading: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [displayName, setDisplayName] = useState<string | null>(null)

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
        if (!cancelled) setDisplayName(null)
      })
      return () => { cancelled = true }
    }

    supabase
      .from('profiles')
      .select('display_name')
      .eq('id', userId)
      .single()
      .then(
        ({ data }) => { if (!cancelled) setDisplayName(data?.display_name ?? null) },
        () => { if (!cancelled) setDisplayName(null) },
      )

    return () => { cancelled = true }
  }, [session?.user?.id])

  async function logout() {
    await signOut()
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, displayName, loading, logout }}>
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
