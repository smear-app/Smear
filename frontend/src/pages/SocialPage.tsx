import { useEffect, useRef, useState } from 'react'
import { FiUsers, FiCompass, FiUserPlus } from 'react-icons/fi'
import BottomNav from '../components/BottomNav'
import SessionCard from '../components/social/SessionCard'
import SessionCommentsSheet from '../components/social/SessionCommentsSheet'
import UserSearchSheet from '../components/social/UserSearchSheet'
import type { SessionCardObject } from '../lib/api'
import { getSocialFeed, getExploreFeed } from '../lib/api'
import { useGym } from '../context/GymContext'

type Tab = 'friends' | 'explore'
type FeedState = { feed: SessionCardObject[]; error: string | null; resolvedAt: number }

const FEED_STALE_MS = 60_000

export default function SocialPage({ isActive = true }: { isActive?: boolean }) {
  const [tab, setTab] = useState<Tab>('friends')
  const [feedStateByKey, setFeedStateByKey] = useState<Record<string, FeedState>>({})
  const [showSearch, setShowSearch] = useState(false)
  const [commentSessionId, setCommentSessionId] = useState<string | null>(null)
  const { activeGym, isHydrated } = useGym()
  const scrollPositionRef = useRef(0)

  const currentKey = `${tab}-${activeGym?.id ?? ''}`
  const currentState = feedStateByKey[currentKey]
  const loading = isActive && ((tab === 'explore' && !isHydrated) || !currentState)
  const feed = currentState?.feed ?? []
  const error = currentState?.error ?? null

  useEffect(() => {
    let cancelled = false
    const key = `${tab}-${activeGym?.id ?? ''}`
    const cachedState = feedStateByKey[key]
    const isStale = !cachedState || Date.now() - cachedState.resolvedAt > FEED_STALE_MS

    if (!isActive || (tab === 'explore' && !isHydrated) || !isStale) {
      return () => { cancelled = true }
    }

    const load = tab === 'friends'
      ? getSocialFeed()
      : getExploreFeed(20, 0, activeGym?.id)

    load
      .then((data) => {
        if (!cancelled) {
          setFeedStateByKey((currentStateByKey) => ({
            ...currentStateByKey,
            [key]: { feed: data, error: null, resolvedAt: Date.now() },
          }))
        }
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setFeedStateByKey((currentStateByKey) => ({
            ...currentStateByKey,
            [key]: { feed: [], error: e.message, resolvedAt: Date.now() },
          }))
        }
      })

    return () => { cancelled = true }
  }, [tab, activeGym?.id, feedStateByKey, isActive, isHydrated])

  useEffect(() => {
    if (!isActive || typeof window === 'undefined') {
      return
    }

    window.requestAnimationFrame(() => {
      window.scrollTo({ top: scrollPositionRef.current, behavior: 'auto' })
    })
  }, [isActive])

  useEffect(() => {
    if (isActive || typeof window === 'undefined') {
      return
    }

    scrollPositionRef.current = window.scrollY
  }, [isActive])

  return (
    <div
      className="app-safe-shell min-h-screen bg-stone-bg"
      style={{ display: isActive ? undefined : 'none' }}
      aria-hidden={!isActive}
    >
      <main className="app-safe-shell__main mx-auto max-w-[420px] px-4 pb-32 pt-6">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-stone-text">Social</h1>
          <button
            onClick={() => setShowSearch(true)}
            className="flex items-center gap-1.5 rounded-full border border-stone-border bg-stone-surface px-3 py-1.5 text-sm font-medium text-stone-secondary"
          >
            <FiUserPlus className="h-4 w-4" />
            Find Climbers
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-5 flex rounded-xl border border-stone-border bg-stone-surface p-1">
          <TabButton active={tab === 'friends'} onClick={() => setTab('friends')} icon={<FiUsers className="h-3.5 w-3.5" />} label="Friends" />
          <TabButton active={tab === 'explore'} onClick={() => setTab('explore')} icon={<FiCompass className="h-3.5 w-3.5" />} label={activeGym ? activeGym.name : 'Explore'} />
        </div>

        {/* Feed */}
        {loading && (
          <div className="flex justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-ember border-t-transparent" />
          </div>
        )}

        {!loading && error && (
          <p className="py-12 text-center text-sm text-stone-secondary">{error}</p>
        )}

        {!loading && !error && feed.length === 0 && (
          <EmptyState tab={tab} onFindFriends={() => setShowSearch(true)} gymName={activeGym?.name} />
        )}

        {!loading && !error && feed.length > 0 && (
          <div className="flex flex-col gap-4">
            {feed.map((session) => (
              <SessionCard key={session.id} session={session} onCommentTap={setCommentSessionId} />
            ))}
          </div>
        )}
      </main>

      <BottomNav />
      <UserSearchSheet isOpen={showSearch} onClose={() => setShowSearch(false)} />
      <SessionCommentsSheet sessionId={commentSessionId} onClose={() => setCommentSessionId(null)} />
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-colors ${
        active ? 'bg-stone-bg text-stone-text shadow-sm' : 'text-stone-secondary'
      }`}
    >
      {icon}
      <span className="truncate max-w-[100px]">{label}</span>
    </button>
  )
}

function EmptyState({
  tab,
  onFindFriends,
  gymName,
}: {
  tab: Tab
  onFindFriends: () => void
  gymName?: string
}) {
  if (tab === 'friends') {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ember/10">
          <FiUsers className="h-8 w-8 text-ember" />
        </div>
        <div>
          <p className="font-semibold text-stone-text">No sessions yet</p>
          <p className="mt-1 text-sm text-stone-secondary">Follow other climbers to see their sessions here</p>
        </div>
        <button
          onClick={onFindFriends}
          className="rounded-full bg-ember px-5 py-2 text-sm font-semibold text-white"
        >
          Find Climbers
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ember/10">
        <FiCompass className="h-8 w-8 text-ember" />
      </div>
      <div>
        <p className="font-semibold text-stone-text">No public sessions yet</p>
        <p className="mt-1 text-sm text-stone-secondary">
          {gymName ? `No one has shared a session at ${gymName} yet` : 'No public sessions nearby'}
        </p>
      </div>
    </div>
  )
}
