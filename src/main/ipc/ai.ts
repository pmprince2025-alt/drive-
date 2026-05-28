import { ipcMain, BrowserWindow } from 'electron'
import { chatCompletion, abortChat, summarizeContent, askAboutContent, translateContent } from '../ai/client'
import { getStore } from '../storage/config'
import type { TabManager } from '../tabs'

const DEFAULT_MODEL = 'llama-3.3-70b-versatile'

let tabManager: TabManager | null = null

export function setTabManager(tm: TabManager) {
  tabManager = tm
}

function getApiKey(): string {
  const store = getStore() as any
  return store.get('groqApiKey', '')
}

function getModel(): string {
  return DEFAULT_MODEL
}

export function registerAiIPC() {
  ipcMain.handle('ai:chat:send', async (event, message: string) => {
    const apiKey = getApiKey()
    if (!apiKey) return { error: 'API key not set. Configure it in Settings → AI.', code: 'API_KEY_MISSING' }

    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return { error: 'No window' }

    try {
      const full = await chatCompletion(apiKey, [
        { role: 'system', content: 'You are Cognix AI, a helpful browser assistant. Be concise and accurate.' },
        { role: 'user', content: message }
      ], getModel(), (chunk) => {
        if (!win.isDestroyed()) {
          win.webContents.send('ai:chat:chunk', chunk)
        }
      })
      return { text: full }
    } catch (err: any) {
      return { error: err.message || 'AI request failed', code: err.code }
    }
  })

  ipcMain.on('ai:chat:stop', () => {
    abortChat()
  })

  ipcMain.handle('ai:summarize', async (_event, text: string) => {
    const apiKey = getApiKey()
    if (!apiKey) return { error: 'API key not set.', code: 'API_KEY_MISSING' }
    try {
      const result = await summarizeContent(apiKey, text, getModel())
      return { text: result }
    } catch (err: any) {
      return { error: err.message || 'Summarization failed', code: err.code }
    }
  })

  ipcMain.handle('ai:ask:page', async (_event, text: string, question: string) => {
    const apiKey = getApiKey()
    if (!apiKey) return { error: 'API key not set.', code: 'API_KEY_MISSING' }
    try {
      const result = await askAboutContent(apiKey, text, question, getModel())
      return { text: result }
    } catch (err: any) {
      return { error: err.message || 'Request failed', code: err.code }
    }
  })

  ipcMain.handle('ai:translate', async (_event, text: string, targetLang: string) => {
    const apiKey = getApiKey()
    if (!apiKey) return { error: 'API key not set.', code: 'API_KEY_MISSING' }
    try {
      const result = await translateContent(apiKey, text, targetLang, getModel())
      return { text: result }
    } catch (err: any) {
      return { error: err.message || 'Translation failed', code: err.code }
    }
  })

  ipcMain.handle('ai:getKey', () => {
    return { key: getApiKey() }
  })

  ipcMain.handle('ai:setKey', (_event, key: string) => {
    const store = getStore() as any
    store.set('groqApiKey', key)
    return { success: true }
  })

  ipcMain.handle('webContents:getContent', async () => {
    if (!tabManager) { console.log('[Cognix] webContents:getContent: tabManager is null'); return '' }
    const content = await tabManager.getActiveTabContent()
    console.log('[Cognix] webContents:getContent: returning', content?.length || 0, 'chars')
    return content
  })
}
