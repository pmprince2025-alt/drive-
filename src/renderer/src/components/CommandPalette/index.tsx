import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe, Search, History, Bookmark, ArrowRight } from 'lucide-react'
import { useTabsStore } from '../../store/tabs'

interface Props {
  isOpen: boolean
  onClose: () => void
}

interface ResultItem {
  type: 'tab' | 'history' | 'bookmark' | 'action'
  label: string
  sublabel?: string
  icon: JSX.Element
  onSelect: () => void
}

export function CommandPalette({ isOpen, onClose }: Props): JSX.Element {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const tabs = useTabsStore((s) => s.tabs)

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  const results: ResultItem[] = [
    ...(query.trim()
      ? [
          {
            type: 'action' as const,
            label: `Open "${query}"`,
            icon: <ArrowRight size={16} className="text-accent" />,
            onSelect: () => {
              let url = query.trim()
              if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url
              }
              const activeId = useTabsStore.getState().activeTabId
              if (activeId) {
                window.ipc.invoke('browser:navigate', { tabId: activeId, url })
              }
              onClose()
            }
          }
        ]
      : []),
    ...tabs
      .filter((t) => t.title.toLowerCase().includes(query.toLowerCase()) || t.url.toLowerCase().includes(query.toLowerCase()))
      .map(
        (tab): ResultItem => ({
          type: 'tab',
          label: tab.title,
          sublabel: tab.url,
          icon: tab.favicon ? (
            <img src={tab.favicon} alt="" className="w-5 h-5 rounded-sm" />
          ) : (
            <Globe size={16} className="text-text-secondary" />
          ),
          onSelect: () => {
            window.ipc.invoke('browser:switchTab', { tabId: tab.id })
            onClose()
          }
        })
      )
  ]

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        results[selectedIndex].onSelect()
      } else if (e.key === 'Escape') {
        onClose()
      }
    },
    [results, selectedIndex, onClose]
  )

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="w-[520px] max-w-[90vw] bg-bg-surface border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 px-5 py-4 border-b border-[var(--border)]">
              <Search size={18} className="text-text-muted shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setSelectedIndex(0)
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search tabs, history, or enter a URL..."
                className="flex-1 bg-transparent text-base text-text-primary outline-none placeholder:text-text-muted"
              />
            </div>

            {results.length > 0 && (
              <div className="max-h-[360px] overflow-y-auto py-1">
                {results.map((item, i) => (
                  <div
                    key={`${item.type}-${item.label}-${i}`}
                    onClick={item.onSelect}
                    className={`flex items-center gap-3 px-5 py-2.5 cursor-pointer text-base transition-colors duration-75 ${
                      i === selectedIndex ? 'bg-accent-glow text-text-primary' : 'text-text-secondary hover:bg-bg-elevated'
                    }`}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    <span className="truncate flex-1">{item.label}</span>
                    {item.sublabel && (
                      <span className="truncate text-sm text-text-muted max-w-[180px]">{item.sublabel}</span>
                    )}
                    <span className="text-xs uppercase text-text-muted tracking-wider">{item.type}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
