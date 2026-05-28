import { create } from 'zustand'

interface TabInfo {
  id: string
  url: string
  title: string
  favicon: string
  loading: boolean
  isNewTab?: boolean
}

interface TabsStore {
  tabs: TabInfo[]
  activeTabId: string | null
  setTabs: (tabs: TabInfo[], activeTabId: string | null) => void
  updateTab: (id: string, patch: Partial<TabInfo>) => void
  setActiveTab: (id: string) => void
}

export const useTabsStore = create<TabsStore>((set) => ({
  tabs: [],
  activeTabId: null,
  setTabs: (tabs, activeTabId) => set({ tabs, activeTabId }),
  updateTab: (id, patch) =>
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === id ? { ...t, ...patch } : t))
    })),
  setActiveTab: (id) => set({ activeTabId: id })
}))
