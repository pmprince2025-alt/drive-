import { create } from 'zustand'

export type ThemeId = 'neon' | 'midnight' | 'sunset' | 'forest' | 'ocean' | 'monochrome' | 'light'
export type WallpaperId = 'mountains' | 'waves' | 'grid' | 'nebula' | 'solid'
export type WidgetId = 'clock' | 'greeting' | 'search' | 'quicklinks' | 'weather'

export interface WidgetConfig {
  clock: { enabled: boolean; variant: string }
  greeting: { enabled: boolean; variant: string }
  search: { enabled: boolean; variant: string }
  quicklinks: { enabled: boolean; variant: string }
  weather: { enabled: boolean; variant: string }
}

export interface ThemePreset {
  id: ThemeId
  name: string
  icon: string
  label: string
}

export interface WidgetCategory {
  id: WidgetId
  name: string
  icon: string
  variants: { id: string; name: string; icon: string }[]
}

export interface QuickLink {
  label: string
  url: string
}

interface ThemeState {
  theme: ThemeId
  wallpaper: WallpaperId
  widgets: WidgetConfig
  customizeOpen: boolean
  customLinks: QuickLink[]
  hiddenDefaultLinks: string[]
  setTheme: (t: ThemeId) => void
  setWallpaper: (w: WallpaperId) => void
  toggleWidget: (id: WidgetId) => void
  setWidgetVariant: (id: WidgetId, variant: string) => void
  setCustomizeOpen: (open: boolean) => void
  addCustomLink: (link: QuickLink) => void
  removeCustomLink: (url: string) => void
  toggleDefaultLink: (url: string) => void
}

const DEFAULT_WIDGETS: WidgetConfig = {
  clock: { enabled: true, variant: 'digital' },
  greeting: { enabled: true, variant: 'simple' },
  search: { enabled: true, variant: 'bar' },
  quicklinks: { enabled: true, variant: 'cards' },
  weather: { enabled: true, variant: 'full' }
}

export const WIDGET_CATEGORIES: WidgetCategory[] = [
  {
    id: 'clock',
    name: 'Clock',
    icon: '🕐',
    variants: [
      { id: 'digital', name: 'Digital', icon: '🔢' },
      { id: 'analog', name: 'Analog', icon: '🕰️' },
      { id: 'flip', name: 'Flip', icon: '🔄' },
      { id: 'binary', name: 'Binary', icon: '💻' },
      { id: 'minimal', name: 'Minimal', icon: '◻️' }
    ]
  },
  {
    id: 'greeting',
    name: 'Greeting',
    icon: '👋',
    variants: [
      { id: 'simple', name: 'Simple', icon: '👋' },
      { id: 'poetic', name: 'Poetic', icon: '📝' },
      { id: 'motivational', name: 'Motivational', icon: '💪' },
      { id: 'timebased', name: 'Time Detail', icon: '⏳' },
      { id: 'minimal', name: 'Minimal', icon: '☺️' }
    ]
  },
  {
    id: 'search',
    name: 'Search',
    icon: '🔍',
    variants: [
      { id: 'bar', name: 'Search Bar', icon: '🔍' },
      { id: 'compact', name: 'Compact', icon: '🔎' },
      { id: 'minimal', name: 'Minimal', icon: '⚡' },
      { id: 'button', name: 'Button Only', icon: '🔘' },
      { id: 'suggestions', name: 'With Suggestions', icon: '💡' }
    ]
  },
  {
    id: 'quicklinks',
    name: 'Quick Links',
    icon: '🔗',
    variants: [
      { id: 'cards', name: 'Cards', icon: '🃏' },
      { id: 'list', name: 'List', icon: '📋' },
      { id: 'icons', name: 'Icons Only', icon: '🎯' },
      { id: 'dock', name: 'Dock', icon: '⏹️' },
      { id: 'compact', name: 'Compact Grid', icon: '🔲' }
    ]
  },
  {
    id: 'weather',
    name: 'Weather',
    icon: '🌤️',
    variants: [
      { id: 'full', name: 'Full', icon: '🌤️' },
      { id: 'minimal', name: 'Minimal', icon: '🌡️' },
      { id: 'detailed', name: 'Detailed', icon: '📊' },
      { id: 'compact', name: 'Compact', icon: '☀️' },
      { id: 'icon', name: 'Icon Only', icon: '🌞' }
    ]
  }
]

function loadSaved<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`cognix:${key}`)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function save(key: string, val: unknown) {
  localStorage.setItem(`cognix:${key}`, JSON.stringify(val))
}

