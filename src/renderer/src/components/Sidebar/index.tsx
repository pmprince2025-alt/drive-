import { useRef, useEffect } from 'react'
import { Plus, X, Settings as SettingsIcon } from 'lucide-react'
import { useTabsStore } from '../../store/tabs'
import logo from '../../assets/logo.png'

interface Props {
  onOpenSettings: () => void
}

export function Sidebar({ onOpenSettings }: Props): JSX.Element {
  const tabs = useTabsStore((s) => s.tabs)
  const activeTabId = useTabsStore((s) => s.activeTabId)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = listRef.current?.querySelector('[data-active="true"]')
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [activeTabId])

  return (
    <div className="relative flex flex-col w-[65px] h-full">
      <div className="absolute inset-0 sidebar-bg" />

      <div className="relative z-10 flex flex-col h-full">
        {/* Tab list */}
        <div ref={listRef} className="flex-1 overflow-y-auto py-2 px-1.5 space-y-1 scrollbar-none">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              data-active={tab.id === activeTabId}
              onClick={() => window.ipc.invoke('browser:switchTab', { tabId: tab.id })}
              className={`group relative flex items-center justify-center w-full h-10 rounded-xl cursor-pointer transition-all ${
                tab.id === activeTabId
                  ? 'sidebar-icon-active'
                  : 'hover:bg-white/[0.03]'
              }`}
            >
              {tab.isNewTab ? (
                <img src={logo} alt="" className="w-6 h-6 opacity-50" />
              ) : tab.favicon ? (
                <img src={tab.favicon} alt="" className="w-6 h-6 rounded-sm" />
              ) : (
                <div className="w-6 h-6 rounded-sm bg-bg-elevated flex items-center justify-center">
                  <span className="text-xs font-bold text-text-muted uppercase">{tab.title.charAt(0) || '?'}</span>
                </div>
              )}
              {tabs.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); window.ipc.invoke('browser:closeTab', { tabId: tab.id }) }}
                  className="absolute -top-0.5 -right-0.5 w-5 h-5 flex items-center justify-center rounded-full bg-bg-surface border border-[var(--border)] opacity-0 group-hover:opacity-100 hover:bg-error/20 transition-all"
                >
                  <X size={9} />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="mx-2 border-t border-[var(--border)]" />

        {/* Bottom actions */}
        <div className="flex flex-col items-center gap-0.5 px-1.5 py-2">
          <button
            onClick={() => window.ipc.invoke('browser:newTab')}
            className="flex items-center justify-center w-full h-9 rounded-xl text-text-muted hover:text-text-secondary hover:bg-white/5 transition-all"
            title="New Tab"
          >
            <Plus size={18} />
          </button>
          <button
            onClick={onOpenSettings}
            className="flex items-center justify-center w-full h-9 rounded-xl text-text-muted hover:text-text-secondary hover:bg-white/5 transition-all"
            title="Settings"
          >
            <SettingsIcon size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
