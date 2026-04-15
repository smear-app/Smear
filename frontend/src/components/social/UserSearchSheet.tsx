import { useEffect, useRef, useState } from 'react'
import { FiSearch, FiX, FiUser } from 'react-icons/fi'
import type { UserSearchResult } from '../../lib/api'
import { searchUsers } from '../../lib/api'
import FollowButton from './FollowButton'

interface UserSearchSheetProps {
  isOpen: boolean
  onClose: () => void
}

export default function UserSearchSheet({ isOpen, onClose }: UserSearchSheetProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150)
    } else {
      setQuery('')
      setResults([])
    }
  }, [isOpen])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.trim().length < 1) {
      setResults([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await searchUsers(query.trim())
        setResults(data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }, 300)
  }, [query])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-stone-bg">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-stone-border px-4 pb-3 pt-4" style={{ paddingTop: 'max(1rem, calc(env(safe-area-inset-top) + 0.75rem))' }}>
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-stone-border bg-stone-surface px-3 py-2">
          <FiSearch className="h-4 w-4 shrink-0 text-stone-secondary" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search by name or username…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-stone-text outline-none placeholder:text-stone-secondary"
          />
          {query && (
            <button onClick={() => setQuery('')}>
              <FiX className="h-4 w-4 text-stone-secondary" />
            </button>
          )}
        </div>
        <button onClick={onClose} className="text-sm font-medium text-stone-secondary">
          Cancel
        </button>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex justify-center py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-ember border-t-transparent" />
          </div>
        )}
        {!loading && results.length === 0 && query.trim().length > 0 && (
          <p className="py-12 text-center text-sm text-stone-secondary">No climbers found</p>
        )}
        {!loading && results.length === 0 && query.trim().length === 0 && (
          <p className="py-12 text-center text-sm text-stone-secondary">Search for climbers to follow</p>
        )}
        <ul className="divide-y divide-stone-border">
          {results.map((user) => (
            <li key={user.user_id} className="flex items-center gap-3 px-4 py-3">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.display_name ?? ''} className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ember/10 text-ember">
                  <FiUser className="h-5 w-5" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-stone-text">
                  {user.display_name ?? user.username ?? 'Climber'}
                </p>
                {user.username && (
                  <p className="truncate text-xs text-stone-secondary">@{user.username}</p>
                )}
              </div>
              <FollowButton
                targetUserId={user.user_id}
                initialIsFollowing={user.is_following}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
