import { useState, useCallback, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, RotateCw, Search, Star, Settings as SettingsIcon, Home, Check, Minus, Square, X } from 'lucide-react'
import { useTabsStore } from '../../store/tabs'
import { useThemeStore, type QuickLink } from '../../store/theme'
import logo from '../../assets/logo.png'

interface Props {
  onOpenSettings: () => void
  onToggleAiAssistant: () => void
  aiAssistantOpen: boolean
}

const isMac = navigator.platform.toLowerCase().includes('mac')

export function TopBar({ onOpenSettings, onToggleAiAssistant, aiAssistantOpen }: Props): JSX.Element {
  const activeTabId = useTabsStore((s) => s.activeTabId)
  const tabs = useTabsStore((s) => s.tabs)
  const activeTab = tabs.find((t) => t.id === activeTabId)
  const [urlInput, setUrlInput] = useState('')
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [added, setAdded] = useState(false)
  const addedTimer = useRef<ReturnType<typeof setTimeout>>()
  const inputRef = useRef<HTMLInputElement>(null)

  const showToast = (msg: string) => {
    clearTimeout(toastTimer.current)
    setToast(msg)
    toastTimer.current = setTimeout(() => setToast(''), 2000)
  }

  useEffect(() => {
    if (activeTab) {
      setUrlInput(activeTab.url === 'cognix://newtab' ? '' : activeTab.url)
      if (activeTab.url && activeTab.url !== 'cognix://newtab') {
        window.ipc.invoke('storage:isBookmarked', { url: activeTab.url }).then(setIsBookmarked)
      } else {
        setIsBookmarked(false)
      }
    }
  }, [activeTab?.url, activeTab?.id])

  const handleNavigate = useCallback(() => {
    if (!activeTabId || !urlInput.trim()) return
    let url = urlInput.trim()
    if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url
    window.ipc.invoke('browser:navigate', { tabId: activeTabId, url })
  }, [activeTabId, urlInput])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleNavigate()
  }, [handleNavigate])

  const handleGoBack = useCallback(() => {
    if (activeTabId) window.ipc.invoke('browser:goBack', { tabId: activeTabId })
  }, [activeTabId])

  const handleGoForward = useCallback(() => {
    if (activeTabId) window.ipc.invoke('browser:goForward', { tabId: activeTabId })
  }, [activeTabId])

  const handleReload = useCallback(() => {
    if (activeTabId) window.ipc.invoke('browser:reload', { tabId: activeTabId })
  }, [activeTabId])

  const handleToggleBookmark = useCallback(async () => {
    if (!activeTab || activeTab.url === 'cognix://newtab') return
    if (isBookmarked) {
      await window.ipc.invoke('storage:removeBookmark', { url: activeTab.url })
      setIsBookmarked(false)
    } else {
      await window.ipc.invoke('storage:addBookmark', { url: activeTab.url, title: activeTab.title, favicon: activeTab.favicon })
      setIsBookmarked(true)
    }
  }, [activeTab, isBookmarked])

  return (
    <div className={`flex items-center h-10 px-3 gap-2 bg-black/40 border-b border-white/[0.03] ${isMac ? 'pl-20' : ''}`}>
      {/* Nav controls */}
      <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <button onClick={handleGoBack} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5 text-text-muted hover:text-text-secondary transition-all">
          <ChevronLeft size={14} />
        </button>
        <button onClick={handleGoForward} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5 text-text-muted hover:text-text-secondary transition-all">
          <ChevronRight size={14} />
        </button>
        <button onClick={handleReload} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5 text-text-muted hover:text-text-secondary transition-all">
          <RotateCw size={13} />
        </button>
      </div>

      {/* Brand */}
      <div className="flex items-center gap-1 ml-1" style={{ WebkitAppRegion: 'drag' } as any}>
        <img src={logo} alt="Cognix" className="h-5 w-auto" />
      </div>

      {/* URL bar */}
      <div className="flex-1 flex justify-center" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <div className="glass-panel flex items-center gap-1.5 w-[45%] min-w-[200px] px-3 h-7 rounded-full">
          <Search size={12} className="text-text-muted shrink-0" />
          <input
            ref={inputRef}
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search or enter URL..."
            className="flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
          />
          {activeTab && activeTab.url !== 'cognix://newtab' && (
            <>
              <button
                onClick={() => {
                  const url = activeTab.url
                  const label = activeTab.title || url
                  if (!url || url === 'cognix://newtab') return
                  const existing = useThemeStore.getState().customLinks
                  if (!existing.find((l) => l.url === url)) {
                    const newLinks = [...existing, { url, label } as QuickLink]
                    useThemeStore.setState({ customLinks: newLinks })
                    localStorage.setItem('cognix:customLinks', JSON.stringify(newLinks))
                  }
                  setAdded(true)
                  clearTimeout(addedTimer.current)
                  addedTimer.current = setTimeout(() => setAdded(false), 1200)
                }}
                className="p-0.5 rounded transition-all text-text-muted hover:text-accent"
                title="Add to Home screen"
              >
                {added ? <Check size={13} className="text-accent" /> : <Home size={13} />}
              </button>
              <button onClick={handleToggleBookmark} className={`p-0.5 rounded transition-colors ${isBookmarked ? 'text-accent' : 'text-text-muted hover:text-text-secondary'}`}>
                <Star size={13} fill={isBookmarked ? 'currentColor' : 'none'} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <button
          onClick={onToggleAiAssistant}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5 text-text-muted hover:text-accent transition-all"
          title="AI Page Assistant"
        >
          {aiAssistantOpen ? <X size={14} /> : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3a6 6 0 0 0-6 6c0 4 6 10 6 10s6-6 6-10a6 6 0 0 0-6-6z" />
              <circle cx="12" cy="9" r="2" />
            </svg>
          )}
        </button>
        <button onClick={onOpenSettings} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5 text-text-muted hover:text-text-secondary transition-all">
          <SettingsIcon size={14} />
        </button>

        {!isMac && (
          <>
            <button onClick={() => window.ipc.invoke('window:minimize')} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5 text-text-muted hover:text-text-secondary transition-all">
              <Minus size={12} />
            </button>
            <button onClick={() => window.ipc.invoke('window:maximize')} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5 text-text-muted hover:text-text-secondary transition-all">
              <Square size={10} />
            </button>
            <button onClick={() => window.ipc.invoke('window:close')} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-error/20 text-text-muted hover:text-error transition-all">
              <X size={12} />
            </button>
          </>
        )}
      </div>

    </div>
  )
}
