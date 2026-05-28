export interface TabData {
  id: string
  url: string
  title: string
  favicon: string
  loading: boolean
}

export interface Bookmark {
  id: number
  url: string
  title: string
  favicon: string
  createdAt: number
}

export interface HistoryEntry {
  id: number
  url: string
  title: string
  favicon: string
  visitedAt: number
}

export interface AppSettings {
  sidebarPosition: 'left' | 'right'
  theme: 'dark' | 'light'
  fontSize: number
}
