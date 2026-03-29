import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiArrowLeft, FiCheckCircle, FiXCircle } from 'react-icons/fi'
import BottomNav from '../components/BottomNav'
import { fetchPendingFlags, mergeFlag, dismissFlag } from '../lib/duplicateFlags'
import type { DuplicateFlag, CanonicalSummary } from '../lib/duplicateFlags'
import { getClimbColorBadgeStyle } from '../lib/climbColors'

const GRADE_LABELS: Record<number, string> = {
  [-1]: 'VB', 0: 'V0', 1: 'V1', 2: 'V2', 3: 'V3', 4: 'V4', 5: 'V5',
  6: 'V6', 7: 'V7', 8: 'V8', 9: 'V9', 10: 'V10', 11: 'V10+',
}

function gradeLabel(value: number): string {
  return GRADE_LABELS[value] ?? `V${value}`
}

function ScoreBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100)
  const colorClass = score >= 0.95
    ? 'bg-green-100 text-green-800 border-green-200'
    : 'bg-amber-100 text-amber-800 border-amber-200'
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${colorClass}`}>
      {pct}% match
    </span>
  )
}

function CanonicalPanel({
  canonical,
  selected,
  onSelect,
}: {
  canonical: CanonicalSummary
  selected: boolean
  onSelect: () => void
}) {
  const colorStyle = getClimbColorBadgeStyle(canonical.hold_color)
  const tags = canonical.canonical_tags ?? []

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full flex-col overflow-hidden rounded-2xl border-2 text-left transition-all ${
        selected
          ? 'border-ember shadow-[0_0_0_3px_rgba(217,92,79,0.15)]'
          : 'border-stone-border'
      } bg-stone-surface`}
    >
      {canonical.photo_url ? (
        <img
          src={canonical.photo_url}
          alt="climb"
          className="h-36 w-full object-cover"
        />
      ) : (
        <div className="flex h-36 w-full items-center justify-center bg-stone-border/40 text-xs text-stone-muted">
          No photo
        </div>
      )}

      <div className="flex flex-col gap-1.5 p-3">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-stone-text">
            {gradeLabel(canonical.gym_grade_value)}
          </span>
          {canonical.hold_color && (
            <span
              className="rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize"
              style={{
                backgroundColor: colorStyle.backgroundColor,
                borderColor: colorStyle.borderColor,
                color: colorStyle.color,
              }}
            >
              {canonical.hold_color}
            </span>
          )}
        </div>

        <p className="text-[10px] text-stone-muted">{canonical.log_count} logs</p>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-stone-border bg-stone-bg px-2 py-0.5 text-[10px] text-stone-muted capitalize"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {selected && (
          <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-ember">
            <FiCheckCircle size={12} />
            Keep this one
          </div>
        )}
      </div>
    </button>
  )
}

function FlagCard({ flag, onResolved }: { flag: DuplicateFlag; onResolved: () => void }) {
  const [winner, setWinner] = useState<'a' | 'b' | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleMerge() {
    if (!winner) return
    const winnerId = winner === 'a' ? flag.canonical_a.id : flag.canonical_b.id
    const loserId = winner === 'a' ? flag.canonical_b.id : flag.canonical_a.id
    setLoading(true)
    setError(null)
    try {
      await mergeFlag(flag.id, winnerId, loserId)
      onResolved()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Merge failed')
      setLoading(false)
    }
  }

  async function handleDismiss() {
    setLoading(true)
    setError(null)
    try {
      await dismissFlag(flag.id)
      onResolved()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Dismiss failed')
      setLoading(false)
    }
  }

  return (
    <div className="rounded-[28px] border border-stone-border bg-stone-surface px-5 py-5 shadow-[0_14px_34px_rgba(89,68,51,0.08)]">
      <div className="mb-3 flex items-center justify-between">
        <ScoreBadge score={flag.similarity_score} />
        <span className="text-[10px] text-stone-muted">
          {new Date(flag.created_at).toLocaleDateString()}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <CanonicalPanel
          canonical={flag.canonical_a}
          selected={winner === 'a'}
          onSelect={() => setWinner('a')}
        />
        <CanonicalPanel
          canonical={flag.canonical_b}
          selected={winner === 'b'}
          onSelect={() => setWinner('b')}
        />
      </div>

      {error && <p className="mt-3 text-xs text-red-500">{error}</p>}

      <div className="mt-4 flex gap-3">
        <button
          type="button"
          disabled={!winner || loading}
          onClick={handleMerge}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-ember py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
        >
          <FiCheckCircle size={14} />
          Merge
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={handleDismiss}
          className="flex items-center justify-center gap-1.5 rounded-full border border-stone-border px-4 py-2.5 text-sm font-semibold text-stone-muted transition-opacity disabled:opacity-40"
        >
          <FiXCircle size={14} />
          Dismiss
        </button>
      </div>
    </div>
  )
}

export default function AdminDuplicatesPage() {
  const [flags, setFlags] = useState<DuplicateFlag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchPendingFlags()
      setFlags(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load flags')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  function handleResolved(flagId: string) {
    setFlags((current) => current.filter((f) => f.id !== flagId))
  }

  return (
    <div className="app-safe-shell min-h-screen bg-stone-bg">
      <main className="app-safe-shell__main mx-auto flex min-h-screen max-w-[420px] flex-col px-5 pb-32 pt-6">
        <div className="mb-6 flex items-center gap-3">
          <Link to="/profile" className="text-stone-muted">
            <FiArrowLeft size={20} />
          </Link>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-muted">
              Admin
            </p>
            <h1 className="text-2xl font-bold text-stone-text">
              Duplicate Flags
              {flags.length > 0 && (
                <span className="ml-2 rounded-full bg-ember px-2.5 py-0.5 text-sm text-white">
                  {flags.length}
                </span>
              )}
            </h1>
          </div>
        </div>

        {loading && (
          <p className="text-sm text-stone-muted">Loading…</p>
        )}

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        {!loading && !error && flags.length === 0 && (
          <div className="rounded-[28px] border border-stone-border bg-stone-surface px-5 py-8 text-center shadow-[0_14px_34px_rgba(89,68,51,0.08)]">
            <p className="font-semibold text-stone-text">No pending flags</p>
            <p className="mt-1 text-sm text-stone-muted">
              The similarity threshold is 85%. Lower it in{' '}
              <code className="text-xs">duplicate_detection.py</code> to catch more pairs.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {flags.map((flag) => (
            <FlagCard
              key={flag.id}
              flag={flag}
              onResolved={() => handleResolved(flag.id)}
            />
          ))}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
