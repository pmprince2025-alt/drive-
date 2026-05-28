import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Puzzle, Trash2, FolderOpen, RotateCw, Sparkles, Eye, EyeOff } from 'lucide-react'
import { useTabsStore } from '../../store/tabs'
import { useAiStore } from '../../store/ai'
import logo from '../../assets/logo.png'

interface Props {
  isOpen: boolean
  onClose: () => void
}

interface ExtensionInfo {
  id: string
  name: string
  version: string
}

export function Settings({ isOpen, onClose }: Props): JSX.Element {
  const [extensions, setExtensions] = useState<ExtensionInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [installing, setInstalling] = useState(false)
  const [error, setError] = useState('')
  const [extUrl, setExtUrl] = useState('')

  useEffect(() => {
    if (isOpen) {
      window.ipc.invoke<ExtensionInfo[]>('extensions:list').then(setExtensions).catch(() => {})
    }
  }, [isOpen])

  const handleLoadExtension = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const path = await window.ipc.invoke<string | null>('extensions:pick')
      if (!path) { setLoading(false); return }
      const result = await window.ipc.invoke<ExtensionInfo & { error?: string }>('extensions:load', { path })
      if (result.error) {
        setError(result.error)
      } else {
        setExtensions((prev) => [...prev, { id: result.id, name: result.name, version: result.version }])
      }
    } catch (err) {
      setError((err as Error).message)
    }
    setLoading(false)
  }, [])

  const handleInstallFromStore = useCallback(async () => {
    if (!extUrl.trim()) return
    setInstalling(true)
    setError('')
    try {
      const result = await window.ipc.invoke<ExtensionInfo & { error?: string }>('extensions:installFromStore', { url: extUrl })
      if (result.error) {
        setError(result.error)
      } else {
        setExtensions((prev) => [...prev, { id: result.id, name: result.name, version: result.version }])
        setExtUrl('')
      }
    } catch (err) {
      setError((err as Error).message)
    }
    setInstalling(false)
  }, [extUrl])

  const handleUnload = useCallback(async (id: string) => {
    await window.ipc.invoke('extensions:unload', { id })
    setExtensions((prev) => prev.filter((e) => e.id !== id))
  }, [])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute right-0 top-0 bottom-0 w-[400px] bg-bg-surface border-l border-[var(--border)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 h-16 border-b border-[var(--border)]">
              <h2 className="text-base font-semibold text-text-primary tracking-wide">Settings</h2>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-bg-elevated transition-colors">
                <X size={18} className="text-text-secondary" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto" style={{ height: 'calc(100% - 64px)' }}>
              <div>
                <label className="block text-sm font-medium text-text-secondary uppercase tracking-wider mb-3">Theme</label>
                <select className="w-full px-4 py-2.5 rounded-lg bg-bg-elevated border border-[var(--border)] text-base text-text-primary outline-none focus:border-accent transition-colors">
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary uppercase tracking-wider mb-3">Sidebar Position</label>
                <select className="w-full px-4 py-2.5 rounded-lg bg-bg-elevated border border-[var(--border)] text-base text-text-primary outline-none focus:border-accent transition-colors">
                  <option value="right">Right</option>
                  <option value="left">Left</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary uppercase tracking-wider mb-3">Font Size</label>
                <input
                  type="range"
                  min="12"
                  max="20"
                  defaultValue="14"
                  className="w-full accent-accent"
                />
                <span className="text-sm text-text-muted mt-1 block">14px</span>
              </div>

              <div className="pt-5 border-t border-[var(--border)]">
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm font-medium text-text-secondary uppercase tracking-wider">Extensions</label>
                  <Puzzle size={16} className="text-accent" />
                </div>

                <div className="flex gap-2 mb-3">
                  <button
                    onClick={handleLoadExtension}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-accent/10 text-accent text-base hover:bg-accent/20 transition-colors disabled:opacity-50"
                  >
                    <FolderOpen size={16} />
                    {loading ? '...' : 'Load from File'}
                  </button>
                  <button
                    onClick={async () => {
                      const url = await window.ipc.invoke<string>('extensions:openStore')
                      const tabId = useTabsStore.getState().activeTabId
                      if (tabId) {
                        window.ipc.invoke('browser:navigate', { tabId, url })
                        onClose()
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-accent/10 text-accent text-base hover:bg-accent/20 transition-colors"
                  >
                    Browse Store
                  </button>
                </div>

                <div className="flex gap-2 mb-3">
                  <input
                    value={extUrl}
                    onChange={(e) => setExtUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleInstallFromStore()}
                    placeholder="Paste extension URL or ID..."
                    className="flex-1 px-4 py-2.5 rounded-lg bg-bg-elevated border border-[var(--border)] text-base text-text-primary outline-none focus:border-accent transition-colors placeholder:text-text-muted"
                  />
                  <button
                    onClick={handleInstallFromStore}
                    disabled={installing}
                    className="px-4 py-2.5 rounded-lg bg-accent text-black text-base font-medium hover:brightness-110 transition-all disabled:opacity-50 shrink-0"
                  >
                    {installing ? '...' : 'Install'}
                  </button>
                </div>

                {error && (
                  <p className="text-sm text-error mb-2 break-words">{error}</p>
                )}

                <div className="space-y-2">
                  {extensions.map((ext) => (
                    <div
                      key={ext.id}
                      className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-bg-elevated border border-[var(--border)]"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-base text-text-primary truncate">{ext.name}</p>
                        <p className="text-sm text-text-muted">v{ext.version}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={async () => {
                            await window.ipc.invoke('extensions:reload', { id: ext.id })
                            const tabId = useTabsStore.getState().activeTabId
                            if (tabId) window.ipc.invoke('browser:reload', { tabId })
                          }}
                          className="p-2 rounded hover:bg-accent/10 text-text-muted hover:text-accent transition-colors"
                          title="Reload extension & page"
                        >
                          <RotateCw size={14} />
                        </button>
                        <button
                          onClick={() => handleUnload(ext.id)}
                          className="p-2 rounded hover:bg-error/20 text-text-muted hover:text-error transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {extensions.length === 0 && (
                    <p className="text-sm text-text-muted text-center py-3">No extensions loaded</p>
                  )}
                </div>
              </div>

              <div className="pt-5 border-t border-[var(--border)]">
                <AiSettings />
              </div>

              <div className="pt-5 border-t border-[var(--border)]">
                <button
                  onClick={async () => {
                    await window.ipc.invoke('storage:getHistory')
                    onClose()
                  }}
                  className="w-full px-4 py-2.5 rounded-lg bg-error/10 text-error text-base hover:bg-error/20 transition-colors"
                >
                  Clear History
                </button>
              </div>

              <div className="pt-5 border-t border-[var(--border)]">
                <p className="text-sm text-text-muted leading-relaxed">
                  <img src={logo} alt="Cognix" className="h-4 w-auto inline opacity-50" /> v1.0.0<br />
                  Built with Electron + React
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function AiSettings() {
  const [key, setKey] = useState('')
  const [saved, setSaved] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const { clearChat, messages } = useAiStore()
  const hasKey = !!key.trim()

  useEffect(() => {
    window.ipc.invoke<{ key: string }>('ai:getKey').then((r) => setKey(r.key || '')).catch(() => {})
  }, [])

  const handleSave = async () => {
    await window.ipc.invoke('ai:setKey', key.trim())
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <label className="text-sm font-medium text-text-secondary uppercase tracking-wider">AI (Groq)</label>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1 text-[11px] ${hasKey ? 'text-green-400' : 'text-text-muted'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${hasKey ? 'bg-green-400' : 'bg-text-muted'}`} />
            {hasKey ? 'Configured' : 'No key set'}
          </span>
          <Sparkles size={16} className="text-accent" />
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-text-muted mb-1 block">API Key</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showKey ? 'text' : 'password'}
                value={key}
                onChange={(e) => { setKey(e.target.value); setSaved(false) }}
                placeholder="gsk_..."
                className="w-full px-3 py-2 pr-9 rounded-lg bg-bg-elevated border border-[var(--border)] text-sm text-text-primary outline-none focus:border-accent/50 transition-colors placeholder:text-text-muted font-mono"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
              >
                {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <button
              onClick={handleSave}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                saved
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-accent/10 text-accent hover:bg-accent/20'
              }`}
            >
              {saved ? 'Saved' : 'Save'}
            </button>
          </div>
          <p className="text-[11px] text-text-muted mt-1.5 leading-relaxed">
            Get a free API key at{' '}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                const activeId = useTabsStore.getState().activeTabId
                if (activeId) window.ipc.invoke('browser:navigate', { tabId: activeId, url: 'https://console.groq.com/keys' })
              }}
              className="text-accent hover:underline"
            >
              console.groq.com/keys
            </a>
          </p>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-text-muted">Model: <span className="text-text-secondary">llama-3.1-70b-versatile</span></span>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-all"
            >
              <Trash2 size={11} />
              Clear chat
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
