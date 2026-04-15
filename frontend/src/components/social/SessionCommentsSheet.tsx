import { useEffect, useRef, useState } from 'react'
import { FiX, FiUser, FiSend } from 'react-icons/fi'
import type { CommentObject } from '../../lib/api'
import { getComments, postComment } from '../../lib/api'

interface SessionCommentsSheetProps {
  sessionId: string | null
  onClose: () => void
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function SessionCommentsSheet({ sessionId, onClose }: SessionCommentsSheetProps) {
  const [comments, setComments] = useState<CommentObject[]>([])
  const [loading, setLoading] = useState(false)
  const [body, setBody] = useState('')
  const [posting, setPosting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sessionId) return
    setLoading(true)
    setComments([])
    getComments(sessionId)
      .then(setComments)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [sessionId])

  useEffect(() => {
    if (comments.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [comments.length])

  async function handlePost() {
    if (!sessionId || !body.trim() || posting) return
    setPosting(true)
    const trimmed = body.trim()
    setBody('')
    try {
      const comment = await postComment(sessionId, trimmed)
      setComments((prev) => [...prev, comment])
    } catch (e) {
      console.error(e)
      setBody(trimmed)
    } finally {
      setPosting(false)
    }
  }

  if (!sessionId) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Sheet */}
      <div className="relative flex max-h-[75vh] flex-col rounded-t-[24px] bg-stone-bg">
        {/* Drag handle */}
        <div className="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-stone-border" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-border px-4 pb-3 pt-5">
          <p className="text-sm font-semibold text-stone-text">Comments</p>
          <button onClick={onClose}>
            <FiX className="h-4 w-4 text-stone-secondary" />
          </button>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {loading && (
            <div className="flex justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-ember border-t-transparent" />
            </div>
          )}
          {!loading && comments.length === 0 && (
            <p className="py-8 text-center text-sm text-stone-secondary">No comments yet. Be the first!</p>
          )}
          <ul className="flex flex-col gap-4">
            {comments.map((c) => (
              <li key={c.id} className="flex gap-3">
                {c.author_avatar_url ? (
                  <img src={c.author_avatar_url} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
                ) : (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ember/10 text-ember">
                    <FiUser className="h-4 w-4" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs font-semibold text-stone-text">
                      {c.author_display_name ?? c.author_username ?? 'Climber'}
                    </span>
                    <span className="text-[10px] text-stone-secondary">{formatRelativeTime(c.created_at)}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-stone-text">{c.body}</p>
                </div>
              </li>
            ))}
            <div ref={bottomRef} />
          </ul>
        </div>

        {/* Input */}
        <div
          className="border-t border-stone-border px-4 py-3"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        >
          <div className="flex items-center gap-2 rounded-xl border border-stone-border bg-stone-surface px-3 py-2">
            <input
              ref={inputRef}
              type="text"
              placeholder="Add a comment…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void handlePost() }}
              className="flex-1 bg-transparent text-sm text-stone-text outline-none placeholder:text-stone-secondary"
            />
            <button
              onClick={() => void handlePost()}
              disabled={!body.trim() || posting}
              className="text-ember disabled:opacity-40"
            >
              <FiSend className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
