import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { signIn, signUp } from '../lib/auth'

type Tab = 'login' | 'register'

export default function AuthPage() {
  const navigate = useNavigate()
  const { session } = useAuth()

  useEffect(() => {
    if (session) navigate('/home', { replace: true })
  }, [session, navigate])
  const [tab, setTab] = useState<Tab>('login')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Login fields
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Register fields
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regUsername, setRegUsername] = useState('')
  const [regDisplayName, setRegDisplayName] = useState('')
  const [regReferral, setRegReferral] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signIn(loginEmail, loginPassword)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signUp(regEmail, regPassword, regUsername, regDisplayName, regReferral || undefined)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-safe-shell flex min-h-screen items-center justify-center bg-stone-bg px-5">
      <div className="w-full max-w-[420px]">
        <h1 className="mb-8 text-center text-3xl font-bold text-stone-text">Smear</h1>

        {/* Tabs */}
        <div className="mb-6 flex rounded-2xl border border-stone-border bg-stone-surface p-1 shadow-[0_10px_24px_rgba(89,68,51,0.08)]">
          <button
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-colors ${
              tab === 'login'
                ? 'bg-ember text-stone-surface'
                : 'text-stone-secondary hover:text-stone-text'
            }`}
            onClick={() => { setTab('login'); setError(null) }}
          >
            Log in
          </button>
          <button
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-colors ${
              tab === 'register'
                ? 'bg-ember text-stone-surface'
                : 'text-stone-secondary hover:text-stone-text'
            }`}
            onClick={() => { setTab('register'); setError(null) }}
          >
            Register
          </button>
        </div>

        <div className="rounded-2xl border border-stone-border bg-stone-surface p-6 shadow-[0_14px_34px_rgba(89,68,51,0.08)]">
          {error && (
            <p className="mb-4 rounded-xl border border-ember/10 bg-ember-soft px-4 py-3 text-sm text-ember">{error}</p>
          )}

          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <Field label="Email" type="email" value={loginEmail} onChange={setLoginEmail} required />
              <Field label="Password" type="password" value={loginPassword} onChange={setLoginPassword} required />
              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-xl bg-ember py-3 text-sm font-semibold text-stone-surface transition-colors hover:bg-ember-dark disabled:opacity-50"
              >
                {loading ? 'Logging in…' : 'Log in'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <Field label="Email" type="email" value={regEmail} onChange={setRegEmail} required />
              <Field label="Password" type="password" value={regPassword} onChange={setRegPassword} required />
              <Field label="Username" type="text" value={regUsername} onChange={setRegUsername} required />
              <Field label="Display name" type="text" value={regDisplayName} onChange={setRegDisplayName} required />
              <Field label="Referral code (optional)" type="text" value={regReferral} onChange={setRegReferral} placeholder="e.g. JADE42" />
              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-xl bg-ember py-3 text-sm font-semibold text-stone-surface transition-colors hover:bg-ember-dark disabled:opacity-50"
              >
                {loading ? 'Creating account…' : 'Create account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

interface FieldProps {
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  placeholder?: string
}

function Field({ label, type, value, onChange, required, placeholder }: FieldProps) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-stone-muted">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-xl border border-stone-border bg-stone-alt px-4 py-3 text-sm text-stone-text outline-none transition-colors placeholder:text-stone-muted focus:border-ember/50 focus:bg-stone-surface"
      />
    </div>
  )
}
