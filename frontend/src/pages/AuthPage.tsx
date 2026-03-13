import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signIn, signUp } from '../lib/auth'

type Tab = 'login' | 'register'

export default function AuthPage() {
  const navigate = useNavigate()
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
      navigate('/')
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
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f5f2] px-5">
      <div className="w-full max-w-[420px]">
        <h1 className="mb-8 text-center text-3xl font-bold text-slate-900">Smear</h1>

        {/* Tabs */}
        <div className="mb-6 flex rounded-2xl bg-white p-1 shadow-[0_4px_20px_rgba(15,23,42,0.06)]">
          <button
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-colors ${
              tab === 'login'
                ? 'bg-slate-900 text-white'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => { setTab('login'); setError(null) }}
          >
            Log in
          </button>
          <button
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-colors ${
              tab === 'register'
                ? 'bg-slate-900 text-white'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => { setTab('register'); setError(null) }}
          >
            Register
          </button>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-[0_4px_20px_rgba(15,23,42,0.06)]">
          {error && (
            <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
          )}

          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <Field label="Email" type="email" value={loginEmail} onChange={setLoginEmail} required />
              <Field label="Password" type="password" value={loginPassword} onChange={setLoginPassword} required />
              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white disabled:opacity-50"
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
                className="mt-2 w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white disabled:opacity-50"
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
      <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wide">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:bg-white transition-colors"
      />
    </div>
  )
}
