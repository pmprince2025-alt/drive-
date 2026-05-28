import { useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ArrowLeft, Bot, RefreshCw, AlertTriangle, KeyRound, WifiOff, Timer } from 'lucide-react'
import { useAiStore } from '../../store/ai'

export function AiChatView({ onBack }: { onBack: () => void }) {
  const { messages, loading, streamingText, error, errorCode, sendMessage, stopGeneration, retryLast, clearChat } = useAiStore()
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSend = () => {
    const val = inputRef.current?.value.trim()
    if (!val) return
    inputRef.current!.value = ''
    sendMessage(val)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (loading) {
        stopGeneration()
      } else {
        handleSend()
      }
    }
  }

  const ErrorIcon = errorCode === 'INVALID_KEY' ? KeyRound
    : errorCode === 'API_KEY_MISSING' ? KeyRound
    : errorCode === 'RATE_LIMITED' ? Timer
    : errorCode === 'NETWORK' ? WifiOff
    : AlertTriangle

  return (
    <div className="flex flex-col h-[420px] max-h-[60vh]">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-[var(--glass-border)] shrink-0">
        <button
          onClick={onBack}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.06] transition-all"
        >
          <ArrowLeft size={16} />
        </button>
        <Bot size={16} className="text-accent" />
        <span className="text-sm font-medium text-text-primary">AI Chat</span>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="ml-auto text-[11px] text-text-muted hover:text-text-secondary transition-colors px-2 py-0.5 rounded-md hover:bg-white/[0.04]"
          >
            Clear
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 scrollbar-thin">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Sparkles size={32} className="text-accent/30 mb-3" />
            <p className="text-sm text-text-primary">Ask me anything!</p>
            <p className="text-xs text-text-muted/60 mt-1">I can research, explain, write, and more.</p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-accent/15 text-text-primary rounded-tr-md'
                    : 'glass-panel rounded-tl-md'
                }`}
              >
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && streamingText && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed glass-panel rounded-tl-md whitespace-pre-wrap">
              {streamingText}
              <span className="inline-block w-1.5 h-4 bg-accent/60 ml-0.5 animate-pulse rounded-sm" />
            </div>
          </motion.div>
        )}

        {loading && !streamingText && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="glass-panel px-4 py-3 rounded-2xl rounded-tl-md flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-accent/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-accent/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-accent/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-2"
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-400 text-xs">
              <ErrorIcon size={12} className="shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={retryLast}
              className="flex items-center gap-1.5 text-xs text-accent/70 hover:text-accent transition-colors px-3 py-1 rounded-lg hover:bg-accent/5"
            >
              <RefreshCw size={12} />
              Retry
            </button>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-3 border-t border-[var(--glass-border)] shrink-0">
        <div className="flex items-center gap-2 bg-[var(--bg-elevated)] rounded-xl px-4 py-2 border border-[var(--glass-border)] focus-within:border-accent/30 transition-colors">
          <input
            ref={inputRef}
            type="text"
            onKeyDown={handleKeyDown}
            placeholder={loading ? 'Generating...' : 'Type a message...'}
            disabled={loading}
            className="flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted disabled:opacity-50"
          />
          <button
            onClick={loading ? stopGeneration : handleSend}
            className={`shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
              loading
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                : 'bg-accent/15 text-accent hover:bg-accent/25'
            }`}
          >
            {loading ? (
              <span className="text-xs font-bold">■</span>
            ) : (
              <ArrowLeft size={16} className="rotate-90" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
