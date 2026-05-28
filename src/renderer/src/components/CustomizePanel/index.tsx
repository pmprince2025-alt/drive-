import { useState } from 'react'
import { X, Plus, Trash2, Globe } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useThemeStore, THEMES, WALLPAPERS, WIDGET_CATEGORIES, type WidgetId } from '../../store/theme'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function CustomizePanel({ isOpen, onClose }: Props): JSX.Element {
  const theme = useThemeStore((s) => s.theme)
  const wallpaper = useThemeStore((s) => s.wallpaper)
  const widgets = useThemeStore((s) => s.widgets)
  const setTheme = useThemeStore((s) => s.setTheme)
  const setWallpaper = useThemeStore((s) => s.setWallpaper)
  const toggleWidget = useThemeStore((s) => s.toggleWidget)
  const setWidgetVariant = useThemeStore((s) => s.setWidgetVariant)

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
            className="absolute right-0 top-0 bottom-0 w-[360px] bg-bg-surface border-l border-[var(--border)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 h-16 border-b border-[var(--border)]">
              <h2 className="text-base font-semibold text-text-primary tracking-wide">Customize</h2>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-bg-elevated transition-colors">
                <X size={18} className="text-text-secondary" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto" style={{ height: 'calc(100% - 64px)' }}>
              {/* Themes */}
              <div>
                <label className="block text-sm font-medium text-text-secondary uppercase tracking-wider mb-3">Color Theme</label>
                <div className="grid grid-cols-3 gap-2.5">
                  {THEMES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={`flex flex-col items-center gap-2 px-2 py-3.5 rounded-xl transition-all ${
                        theme === t.id
                          ? 'border border-accent bg-accent-glow shadow-[0_0_12px_var(--accent-glow)]'
                          : 'border border-transparent hover:bg-bg-elevated'
                      }`}
                    >
                      <span className="text-2xl">{t.icon}</span>
                      <span className="text-xs text-text-primary font-medium">{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Wallpapers */}
              <div>
                <label className="block text-sm font-medium text-text-secondary uppercase tracking-wider mb-3">Wallpaper</label>
                <div className="grid grid-cols-3 gap-2.5">
                  {WALLPAPERS.map((w) => (
                    <button
                      key={w.id}
                      onClick={() => setWallpaper(w.id)}
                      className={`flex flex-col items-center gap-2 px-2 py-3.5 rounded-xl transition-all ${
                        wallpaper === w.id
                          ? 'border border-accent bg-accent-glow shadow-[0_0_12px_var(--accent-glow)]'
                          : 'border border-transparent hover:bg-bg-elevated'
                      }`}
                    >
                      <span className="text-2xl">{w.icon}</span>
                      <span className="text-xs text-text-primary font-medium">{w.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Widgets */}
              <div>
                <label className="block text-sm font-medium text-text-secondary uppercase tracking-wider mb-3">Widgets</label>
                <div className="space-y-3">
                  {WIDGET_CATEGORIES.map((cat) => {
                    const wc = widgets[cat.id]
                    return (
                      <div key={cat.id} className="rounded-xl border border-[var(--border)] overflow-hidden">
                        {/* Toggle header */}
                        <button
                          onClick={() => toggleWidget(cat.id as WidgetId)}
                          className={`flex items-center gap-3 w-full px-4 py-3 transition-all ${
                            wc.enabled ? 'bg-accent-glow' : 'hover:bg-bg-elevated'
                          }`}
                        >
                          <span className="text-xl">{cat.icon}</span>
                          <span className="flex-1 text-left text-base text-text-primary font-medium">{cat.name}</span>
                          <div className={`w-5 h-5 rounded border transition-colors flex items-center justify-center ${wc.enabled ? 'bg-accent border-accent' : 'border-text-muted'}`}>
                            {wc.enabled && (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </div>
                        </button>

                        {/* Variants (shown when enabled) */}
                        {wc.enabled && (
                          <div className="grid grid-cols-5 gap-1 px-3 pb-3">
                            {cat.variants.map((v) => (
                              <button
                                key={v.id}
                                onClick={() => setWidgetVariant(cat.id as WidgetId, v.id)}
                                className={`flex flex-col items-center gap-1 px-1 py-2 rounded-lg transition-all ${
                                  wc.variant === v.id
                                    ? 'bg-accent/20 text-accent'
                                    : 'text-text-muted hover:text-text-secondary hover:bg-bg-elevated'
                                }`}
                              >
                                <span className="text-base">{v.icon}</span>
                                <span className="text-[10px] leading-tight text-center">{v.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Quick Links Editor */}
              <QuickLinksEditor />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function QuickLinksEditor() {
  const customLinks = useThemeStore((s) => s.customLinks)
  const hiddenDefaultLinks = useThemeStore((s) => s.hiddenDefaultLinks)
  const addCustomLink = useThemeStore((s) => s.addCustomLink)
  const removeCustomLink = useThemeStore((s) => s.removeCustomLink)
  const toggleDefaultLink = useThemeStore((s) => s.toggleDefaultLink)
  const [label, setLabel] = useState('')
  const [url, setUrl] = useState('')
  const [adding, setAdding] = useState(false)

  const handleAdd = () => {
    if (!label.trim() || !url.trim()) return
    let finalUrl = url.trim()
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl
    }
    addCustomLink({ label: label.trim(), url: finalUrl })
    setLabel('')
    setUrl('')
    setAdding(false)
  }

  return (
    <div>
      <label className="block text-sm font-medium text-text-secondary uppercase tracking-wider mb-3">
        Quick Links
      </label>
      <div className="rounded-xl border border-[var(--border)] overflow-hidden">
        {customLinks.length > 0 && (
          <div className="divide-y divide-[var(--border)]">
            {customLinks.map((link) => (
              <div key={link.url} className="flex items-center gap-3 px-4 py-2.5 group">
                <Globe size={14} className="text-text-muted shrink-0" />
                <span className="flex-1 text-sm text-text-primary truncate">{link.label}</span>
                <span className="text-[11px] text-text-muted truncate max-w-[120px] hidden sm:block">{link.url}</span>
                <button
                  onClick={() => removeCustomLink(link.url)}
                  className="shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {adding ? (
          <div className="p-3 space-y-2 border-t border-[var(--border)]">
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Label (e.g. My Site)"
              className="w-full px-3 py-2 rounded-lg bg-bg-elevated text-sm text-text-primary outline-none border border-[var(--border)] focus:border-accent/50 transition-colors placeholder:text-text-muted"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="URL (e.g. example.com)"
              className="w-full px-3 py-2 rounded-lg bg-bg-elevated text-sm text-text-primary outline-none border border-[var(--border)] focus:border-accent/50 transition-colors placeholder:text-text-muted"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleAdd}
                className="flex-1 px-3 py-1.5 rounded-lg bg-accent/20 text-accent text-sm font-medium hover:bg-accent/30 transition-all"
              >
                Add
              </button>
              <button
                onClick={() => setAdding(false)}
                className="px-3 py-1.5 rounded-lg text-text-muted text-sm hover:bg-bg-elevated transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-2 w-full px-4 py-3 text-sm text-text-muted hover:text-accent hover:bg-accent-glow transition-all"
          >
            <Plus size={14} />
            Add custom link
          </button>
        )}
        {hiddenDefaultLinks.length > 0 && (
          <button
            onClick={() => hiddenDefaultLinks.forEach((u) => toggleDefaultLink(u))}
            className="flex items-center gap-2 w-full px-4 py-2.5 text-xs text-text-muted hover:text-accent border-t border-[var(--border)] transition-all"
          >
            Reset removed default links ({hiddenDefaultLinks.length})
          </button>
        )}
      </div>
    </div>
  )
}
