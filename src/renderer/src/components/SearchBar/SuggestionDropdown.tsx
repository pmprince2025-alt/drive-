import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Clock, TrendingUp, Trash2 } from 'lucide-react'

interface Props {
  open: boolean
  suggestions: { query: string; count: number }[]
  selectedIndex: number
  onSelect: (query: string) => void
  onDelete: (query: string) => void
  onClear: () => void
  onAskAi?: () => void
}

export function SuggestionDropdown({ open, suggestions, selectedIndex, onSelect, onDelete, onClear, onAskAi }: Props) {
  return (
    <AnimatePresence>
      {open && suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8, scaleY: 0.95 }}
          animate={{ opacity: 1, y: 0, scaleY: 1 }}
          exit={{ opacity: 0, y: -8, scaleY: 0.95 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden border border-[var(--glass-border)] bg-[var(--bg-surface)]/80 backdrop-blur-2xl shadow-2xl shadow-black/40 z-50"
          style={{ transformOrigin: 'top center' }}
        >
          {/* Ask AI option */}
          {onAskAi && (
            <div className="px-3 pt-2 pb-1">
              <button
                onMouseDown={(e) => { e.preventDefault(); onAskAi() }}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-left transition-all bg-accent/5 hover:bg-accent/15 border border-accent/10"
              >
                <div className="shrink-0 w-7 h-7 rounded-lg bg-accent/20 flex items-center justify-center">
                  <Sparkles size={14} className="text-accent" />
                </div>
                <div className="flex-1">
                  <span className="text-accent font-medium">Ask AI</span>
                  <span className="text-text-muted ml-2 text-xs">{suggestions[0]?.query || ''}</span>
                </div>
                <span className="text-[10px] text-text-muted uppercase tracking-wider">Groq AI</span>
              </button>
            </div>
          )}

          {/* Divider when AI option is shown */}
          {onAskAi && <div className="mx-3 border-t border-[var(--glass-border)]" />}

          <div className="py-2">
            {suggestions.map((entry, i) => (
              <motion.button
                key={entry.query}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.12, delay: i * 0.02 }}
                onMouseDown={(e) => {
                  e.preventDefault()
                  onSelect(entry.query)
                }}
                className={`w-full flex items-center gap-3 px-5 py-3 text-sm text-left transition-all duration-100 ${
                  i === selectedIndex
                    ? 'bg-accent/15 text-accent shadow-[inset_0_0_20px_var(--accent-glow)]'
                    : 'text-text-primary hover:bg-white/[0.04]'
                }`}
              >
                <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                  i === selectedIndex ? 'bg-accent/20' : 'bg-white/[0.04]'
                }`}>
                  {i === 0 ? (
                    <TrendingUp size={14} className={i === selectedIndex ? 'text-accent' : 'text-text-muted'} />
                  ) : (
                    <Clock size={14} className={i === selectedIndex ? 'text-accent' : 'text-text-muted'} />
                  )}
                </div>
                <span className="flex-1 truncate tracking-wide">{entry.query}</span>
                <span className="text-[11px] text-text-muted tabular-nums mr-2">{entry.count}</span>
                <button
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    onDelete(entry.query)
                  }}
                  className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                  style={{ opacity: i === selectedIndex ? 1 : undefined }}
                >
                  <Trash2 size={12} />
                </button>
              </motion.button>
            ))}
          </div>
          <div className="border-t border-[var(--glass-border)] px-3 py-2 flex items-center justify-between">
            <span className="text-[11px] text-text-muted tracking-wide">
              {suggestions.filter((s) => s.count > 0).length} saved
            </span>
            <button
              onMouseDown={(e) => {
                e.preventDefault()
                onClear()
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-all"
            >
              <Trash2 size={11} />
              Clear all
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
