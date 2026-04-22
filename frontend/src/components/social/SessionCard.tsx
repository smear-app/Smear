import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FiUser, FiHeart, FiMessageCircle, FiZap, FiChevronDown } from 'react-icons/fi'
import type { SessionCardObject, SessionDetailObject } from '../../lib/api'
import { addReaction, getSocialSession, removeReaction } from '../../lib/api'
import type { Climb } from '../../lib/climbs'
import CompactClimbTileRow from '../logbook/CompactClimbTileRow'

interface SessionCardProps {
  session: SessionCardObject
  onCommentTap?: (sessionId: string) => void
}

const TAG_RANK_STYLES = [
  'border-amber-400/50 bg-amber-400/10 text-amber-600',   // gold
  'border-slate-400/50 bg-slate-400/10 text-slate-500',   // silver
  'border-amber-600/50 bg-amber-600/10 text-amber-700', // bronze
]

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatDuration(startedAt: string | null, endedAt: string | null): string | null {
  if (!startedAt || !endedAt) return null
  const mins = Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 60000)
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export default function SessionCard({ session, onCommentTap }: SessionCardProps) {
  const [reacted, setReacted] = useState(session.viewer_has_reacted)
  const [reactionCount, setReactionCount] = useState(session.reaction_count)
  const [loading, setLoading] = useState(false)
  const [details, setDetails] = useState<SessionDetailObject | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const displayName = session.author_display_name || session.author_username || 'Climber'
  const duration = formatDuration(session.started_at, session.ended_at)
  const timeAgo = formatRelativeTime(session.ended_at)

  async function toggleReaction() {
    if (loading) return
    setLoading(true)
    try {
      if (reacted) {
        await removeReaction(session.id)
        setReacted(false)
        setReactionCount((n) => Math.max(0, n - 1))
      } else {
        await addReaction(session.id)
        setReacted(true)
        setReactionCount((n) => n + 1)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function toggleDetails() {
    const nextOpen = !detailsOpen
    setDetailsOpen(nextOpen)
    if (!nextOpen || details || detailsLoading) return

    setDetailsLoading(true)
    setDetailsError(null)
    try {
      const nextDetails = await getSocialSession(session.id)
      setDetails(nextDetails)
    } catch (e) {
      setDetailsError(e instanceof Error ? e.message : 'Unable to load climbs')
    } finally {
      setDetailsLoading(false)
    }
  }

  const climbs = details ? details.climbs.map(mapSessionClimbToClimb) : []

  return (
    <article className="rounded-[20px] border border-stone-border bg-stone-surface shadow-[0_4px_16px_rgba(89,68,51,0.06)]">
      {/* Cover photo */}
      {session.cover_photo_url && (
        <div className="relative h-44 overflow-hidden rounded-t-[20px]">
          <img
            src={session.cover_photo_url}
            alt="Session cover"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          {session.hardest_grade && (
            <span className="absolute bottom-3 left-3 rounded-full bg-ember px-2.5 py-0.5 text-xs font-bold text-white">
              {session.hardest_grade}
            </span>
          )}
        </div>
      )}

      <div className="p-4">
        {/* Header: avatar + name + gym + time */}
        <div className="flex items-center gap-3">
          {session.author_avatar_url ? (
            <img
              src={session.author_avatar_url}
              alt={displayName}
              className="h-9 w-9 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ember/10 text-ember">
              <FiUser className="h-4 w-4" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-stone-text">{displayName}</p>
            <p className="truncate text-xs text-stone-secondary">
              {session.gym_name ?? 'Unknown Gym'}
              {duration && <span> · {duration}</span>}
              {timeAgo && <span> · {timeAgo}</span>}
            </p>
          </div>
        </div>

        {/* Stats row */}
        {session.total_climbs != null && (
          <div className="mt-3 flex gap-3">
            <StatChip label="Climbs" value={session.total_climbs} />
            {(session.sends ?? 0) > 0 && <StatChip label="Sends" value={session.sends!} />}
            {(session.flashes ?? 0) > 0 && <StatChip label="Flashes" value={session.flashes!} accent />}
            {(session.attempts ?? 0) > 0 && <StatChip label="Attempts" value={session.attempts!} />}
          </div>
        )}

        {session.total_climbs != null && session.total_climbs > 0 && (
          <div className="mt-3 rounded-[18px] border border-stone-border/80 bg-stone-bg/70">
            <button
              type="button"
              onClick={toggleDetails}
              className="flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left"
              aria-expanded={detailsOpen}
            >
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-muted">Session info</p>
                <p className="truncate text-sm font-semibold text-stone-text">
                  {detailsOpen ? 'Hide climbs' : `View climbs (${session.total_climbs})`}
                </p>
              </div>
              <FiChevronDown
                className={`h-4 w-4 shrink-0 text-stone-secondary transition-transform ${detailsOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {detailsOpen && (
              <div className="border-t border-stone-border/70 px-2 pb-2 pt-2">
                <div className="mb-2 px-1.5">
                  <p className="text-xs font-medium text-stone-secondary">
                    {session.gym_name ?? 'Unknown Gym'}
                    {duration && <span> • {duration}</span>}
                    {timeAgo && <span> • {timeAgo}</span>}
                  </p>
                </div>

                {detailsLoading && (
                  <div className="px-2 py-4 text-center text-sm text-stone-secondary">Loading climbs…</div>
                )}

                {!detailsLoading && detailsError && (
                  <div className="px-2 py-4 text-center text-sm text-stone-secondary">{detailsError}</div>
                )}

                {!detailsLoading && !detailsError && climbs.length > 0 && (
                  <div className="max-h-[11rem] space-y-1.5 overflow-y-auto pr-1">
                    {climbs.map((climb) => (
                      <Link
                        key={climb.id}
                        to={`/climbs/${climb.id}`}
                        state={{ climb, from: '/social' }}
                        className="block rounded-[18px] border border-stone-border/75 bg-stone-surface px-3 py-2 shadow-[0_8px_18px_rgba(89,68,51,0.05)] transition-colors duration-150 hover:bg-stone-alt"
                      >
                        <CompactClimbTileRow climb={climb} metaText={formatClimbMeta(climb)} />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Hardest grade */}
        {session.hardest_grade && (
          <div className="mt-3 flex items-center gap-1.5">
            <FiZap className="h-3.5 w-3.5 text-ember" />
            <span className="text-xs font-semibold text-stone-text">
              Hardest: {session.hardest_grade}
              {session.hardest_flash && session.hardest_flash === session.hardest_grade && (
                <span className="ml-1 text-ember"> (flash)</span>
              )}
            </span>
          </div>
        )}

        {/* Tags — gold/silver/bronze by frequency rank */}
        {session.top_tags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {session.top_tags.map((tag, i) => (
              <span
                key={tag}
                className={`rounded-full border px-2 py-0.5 text-xs capitalize ${TAG_RANK_STYLES[i] ?? TAG_RANK_STYLES[2]}`}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="mt-3.5 flex items-center gap-4 border-t border-stone-border pt-3">
          <button
            onClick={toggleReaction}
            disabled={loading}
            className="flex items-center gap-1.5 text-sm text-stone-secondary transition-colors"
          >
            <FiHeart
              className={`h-4 w-4 transition-colors ${reacted ? 'fill-ember stroke-ember' : ''}`}
            />
            <span className={reacted ? 'text-ember font-medium' : ''}>{reactionCount > 0 ? reactionCount : ''}</span>
          </button>
          <button
            onClick={() => onCommentTap?.(session.id)}
            className="flex items-center gap-1.5 text-sm text-stone-secondary transition-colors"
          >
            <FiMessageCircle className="h-4 w-4" />
            <span>{session.comment_count > 0 ? session.comment_count : ''}</span>
          </button>
        </div>
      </div>
    </article>
  )
}

function mapSessionClimbToClimb(climb: SessionDetailObject['climbs'][number]): Climb {
  return {
    id: climb.id,
    user_id: climb.user_id,
    gym_id: climb.gym_id,
    gym_name: climb.gym_name,
    gym_grade: climb.gym_grade,
    gym_grade_value: climb.gym_grade_value,
    personal_grade: climb.personal_grade,
    personal_grade_value: climb.personal_grade_value,
    send_type: climb.send_type,
    tags: climb.tags,
    photo_url: climb.photo_url,
    climbColor: climb.hold_color,
    notes: climb.notes,
    canonical_climb_id: climb.canonical_climb_id,
    canonical_tags: climb.canonical_tags,
    session_id: climb.session_id,
    session_started_at: null,
    created_at: climb.created_at,
  }
}

function formatClimbMeta(climb: Climb): string {
  return [
    climb.gym_name,
    new Date(climb.created_at).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
  ]
    .filter(Boolean)
    .join(' • ')
}

function StatChip({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`flex flex-col items-center rounded-xl px-3 py-1.5 ${accent ? 'bg-ember/10' : 'bg-stone-bg'}`}>
      <span className={`text-sm font-bold ${accent ? 'text-ember' : 'text-stone-text'}`}>{value}</span>
      <span className="text-[10px] text-stone-secondary">{label}</span>
    </div>
  )
}
