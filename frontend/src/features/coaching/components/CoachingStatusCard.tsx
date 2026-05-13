import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiChevronRight, FiZap } from 'react-icons/fi'
import {
  getPreSessionInsight,
  getPostSessionInsight,
  getActiveSession,
} from '../../../lib/api'

type CardState = 'pre-session' | 'mid-session' | 'post-session' | 'loading' | 'hidden'

interface CoachingStatusCardProps {
  refreshKey?: number
}

export default function CoachingStatusCard({ refreshKey }: CoachingStatusCardProps) {
  const navigate = useNavigate()
  const [cardState, setCardState] = useState<CardState>('loading')
  const [insight, setInsight] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const active = await getActiveSession()

        if (cancelled) return

        if (active) {
          setCardState('mid-session')
          setInsight(null)
          return
        }

        // Try post-session first (session ended today), fall back to pre-session
        let text: string | null = null
        let state: CardState = 'pre-session'

        try {
          const post = await getPostSessionInsight()
          text = post.insight
          state = 'post-session'
        } catch (postErr) {
          try {
            const pre = await getPreSessionInsight()
            text = pre.insight
            state = 'pre-session'
          } catch (preErr) {
            console.error('[CoachingStatusCard] pre-session failed:', preErr)
          }
        }

        if (!cancelled) {
          setInsight(text)
          setCardState(text ? state : 'hidden')
        }
      } catch (err) {
        console.error('[CoachingStatusCard] load failed:', err)
        if (!cancelled) setCardState('hidden')
      }
    }

    void load()
    return () => { cancelled = true }
  }, [refreshKey])

  if (cardState === 'loading') {
    return (
      <div className="h-[72px] animate-pulse rounded-[22px] border border-stone-border bg-stone-surface" />
    )
  }

  if (cardState === 'hidden') return null

  const label =
    cardState === 'mid-session'
      ? 'Mid-session'
      : cardState === 'post-session'
      ? 'Post-session'
      : 'Pre-session'

  const preview =
    cardState === 'mid-session'
      ? 'Session in progress — tap for a check-in.'
      : insight
        ? insight.length > 90
          ? insight.slice(0, 87) + '…'
          : insight
        : null

  if (!preview) return null

  return (
    <button
      onClick={() => navigate('/coaching')}
      className="w-full text-left rounded-[22px] border border-ember/20 bg-ember/5 px-4 py-3.5 transition duration-150 active:bg-ember/10"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ember/15">
          <FiZap className="h-3.5 w-3.5 text-ember" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-ember">{label}</p>
          <p className="mt-0.5 text-sm leading-snug text-stone-text">{preview}</p>
        </div>
        <FiChevronRight className="mt-1 h-4 w-4 shrink-0 text-stone-secondary/60" />
      </div>
    </button>
  )
}
