import { useNavigate } from 'react-router-dom'
import { FiMessageSquare, FiChevronRight } from 'react-icons/fi'

export default function CoachingStatusCard() {
  const navigate = useNavigate()

  return (
    <button
      onClick={() => navigate('/coaching')}
      className="w-full text-left rounded-[22px] border border-stone-border bg-stone-surface px-4 py-3.5 transition duration-150 active:bg-stone-alt"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ember/15">
          <FiMessageSquare className="h-3.5 w-3.5 text-ember" />
        </div>
        <p className="flex-1 text-sm font-medium text-stone-text">Chat with Coach Smear</p>
        <FiChevronRight className="h-4 w-4 shrink-0 text-stone-secondary/60" />
      </div>
    </button>
  )
}