function migrateWidgets(raw: unknown): WidgetConfig {
  if (!raw || typeof raw !== 'object') return DEFAULT_WIDGETS
  const r = raw as Record<string, unknown>
  const out = { ...DEFAULT_WIDGETS }
  for (const key of Object.keys(DEFAULT_WIDGETS) as WidgetId[]) {
    const val = r[key]
    if (val && typeof val === 'object' && 'enabled' in (val as any)) {
      out[key] = val as { enabled: boolean; variant: string }
    } else if (typeof val === 'boolean') {
      out[key] = { enabled: val, variant: DEFAULT_WIDGETS[key].variant }
    }
  }
  return out
}

export const THEMES: ThemePreset[] = [
  { id: 'neon', name: 'Neon', icon: '💚', label: 'Black & neon green' },
  { id: 'midnight', name: 'Midnight', icon: '🔵', label: 'Deep blue & blue' },
  { id: 'sunset', name: 'Sunset', icon: '🧡', label: 'Dark warm & orange' },
  { id: 'forest', name: 'Forest', icon: '🌿', label: 'Deep green & green' },
  { id: 'ocean', name: 'Ocean', icon: '🌊', label: 'Dark teal & cyan' },
  { id: 'monochrome', name: 'Monochrome', icon: '⚪', label: 'Gray & white' },
  { id: 'light', name: 'Light', icon: '☀️', label: 'Light cream & navy' }
]

export const WALLPAPERS: { id: WallpaperId; name: string; icon: string }[] = [
  { id: 'mountains', name: 'Mountains', icon: '🏔️' },
  { id: 'waves', name: 'Waves', icon: '〰️' },
  { id: 'grid', name: 'Grid', icon: '🔲' },
  { id: 'nebula', name: 'Nebula', icon: '🌌' },
  { id: 'solid', name: 'Solid', icon: '⬛' }
]

export const useThemeStore = create<ThemeState>((set) => {
  const initialTheme = loadSaved<ThemeId>('theme', 'neon')
  const initialWallpaper = loadSaved<WallpaperId>('wallpaper', 'mountains')
  const initialWidgets = migrateWidgets(loadSaved<unknown>('widgets', DEFAULT_WIDGETS))
  const initialLinks = loadSaved<QuickLink[]>('customLinks', [])
  const initialHidden = loadSaved<string[]>('hiddenDefaultLinks', [])

  const applyTheme = (theme: ThemeId) => {
    document.documentElement.setAttribute('data-theme', theme)
  }
  const applyWallpaper = (w: WallpaperId) => {
    document.documentElement.setAttribute('data-wallpaper', w)
  }
  applyTheme(initialTheme)
  applyWallpaper(initialWallpaper)

  return {
    theme: initialTheme,
    wallpaper: initialWallpaper,
    widgets: initialWidgets,
    customLinks: initialLinks,
    hiddenDefaultLinks: initialHidden,
    customizeOpen: false,
    setTheme: (t) => {
      applyTheme(t)
      save('theme', t)
      set({ theme: t })
    },
    setWallpaper: (w) => {
      document.documentElement.setAttribute('data-wallpaper', w)
      save('wallpaper', w)
      set({ wallpaper: w })
    },
    toggleWidget: (id) => {
      set((s) => {
        const current = s.widgets[id]
        const widgets = { ...s.widgets, [id]: { ...current, enabled: !current.enabled } }
        save('widgets', widgets)
        return { widgets }
      })
    },
    setWidgetVariant: (id, variant) => {
      set((s) => {
        const current = s.widgets[id]
        const widgets = { ...s.widgets, [id]: { ...current, variant } }
        save('widgets', widgets)
        return { widgets }
      })
    },
    setCustomizeOpen: (open) => set({ customizeOpen: open }),
    addCustomLink: (link) => {
      set((s) => {
        const existing = s.customLinks.find((l) => l.url === link.url)
        if (existing) return s
        const customLinks = [...s.customLinks, link]
        save('customLinks', customLinks)
        return { customLinks }
      })
    },
    removeCustomLink: (url) => {
      set((s) => {
        const customLinks = s.customLinks.filter((l) => l.url !== url)
        save('customLinks', customLinks)
        return { customLinks }
      })
    },
    toggleDefaultLink: (url) => {
      set((s) => {
        const hidden = s.hiddenDefaultLinks.includes(url)
          ? s.hiddenDefaultLinks.filter((u) => u !== url)
          : [...s.hiddenDefaultLinks, url]
        save('hiddenDefaultLinks', hidden)
        return { hiddenDefaultLinks: hidden }
      })
    }
  }
})
