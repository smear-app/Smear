import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiArrowLeft, FiSend } from 'react-icons/fi'
import ReactMarkdown from 'react-markdown'
import { streamChatMessage, fetchCoachGreeting, type ChatMessage } from '../../../lib/api'

const FALLBACK_GREETING = "Hey! I'm Coach Smear. I've got your climbing data in front of me — what's on your mind?"

export default function CoachingDetailPage() {
  const navigate = useNavigate()
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: '' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const MAX_INPUT = 500

  useEffect(() => {
    fetchCoachGreeting()
      .then(({ insight }) => setMessages([{ role: 'assistant', content: insight }]))
      .catch(() => setMessages([{ role: 'assistant', content: FALLBACK_GREETING }]))
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    const text = input.trim()
    if (!text || loading || text.length > MAX_INPUT) return

    const next: ChatMessage[] = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setInput('')
    setLoading(true)

    const assistantMsg: ChatMessage = { role: 'assistant', content: '' }
    setMessages([...next, assistantMsg])

    try {
      await streamChatMessage(
        next.slice(1), // skip the opening greeting
        (chunk) => {
          assistantMsg.content += chunk
          setMessages([...next, { ...assistantMsg }])
        },
      )
    } catch (err) {
      const msg =
        err instanceof Error && err.message.includes('429')
          ? 'Rate limit reached. Try again in an hour.'
          : 'Something went wrong. Try again.'
      setMessages([...next, { role: 'assistant', content: msg }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-stone-bg">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-stone-border bg-stone-bg px-4 pt-safe pb-3 pt-4">
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-border bg-stone-surface text-stone-secondary transition hover:bg-stone-alt"
          aria-label="Back"
        >
          <FiArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <p className="text-base font-bold text-stone-text leading-tight">Coach Smear</p>
          <p className="text-xs text-stone-secondary">Powered by your climbing data</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'rounded-br-sm bg-ember text-white'
                  : 'rounded-bl-sm bg-stone-surface border border-stone-border text-stone-text'
              }`}
            >
              {m.role === 'assistant' ? (
                <div className="prose-sm prose-stone max-w-none [&_p]:my-0 [&_p+p]:mt-2">
                  <ReactMarkdown>{m.content || '…'}</ReactMarkdown>
                </div>
              ) : (
                m.content
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-stone-border bg-stone-bg px-4 py-3 pb-safe">
        {input.length > MAX_INPUT - 60 && (
          <p className={`mb-1 text-right text-xs ${input.length > MAX_INPUT ? 'text-red-500' : 'text-stone-secondary'}`}>
            {input.length}/{MAX_INPUT}
          </p>
        )}
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your climbing…"
            disabled={loading}
            rows={1}
            className="flex-1 resize-none overflow-hidden rounded-2xl border border-stone-border bg-stone-surface px-4 py-2.5 text-sm text-stone-text placeholder:text-stone-secondary/60 focus:border-ember/40 focus:outline-none disabled:opacity-50"
            style={{ height: '40px' }}
          />
          <button
            onClick={() => void handleSend()}
            disabled={!input.trim() || loading || input.trim().length > MAX_INPUT}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ember text-white transition hover:bg-ember/90 disabled:opacity-40"
          >
            <FiSend className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
