import { useState, useEffect, useCallback, useRef } from 'react'
import { TopBar } from './components/TopBar'
import { Sidebar } from './components/Sidebar'
import { NewTab } from './components/NewTab'
import { CommandPalette } from './components/CommandPalette'
import { Settings } from './components/Settings'
import { CustomizePanel } from './components/CustomizePanel'
import { AiPageAssistant } from './components/TopBar/AiPageAssistant'
import { UpdateBanner } from './components/UpdateBanner'
import { useTabsStore } from './store/tabs'
import { useThemeStore } from './store/theme'
import { useKeyboard } from './hooks/useKeyboard'

function App(): JSX.Element {
  const setTabs = useTabsStore((s) => s.setTabs)
  const tabs = useTabsStore((s) => s.tabs)
  const activeTabId = useTabsStore((s) => s.activeTabId)
  const activeTab = tabs.find((t) => t.id === activeTabId)
  const [paletteOpen, _setPaletteOpen] = useState(false)
  const [settingsOpen, _setSettingsOpen] = useState(false)
  const customizeOpen = useThemeStore((s) => s.customizeOpen)
  const setCustomizeOpen = useThemeStore((s) => s.setCustomizeOpen)
  const [topBarVisible, setTopBarVisible] = useState(false)
  const [sidebarVisible, setSidebarVisibleState] = useState(false)
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false)
  const [updateInfo, setUpdateInfo] = useState<{ status: string; info?: any; progress?: any; error?: string } | null>(null)
  const topBarTimer = useRef<ReturnType<typeof setTimeout>>()
  const sidebarTimer = useRef<ReturnType<typeof setTimeout>>()

  const showTopBar = useCallback(() => {
    clearTimeout(topBarTimer.current)
    setTopBarVisible(true)
    window.ipc.invoke('browser:setTopBarVisible', { visible: true })
    window.ipc.invoke('window:maximize')
  }, [])

  const hideTopBar = useCallback(() => {
    topBarTimer.current = setTimeout(() => {
      setTopBarVisible(false)
      window.ipc.invoke('browser:setTopBarVisible', { visible: false })
    }, 400)
  }, [])

  const showSidebar = useCallback(() => {
    clearTimeout(sidebarTimer.current)
    setSidebarVisibleState(true)
    window.ipc.invoke('sidebar:setVisible', { visible: true })
  }, [])

  const hideSidebar = useCallback(() => {
    sidebarTimer.current = setTimeout(() => {
      setSidebarVisibleState(false)
      window.ipc.invoke('sidebar:setVisible', { visible: false })
    }, 400)
  }, [])

  const setPaletteOpen = (open: boolean) => {
    _setPaletteOpen(open)
    if (open) window.ipc.invoke('browser:hideView')
    else if (!settingsOpen) window.ipc.invoke('browser:showView')
  }

  const setSettingsOpen = (open: boolean) => {
    _setSettingsOpen(open)
    if (open) window.ipc.invoke('browser:hideView')
    else if (!paletteOpen) window.ipc.invoke('browser:showView')
  }

  useEffect(() => {
    window.ipc.invoke('browser:getState').then((data) => {
      const { tabs, activeTabId } = data as { tabs: any[]; activeTabId: string | null }
      if (tabs.length > 0) setTabs(tabs, activeTabId)
    })

    const remove = window.ipc.on('tab:updated', (data) => {
      const { tabs, activeTabId } = data as { tabs: any[]; activeTabId: string | null }
      setTabs(tabs, activeTabId)
      const tab = tabs.find((t: any) => t.id === activeTabId)
      if (tab && tab.url && tab.url !== 'cognix://newtab' && !tab.url.startsWith('about:')) {
        window.ipc.invoke('storage:addHistory', { url: tab.url, title: tab.title, favicon: tab.favicon })
      }
    })
    return () => remove()
  }, [setTabs])

  const handleNewTab = useCallback(() => window.ipc.invoke('browser:newTab'), [])
  const handleCloseTab = useCallback(() => { if (activeTabId) window.ipc.invoke('browser:closeTab', { tabId: activeTabId }) }, [activeTabId])
  const handleReload = useCallback(() => { if (activeTabId) window.ipc.invoke('browser:reload', { tabId: activeTabId }) }, [activeTabId])

  useKeyboard({
    'Cmd+K': () => setPaletteOpen(true),
    'Cmd+T': () => handleNewTab(),
    'Cmd+W': () => handleCloseTab(),
    'Cmd+L': () => { const i = document.querySelector('input[type="text"]') as HTMLInputElement; i?.focus(); i?.select() },
    'Cmd+R': () => handleReload(),
    'Escape': () => {
      if (settingsOpen || paletteOpen || customizeOpen) {
        _setSettingsOpen(false); _setPaletteOpen(false); setCustomizeOpen(false)
        window.ipc.invoke('browser:showView')
      }
    }
  })

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F12') {
        e.preventDefault()
        window.ipc.invoke('devtools:open')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    const remove = window.ipc.on('homescreen:add', (data) => {
      const { url, title } = data as { url: string; title: string }
      useThemeStore.getState().addCustomLink({ url, label: title || url })
    })
    return () => remove()
  }, [])

  useEffect(() => {
    const remove = window.ipc.on('update:status', (data) => {
      setUpdateInfo(data as any)
    })
    return () => remove()
  }, [])

  const showNewTab = activeTab?.isNewTab

  return (
    <div className="h-screen w-screen bg-bg-base text-text-primary overflow-hidden relative">

      {/* Left trigger strip for sidebar */}
      <div
        className="fixed left-0 top-0 bottom-0 z-50 w-[10px] cursor-default"
        style={{ WebkitAppRegion: 'no-drag' } as any}
        onMouseEnter={showSidebar}
        onMouseLeave={hideSidebar}
      />

      {/* Sidebar - slides in/out from left */}
      <div
        onMouseEnter={showSidebar}
        onMouseLeave={hideSidebar}
        className={`fixed left-0 top-0 bottom-0 z-30 w-[65px] transition-transform duration-150 ease-out ${
          sidebarVisible ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar onOpenSettings={() => setSettingsOpen(true)} />
      </div>

      {/* Top bar area - offset depends on sidebar visibility */}
      <div className={`fixed top-0 right-0 z-40 ${
        sidebarVisible ? 'left-[65px]' : 'left-0'
      }`}>
        {/* Invisible trigger strip */}
        <div
          className="relative z-10 h-[10px] w-full cursor-default"
          onMouseEnter={showTopBar}
        />

        {/* Sliding top bar */}
        <div
          onMouseEnter={showTopBar}
          onMouseLeave={hideTopBar}
          className={`absolute top-0 left-0 right-0 transition-transform duration-150 ease-out ${
            topBarVisible ? 'translate-y-0' : '-translate-y-full'
          }`}
        >
          <TopBar onOpenSettings={() => setSettingsOpen(true)} onToggleAiAssistant={() => setAiAssistantOpen(!aiAssistantOpen)} aiAssistantOpen={aiAssistantOpen} />
        </div>
      </div>

      {/* Main content area - padding depends on sidebar visibility */}
      <div className={`h-full ${
        sidebarVisible ? 'pl-[65px]' : 'pl-0'
      }`}>
        <div className="relative w-full h-full">
          <div id="browser-view-container" className="absolute inset-0" />
          {showNewTab && <NewTab />}
        </div>
      </div>

      {/* Overlays */}
      <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <Settings isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <CustomizePanel isOpen={customizeOpen} onClose={() => setCustomizeOpen(false)} />
      <AiPageAssistant open={aiAssistantOpen} onClose={() => setAiAssistantOpen(false)} />
      <UpdateBanner update={updateInfo} onDismiss={() => setUpdateInfo(null)} />
    </div>
  )
}

export default App
