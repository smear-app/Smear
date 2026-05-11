import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiArrowLeft, FiZap } from 'react-icons/fi'
import {
  getPreSessionInsight,
  getPostSessionInsight,
  getTrainingFocusInsight,
  postCheckinInsight,
  getActiveSession,
  type CoachingInsightResponse,
} from '../../../lib/api'

type Feeling = 'good' | 'tired' | 'sore'

function InsightSection({
  title,
  insight,
  loading,
}: {
  title: string
  insight: string | null
  loading: boolean
}) {
  return (
    <div className="rounded-[22px] border border-stone-border bg-stone-surface px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-stone-secondary">{title}</p>
      {loading ? (
        <div className="mt-3 space-y-2">
          <div className="h-3.5 w-full animate-pulse rounded-full bg-stone-alt" />
          <div className="h-3.5 w-4/5 animate-pulse rounded-full bg-stone-alt" />
          <div className="h-3.5 w-3/5 animate-pulse rounded-full bg-stone-alt" />
        </div>
      ) : insight ? (
        <p className="mt-2 text-sm leading-relaxed text-stone-text">{insight}</p>
      ) : (
        <p className="mt-2 text-sm text-stone-secondary">No insight available yet.</p>
      )}
    </div>
  )
}

export default function CoachingDetailPage() {
  const navigate = useNavigate()

  const [todayInsight, setTodayInsight] = useState<string | null>(null)
  const [todayLoading, setTodayLoading] = useState(true)

  const [focusInsight, setFocusInsight] = useState<string | null>(null)
  const [focusLoading, setFocusLoading] = useState(true)

  const [hasActiveSession, setHasActiveSession] = useState(false)
  const [feeling, setFeeling] = useState<Feeling | null>(null)
  const [checkinInsight, setCheckinInsight] = useState<string | null>(null)
  const [checkinLoading, setCheckinLoading] = useState(false)

  useEffect(() => {
    async function loadToday() {
      try {
        const active = await getActiveSession()
        setHasActiveSession(!!active)

        let resp: CoachingInsightResponse
        try {
          resp = await getPostSessionInsight()
        } catch {
          resp = await getPreSessionInsight()
        }
        setTodayInsight(resp.insight)
      } catch {
        setTodayInsight(null)
      } finally {
        setTodayLoading(false)
      }
    }

    async function loadFocus() {
      try {
        const resp = await getTrainingFocusInsight()
        setFocusInsight(resp.insight)
      } catch {
        setFocusInsight(null)
      } finally {
        setFocusLoading(false)
      }
    }

    void loadToday()
    void loadFocus()
  }, [])

  async function handleCheckin(f: Feeling) {
    setFeeling(f)
    setCheckinLoading(true)
    try {
      const resp = await postCheckinInsight(f)
      setCheckinInsight(resp.insight)
    } catch {
      setCheckinInsight(null)
    } finally {
      setCheckinLoading(false)
    }
  }

  return (
    <div className="app-safe-shell min-h-screen bg-stone-bg">
      <main className="app-safe-shell__main mx-auto max-w-[420px] px-5 pb-32 pt-6">
        <div className="mb-5 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-border bg-stone-surface text-stone-secondary transition hover:bg-stone-alt"
            aria-label="Back"
          >
            <FiArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-ember/15">
              <FiZap className="h-3.5 w-3.5 text-ember" />
            </div>
            <h1 className="text-xl font-bold text-stone-text">Coaching</h1>
          </div>
        </div>

        <div className="space-y-3">
          <InsightSection title="Today" insight={todayInsight} loading={todayLoading} />

          {hasActiveSession && (
            <div className="rounded-[22px] border border-stone-border bg-stone-surface px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-secondary">
                Check-in
              </p>
              {!feeling ? (
                <div className="mt-3 flex gap-2">
                  {(['good', 'tired', 'sore'] as Feeling[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => handleCheckin(f)}
                      className="flex-1 rounded-full border border-stone-border bg-stone-alt py-2 text-sm font-medium text-stone-text capitalize transition hover:border-ember/30 hover:bg-ember/5 hover:text-ember"
                    >
                      {f}
                    </button>
                  ))}
                </div>
              ) : checkinLoading ? (
                <div className="mt-3 space-y-2">
                  <div className="h-3.5 w-full animate-pulse rounded-full bg-stone-alt" />
                  <div className="h-3.5 w-3/5 animate-pulse rounded-full bg-stone-alt" />
                </div>
              ) : checkinInsight ? (
                <p className="mt-2 text-sm leading-relaxed text-stone-text">{checkinInsight}</p>
              ) : (
                <p className="mt-2 text-sm text-stone-secondary">Could not load check-in.</p>
              )}
            </div>
          )}

          <InsightSection title="Training Focus" insight={focusInsight} loading={focusLoading} />
        </div>
      </main>
    </div>
  )
}
