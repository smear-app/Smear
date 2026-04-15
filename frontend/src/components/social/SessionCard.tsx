import { useState } from 'react'
import { FiUser, FiHeart, FiMessageCircle, FiZap } from 'react-icons/fi'
import type { SessionCardObject } from '../../lib/api'
import { addReaction, removeReaction } from '../../lib/api'

interface SessionCardProps {
  session: SessionCardObject
  onCommentTap?: (sessionId: string) => void
}

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

        {/* Hardest grade (no cover photo case) */}
        {!session.cover_photo_url && session.hardest_grade && (
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

        {/* Tags */}
        {session.top_tags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {session.top_tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-stone-border bg-stone-bg px-2 py-0.5 text-xs capitalize text-stone-secondary"
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

function StatChip({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`flex flex-col items-center rounded-xl px-3 py-1.5 ${accent ? 'bg-ember/10' : 'bg-stone-bg'}`}>
      <span className={`text-sm font-bold ${accent ? 'text-ember' : 'text-stone-text'}`}>{value}</span>
      <span className="text-[10px] text-stone-secondary">{label}</span>
    </div>
  )
}
