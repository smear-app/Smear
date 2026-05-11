import { useEffect, useState } from 'react'
import { FiX, FiUser, FiHeart, FiMessageCircle, FiActivity } from 'react-icons/fi'
import type { NotificationObject } from '../../lib/api'
import { getNotifications, markNotificationsRead } from '../../lib/api'

interface InboxSheetProps {
  isOpen: boolean
  onClose: () => void
  onOpenSession?: (sessionId: string) => void
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

function notificationCopy(n: NotificationObject): { primary: string; secondary: string | null } {
  const actor = n.actor_display_name ?? n.actor_username ?? 'Someone'
  const gym = n.session_gym_name ? ` at ${n.session_gym_name}` : ''
  switch (n.type) {
    case 'reaction':
      return { primary: `${actor} liked your session${gym}`, secondary: null }
    case 'comment':
      return {
        primary: `${actor} commented on your session${gym}`,
        secondary: n.comment_body ? `"${n.comment_body}"` : null,
      }
    case 'new_post':
      return { primary: `${actor} posted a new session${gym}`, secondary: null }
  }
}

function NotificationIcon({ type }: { type: NotificationObject['type'] }) {
  if (type === 'reaction') return <FiHeart className="h-3.5 w-3.5 text-ember" />
  if (type === 'comment') return <FiMessageCircle className="h-3.5 w-3.5 text-blue-400" />
  return <FiActivity className="h-3.5 w-3.5 text-emerald-500" />
}

export default function InboxSheet({ isOpen, onClose, onOpenSession }: InboxSheetProps) {
  const [notifications, setNotifications] = useState<NotificationObject[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    void (async () => {
      setLoading(true)
      try {
        const res = await getNotifications()
        setNotifications(res.notifications)
        await markNotificationsRead()
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    })()
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative flex max-h-[80vh] flex-col rounded-t-[24px] bg-stone-bg">
        <div className="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-stone-border" />

        <div className="flex items-center justify-between border-b border-stone-border px-4 pb-3 pt-5">
          <p className="text-sm font-semibold text-stone-text">Inbox</p>
          <button onClick={onClose}>
            <FiX className="h-4 w-4 text-stone-secondary" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {loading && (
            <div className="flex justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-ember border-t-transparent" />
            </div>
          )}

          {!loading && notifications.length === 0 && (
            <p className="py-8 text-center text-sm text-stone-secondary">No notifications yet</p>
          )}

          <ul className="flex flex-col divide-y divide-stone-border/50">
            {notifications.map((n) => {
              const { primary, secondary } = notificationCopy(n)
              return (
                <li
                  key={n.id}
                  className={`flex gap-3 py-3 ${n.session_id && onOpenSession ? 'cursor-pointer active:bg-stone-surface/60' : ''}`}
                  onClick={() => n.session_id && onOpenSession?.(n.session_id)}
                >
                  {/* Avatar with type badge */}
                  <div className="relative shrink-0">
                    {n.actor_avatar_url ? (
                      <img src={n.actor_avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ember/10 text-ember">
                        <FiUser className="h-5 w-5" />
                      </div>
                    )}
                    <div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-stone-bg shadow-sm ring-1 ring-stone-border">
                      <NotificationIcon type={n.type} />
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-stone-text">{primary}</p>
                    {secondary && (
                      <p className="mt-0.5 truncate text-xs text-stone-secondary">{secondary}</p>
                    )}
                    <p className="mt-0.5 text-[10px] text-stone-muted">{formatRelativeTime(n.created_at)}</p>
                  </div>

                  {n.session_cover_photo_url && (
                    <img
                      src={n.session_cover_photo_url}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-lg object-cover"
                    />
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </div>
  )
}
