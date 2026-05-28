import { useState, useRef, useEffect, useCallback } from 'react'
import { Search, ArrowRight, X } from 'lucide-react'
import { SuggestionDropdown } from './SuggestionDropdown'
import { AiChatView } from './AiChatView'
import { getSuggestions, getAutocomplete, addSearchEntry, clearHistory, type SearchEntry } from '../../lib/searchHistory'
import { useTabsStore } from '../../store/tabs'
import { useAiStore } from '../../store/ai'

export function SearchBar({ compact, minimal, button }: { compact?: boolean; minimal?: boolean; button?: boolean }) {
  const [value, setValue] = useState('')
  const [suggestions, setSuggestions] = useState<SearchEntry[]>([])
  const [open, setOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef(0)

  useEffect(() => {
    const id = ++abortRef.current
    const timer = setTimeout(() => {
      if (id !== abortRef.current) return
      if (!value.trim()) {
        setSuggestions([])
        setOpen(false)
        return
      }
      const results = getSuggestions(value)
      setSuggestions(results)
      setOpen(results.length > 0)
      setSelectedIndex(-1)
    }, 80)
    return () => clearTimeout(timer)
  }, [value])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const navigate = useCallback((q: string) => {
    const activeId = useTabsStore.getState().activeTabId
    if (activeId == null) return
    let url = q
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      const hasDot = url.includes('.') && !url.includes(' ')
      if (hasDot && !url.includes('://')) {
        url = 'https://' + url
      } else {
        url = 'https://www.google.com/search?q=' + encodeURIComponent(q)
      }
    }
    window.ipc.invoke('browser:navigate', { tabId: activeId, url })
  }, [])

  const doSearch = useCallback((q: string) => {
    const trimmed = q.trim()
    if (!trimmed) return
    addSearchEntry(trimmed)
    navigate(trimmed)
    setValue('')
    setOpen(false)
  }, [navigate])

  const handleSubmit = () => {
    if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
      doSearch(suggestions[selectedIndex].query)
    } else {
      doSearch(value)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || suggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSubmit()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1))
        break
      case 'Enter':
        e.preventDefault()
        handleSubmit()
        break
      case 'Escape':
        e.preventDefault()
        setOpen(false)
        inputRef.current?.blur()
        break
      case 'Tab':
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          e.preventDefault()
          const completion = suggestions[selectedIndex].query
          setValue(completion)
          setSelectedIndex(-1)
        } else {
          const auto = getAutocomplete(value)
          if (auto) {
            e.preventDefault()
            setValue(auto)
          }
        }
        break
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setValue(v)

    if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
      const completion = suggestions[selectedIndex].query
      if (completion.toLowerCase().startsWith(v.toLowerCase()) && completion !== v) {
        return
      }
    }
  }

  const handleDeleteEntry = (query: string) => {
    const entries = JSON.parse(localStorage.getItem('cognix:searchHistory') || '[]').filter(
      (e: any) => e.query !== query
    )
    localStorage.setItem('cognix:searchHistory', JSON.stringify(entries))
    setSuggestions((prev) => prev.filter((e) => e.query !== query))
  }

  const handleClearAll = () => {
    clearHistory()
    setSuggestions([])
    setOpen(false)
  }

  const aiMode = useAiStore((s) => s.mode)
  const setAiMode = useAiStore((s) => s.setMode)
  const aiSendMessage = useAiStore((s) => s.sendMessage)

  const askAi = () => {
    const q = value.trim()
    setOpen(false)
    setAiMode('chat')
    if (q) {
      aiSendMessage(q)
      setValue('')
    }
  }

  useEffect(() => {
    if (aiMode === 'chat') {
      setOpen(false)
    }
  }, [aiMode])

  // Escape exits AI chat mode
  const originalHandleKeyDown = handleKeyDown
  const wrappedHandleKeyDown = (e: React.KeyboardEvent) => {
    if (aiMode === 'chat' && e.key === 'Escape') {
      e.preventDefault()
      setAiMode('search')
      inputRef.current?.focus()
      return
    }
    originalHandleKeyDown(e)
  }

  const handleSuggestionSelect = (query: string) => {
    doSearch(query)
  }

  if (minimal) {
    return (
      <button
        onClick={() => inputRef.current?.focus()}
        className="search-container flex items-center gap-2 px-4 h-10 rounded-full mt-3 text-text-muted hover:text-accent transition-colors"
      >
        <Search size={16} />
        <span className="text-sm">Search the web</span>
      </button>
    )
  }

  if (button) {
    return (
      <button
        onClick={() => {
          const q = window.prompt('Enter search or URL:')
          if (q) doSearch(q)
        }}
        className="search-container flex items-center gap-2 px-5 h-10 rounded-full mt-3 text-text-muted hover:text-accent hover:border-accent/30 transition-all"
      >
        <Search size={16} />
        <span className="text-sm">Quick Search</span>
      </button>
    )
  }

  if (compact) {
    return (
      <div ref={containerRef} className="relative w-[350px] max-w-[85vw]">
        <div className="search-container flex items-center gap-2 px-3.5 h-10 rounded-xl transition-all duration-200">
          <Search size={16} className="text-text-muted shrink-0" />
          <input
            ref={inputRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (value.trim() && suggestions.length > 0) setOpen(true)
            }}
            placeholder="Search..."
            className="flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
            autoComplete="off"
            spellCheck={false}
          />
          {value && (
            <button
              onClick={() => { setValue(''); setOpen(false); inputRef.current?.focus() }}
              className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-text-muted hover:text-text-secondary hover:bg-white/[0.06] transition-all"
            >
              <X size={13} />
            </button>
          )}
        </div>
        <SuggestionDropdown
          open={open}
          suggestions={suggestions}
          selectedIndex={selectedIndex}
          onSelect={(q) => doSearch(q)}
          onDelete={handleDeleteEntry}
          onClear={handleClearAll}
        />
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative w-[550px] max-w-[90vw]">
      {aiMode === 'chat' ? (
        <div className="search-container rounded-2xl overflow-hidden">
          <AiChatView onBack={() => setAiMode('search')} />
        </div>
      ) : (
        <>
          <div className="search-container flex items-center gap-3 px-5 h-14 rounded-2xl transition-all duration-200">
            <Search size={20} className="text-text-muted shrink-0" />
            <input
              ref={inputRef}
              value={value}
              onChange={handleChange}
              onKeyDown={wrappedHandleKeyDown}
              onFocus={() => {
                if (value.trim() && suggestions.length > 0) setOpen(true)
              }}
              placeholder="Search the web or type a URL..."
              className="flex-1 bg-transparent text-base text-text-primary outline-none placeholder:text-text-muted"
              autoComplete="off"
              spellCheck={false}
            />
            {value && (
              <button
                onClick={() => { setValue(''); setOpen(false); inputRef.current?.focus() }}
                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-secondary hover:bg-white/[0.06] transition-all"
              >
                <X size={16} />
              </button>
            )}
            <button
              onClick={handleSubmit}
              className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg text-text-muted hover:text-accent hover:bg-accent-glow transition-all"
            >
              <ArrowRight size={20} />
            </button>
          </div>
          <SuggestionDropdown
            open={open}
            suggestions={suggestions}
            selectedIndex={selectedIndex}
            onSelect={(q) => handleSuggestionSelect(q)}
            onDelete={handleDeleteEntry}
            onClear={handleClearAll}
            onAskAi={value.trim().length >= 2 ? askAi : undefined}
          />
        </>
      )}
    </div>
  )
}
