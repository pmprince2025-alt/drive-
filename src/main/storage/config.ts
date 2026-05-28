import Store from 'electron-store'

interface StoreSchema {
  bookmarks: { url: string; title: string; favicon: string; createdAt: number }[]
  history: { url: string; title: string; favicon: string; visitedAt: number }[]
  extensions: { id: string; path: string }[]
  sidebarPosition: 'left' | 'right'
  theme: 'dark' | 'light'
  fontSize: number
  groqApiKey: string
}

const store = new Store<StoreSchema>({
  defaults: {
    bookmarks: [],
    history: [],
    extensions: [],
    sidebarPosition: 'right',
    theme: 'dark',
    fontSize: 14,
    groqApiKey: ''
  }
})

export function getStore(): Store<StoreSchema> {
  return store
}
