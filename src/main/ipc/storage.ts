import { ipcMain } from 'electron'
import { getStore } from '../storage/config'

export function registerStorageIPC(): void {
  const store = getStore()

  ipcMain.handle('storage:getHistory', () => {
    const history = store.get('history')
    return history.slice(-50).reverse()
  })

  ipcMain.handle('storage:addHistory', (_, entry: { url: string; title: string; favicon: string }) => {
    const history = store.get('history')
    history.push({ ...entry, visitedAt: Date.now() })
    if (history.length > 500) {
      store.set('history', history.slice(-500))
    } else {
      store.set('history', history)
    }
  })

  ipcMain.handle('storage:getBookmarks', () => {
    return store.get('bookmarks')
  })

  ipcMain.handle('storage:addBookmark', (_, entry: { url: string; title: string; favicon: string }) => {
    const bookmarks = store.get('bookmarks')
    const exists = bookmarks.some((b) => b.url === entry.url)
    if (!exists) {
      bookmarks.push({ ...entry, createdAt: Date.now() })
      store.set('bookmarks', bookmarks)
    }
  })

  ipcMain.handle('storage:removeBookmark', (_, { url }: { url: string }) => {
    const bookmarks = store.get('bookmarks')
    store.set('bookmarks', bookmarks.filter((b) => b.url !== url))
  })

  ipcMain.handle('storage:isBookmarked', (_, { url }: { url: string }) => {
    const bookmarks = store.get('bookmarks')
    return bookmarks.some((b) => b.url === url)
  })
}
