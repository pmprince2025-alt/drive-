import { app, BrowserWindow, Menu, MenuItemConstructorOptions, ipcMain, nativeImage, net, dialog } from 'electron'
import { join } from 'path'
import { autoUpdater } from 'electron-updater'
import { TabManager } from './tabs'
import { registerBrowserIPC } from './ipc/browser'
import { registerStorageIPC } from './ipc/storage'
import { registerExtensionsIPC } from './ipc/extensions'
import { registerAiIPC, setTabManager } from './ipc/ai'

// Reduce Chromium memory footprint
app.commandLine.appendSwitch('disable-accelerated-2d-canvas')
app.commandLine.appendSwitch('disable-gpu-rasterization')
app.commandLine.appendSwitch('disable-software-rasterizer')
app.commandLine.appendSwitch('disable-features', 'BlinkGenPropertyTrees')
app.commandLine.appendSwitch('js-flags', '--max_old_space_size=512 --expose-gc')

let tabManager: TabManager | null = null

// Register as protocol handler for http/https
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('http', process.execPath, [process.argv[1]])
    app.setAsDefaultProtocolClient('https', process.execPath, [process.argv[1]])
  }
} else {
  app.setAsDefaultProtocolClient('http')
  app.setAsDefaultProtocolClient('https')
}

// Ensure single instance and pass URLs from second instances
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', (_event, commandLine) => {
    const win = BrowserWindow.getAllWindows()[0]
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
      const url = commandLine.find(arg => arg.startsWith('http://') || arg.startsWith('https://'))
      if (url && tabManager) {
        const id = tabManager.getActiveTabId()
        if (id) tabManager.navigate(id, url)
      }
    }
  })
}

app.on('open-url', (_event, url) => {
  if (tabManager) {
    const id = tabManager.getActiveTabId()
    if (id) tabManager.navigate(id, url)
  }
})

function createWindow(): void {
  const isMac = process.platform === 'darwin'

  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    frame: isMac,
    titleBarStyle: isMac ? 'hiddenInset' : undefined,
    icon: nativeImage.createFromPath(join(__dirname, '../../resources/icon.png')),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true
    }
  })

  tabManager = new TabManager(mainWindow)
  registerBrowserIPC(tabManager)
  registerStorageIPC()
  registerExtensionsIPC()
  setTabManager(tabManager)
  registerAiIPC()

  ipcMain.handle('window:minimize', () => mainWindow.minimize())
  ipcMain.handle('window:maximize', () => {
    if (!mainWindow.isMaximized()) mainWindow.maximize()
  })
  ipcMain.handle('window:close', () => mainWindow.close())

  ipcMain.handle('browser:getState', () => ({
    tabs: tabManager!.getTabsInfo(),
    activeTabId: tabManager!.getActiveTabId()
  }))

  ipcMain.handle('suggestions:fetch', async (_, query: string) => {
    try {
      const url = `https://duckduckgo.com/ac/?q=${encodeURIComponent(query)}&type=list`
      const response = await net.fetch(url)
      const data = await response.json()
      if (Array.isArray(data)) return data.map((d: any) => d.phrase).filter(Boolean)
      return []
    } catch { return [] }
  })

  ipcMain.handle('devtools:open', () => {
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  })

  // Check initial command line for a URL (e.g., launched as default browser)
  const initialUrl = process.argv.find(arg => arg.startsWith('http://') || arg.startsWith('https://'))
  tabManager.createTab(initialUrl)

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Auto-updater
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  ipcMain.handle('update:check', async () => {
    try {
      await autoUpdater.checkForUpdates()
      return { success: true }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  })

  ipcMain.handle('update:download', () => {
    autoUpdater.downloadUpdate()
  })

  ipcMain.handle('update:install', () => {
    autoUpdater.quitAndInstall()
  })

  autoUpdater.on('checking-for-update', () => {
    mainWindow.webContents.send('update:status', { status: 'checking' })
  })

  autoUpdater.on('update-available', (info) => {
    mainWindow.webContents.send('update:status', { status: 'available', info })
  })

  autoUpdater.on('update-not-available', (info) => {
    mainWindow.webContents.send('update:status', { status: 'not-available', info })
  })

  autoUpdater.on('download-progress', (progress) => {
    mainWindow.webContents.send('update:status', { status: 'downloading', progress })
  })

  autoUpdater.on('update-downloaded', (info) => {
    mainWindow.webContents.send('update:status', { status: 'downloaded', info })
  })

  autoUpdater.on('error', (error) => {
    mainWindow.webContents.send('update:status', { status: 'error', error: error.message })
  })

  // Check for updates after a short delay (window needs to be ready)
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch(() => {})
  }, 5000)

  const tabManagerRef = tabManager

  app.on('web-contents-created', (_, contents) => {
    contents.on('context-menu', (event, params) => {
      const tabId = tabManagerRef.getActiveTabId()
      const template: MenuItemConstructorOptions[] = [
        { label: 'Back', accelerator: 'CmdOrCtrl+[', click: () => tabId && tabManagerRef.goBack(tabId) },
        { label: 'Forward', accelerator: 'CmdOrCtrl+]', click: () => tabId && tabManagerRef.goForward(tabId) },
        { label: 'Reload', accelerator: 'CmdOrCtrl+R', click: () => tabId && tabManagerRef.reload(tabId) },
        { type: 'separator' },
        { label: 'Copy URL', click: () => {
          if (params.linkURL) {
            require('electron').clipboard.writeText(params.linkURL)
          } else if (tabId) {
            const tab = tabManagerRef.getTabsInfo().find(t => t.id === tabId)
            if (tab) require('electron').clipboard.writeText(tab.url)
          }
        }},
        { type: 'separator' },
        { label: 'Add to Home screen', click: () => {
          const tabInfo = tabManagerRef.getTabsInfo().find(t => t.id === tabId)
          if (tabInfo && tabInfo.url !== 'cognix://newtab') {
            const win = BrowserWindow.getAllWindows()[0]
            if (win) win.webContents.send('homescreen:add', { url: tabInfo.url, title: tabInfo.title })
          }
        }},
        { label: 'Ask AI about this page', click: () => {
          const win = BrowserWindow.getAllWindows()[0]
          if (win) win.webContents.send('ai:openAssistant')
        }},
        { type: 'separator' },
        { label: 'Inspect Element', accelerator: 'CmdOrCtrl+Shift+I', click: () => contents.inspectElement(params.x, params.y) }
      ]
      const menu = Menu.buildFromTemplate(template)
      menu.popup({ window: mainWindow })
    })
  })

}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
