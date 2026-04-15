import { useEffect, useState } from 'react'
import { FiActivity, FiCheckCircle } from 'react-icons/fi'
import type { SessionObject } from '../lib/api'
import { getActiveSession, endSession } from '../lib/api'

interface ActiveSessionBannerProps {
  /** Re-fetches when this key changes (e.g. after a climb is logged). */
  refreshKey?: number
}

export default function ActiveSessionBanner({ refreshKey }: ActiveSessionBannerProps) {
  const [session, setSession] = useState<SessionObject | null>(null)
  const [ending, setEnding] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    setDone(false)
    getActiveSession().then(setSession).catch(() => setSession(null))
  }, [refreshKey])

  if (!session || done) return null

  async function handleEnd() {
    if (!session || ending) return
    setEnding(true)
    try {
      await endSession(session.id)
      setDone(true)
      setSession(null)
    } catch (e) {
      console.error(e)
    } finally {
      setEnding(false)
    }
  }

  const gymName = session.gym_name ?? 'your gym'

  return (
    <div className="mb-4 flex items-center gap-3 rounded-2xl border border-ember/20 bg-ember/5 px-4 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ember/15">
        <FiActivity className="h-4 w-4 text-ember" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-stone-text">Session in progress</p>
        <p className="truncate text-xs text-stone-secondary">{gymName}</p>
      </div>
      <button
        onClick={handleEnd}
        disabled={ending}
        className="flex shrink-0 items-center gap-1.5 rounded-full bg-ember px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
      >
        {ending ? (
          <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
        ) : (
          <FiCheckCircle className="h-3.5 w-3.5" />
        )}
        End Session
      </button>
    </div>
  )
}
