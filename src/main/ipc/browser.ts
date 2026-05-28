import { ipcMain } from 'electron'
import { TabManager } from '../tabs'

export function registerBrowserIPC(tabManager: TabManager): void {
  ipcMain.handle('browser:navigate', (_, { tabId, url }: { tabId: string; url: string }) => {
    tabManager.navigate(tabId, url)
  })

  ipcMain.handle('browser:goBack', (_, { tabId }: { tabId: string }) => {
    tabManager.goBack(tabId)
  })

  ipcMain.handle('browser:goForward', (_, { tabId }: { tabId: string }) => {
    tabManager.goForward(tabId)
  })

  ipcMain.handle('browser:reload', (_, { tabId }: { tabId: string }) => {
    tabManager.reload(tabId)
  })

  ipcMain.handle('browser:newTab', (_, { url }: { url?: string } = {}) => {
    tabManager.createTab(url)
  })

  ipcMain.handle('browser:closeTab', (_, { tabId }: { tabId: string }) => {
    tabManager.closeTab(tabId)
  })

  ipcMain.handle('browser:switchTab', (_, { tabId }: { tabId: string }) => {
    tabManager.switchTab(tabId)
  })

  ipcMain.handle('browser:hideView', () => {
    tabManager.hideActiveView()
  })

  ipcMain.handle('browser:showView', () => {
    tabManager.showActiveView()
  })

  ipcMain.handle('browser:setTopBarVisible', (_, { visible }: { visible: boolean }) => {
    tabManager.setTopBarVisible(visible)
  })

  ipcMain.handle('sidebar:setVisible', (_, { visible }: { visible: boolean }) => {
    tabManager.setSidebarVisible(visible)
  })

  ipcMain.handle('assistant:setPanel', (_, { open }: { open: boolean }) => {
    tabManager.setAssistantPanel(open)
  })

  ipcMain.handle('assistant:getPanelState', () => {
    return tabManager.getAssistantPanelOpen()
  })
}
