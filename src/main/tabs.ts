import { WebContentsView, BrowserWindow } from 'electron'
import { randomUUID } from 'crypto'

interface TabState {
  id: string
  url: string
  title: string
  favicon: string
  loading: boolean
  view: WebContentsView
  isNewTab: boolean
}

interface TabInfo {
  id: string
  url: string
  title: string
  favicon: string
  loading: boolean
  isNewTab: boolean
}

const TOP_BAR_HEIGHT = 40
const SIDEBAR_WIDTH = 65
const NEW_TAB_URL = 'cognix://newtab'

class TabManager {
  private tabs: Map<string, TabState> = new Map()
  private activeTabId: string | null = null
  private mainWindow: BrowserWindow
  private attachedViewId: string | null = null
  private topBarHeight = TOP_BAR_HEIGHT
  private sidebarVisible = false
  private assistantPanelWidth = 0
  private bounds: { x: number; y: number; width: number; height: number } = {
    x: SIDEBAR_WIDTH,
    y: TOP_BAR_HEIGHT,
    width: 0,
    height: 0
  }

  private emitTimer: ReturnType<typeof setImmediate> | null = null
  private readonly DEBOUNCE_MS = 50
  private animationTimer: ReturnType<typeof setTimeout> | null = null

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow
    mainWindow.on('resize', () => this.setBounds())
    mainWindow.once('ready-to-show', () => this.setBounds())
    setImmediate(() => this.setBounds())
  }

  createTab(url?: string): string {
    const id = randomUUID()
    const isNewTab = !url || url === NEW_TAB_URL
    const view = new WebContentsView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: true,
        disableDialogs: true,
        spellcheck: false
      }
    })
    view.webContents.backgroundThrottling = true

    const tab: TabState = {
      id,
      url: url || NEW_TAB_URL,
      title: 'New Tab',
      favicon: '',
      loading: false,
      view,
      isNewTab
    }

    this.tabs.set(id, tab)
    this.setupViewEvents(id)

    if (!isNewTab) {
      view.webContents.loadURL(url)
    }

    this.switchTab(id)

    this.emitTabsUpdate()
    return id
  }

  switchTab(id: string): void {
    const tab = this.tabs.get(id)
    if (!tab) return

    if (this.attachedViewId) {
      const current = this.tabs.get(this.attachedViewId)
      if (current) {
        this.mainWindow.contentView.removeChildView(current.view)
      }
      this.attachedViewId = null
    }

    this.activeTabId = id

    if (!tab.isNewTab) {
      this.mainWindow.contentView.addChildView(tab.view)
      this.updateViewBounds(tab.view)
      this.attachedViewId = id
    }

    this.emitTabsUpdate()
  }

  closeTab(id: string): void {
    const tab = this.tabs.get(id)
    if (!tab) return

    if (this.attachedViewId === id) {
      this.mainWindow.contentView.removeChildView(tab.view)
      this.attachedViewId = null
    }

    tab.view.webContents.destroy()
    this.tabs.delete(id)

    if (this.activeTabId === id) {
      const remaining = Array.from(this.tabs.keys())
      if (remaining.length > 0) {
        const adjacentIdx = Math.max(0, remaining.length - 1)
        this.switchTab(remaining[adjacentIdx])
      } else {
        this.activeTabId = null
        this.createTab()
      }
    }

    this.emitTabsUpdate()
  }

  setTopBarVisible(visible: boolean): void {
    this.topBarHeight = visible ? TOP_BAR_HEIGHT : 3
    this.setBounds()
  }

  setSidebarVisible(visible: boolean): void {
    this.sidebarVisible = visible
    this.animateBounds(150)
  }

  setAssistantPanel(open: boolean): void {
    console.log('[Cognix] setAssistantPanel:', open, 'sidebar:', this.sidebarVisible)
    this.assistantPanelWidth = open ? 340 : 0
    if (this.animationTimer) {
      clearTimeout(this.animationTimer)
      this.animationTimer = null
    }
    this.setBounds()
    console.log('[Cognix] setAssistantPanel done, bounds:', this.bounds)
  }

  getAssistantPanelOpen(): boolean {
    return this.assistantPanelWidth > 0
  }

  private animateBounds(duration: number): void {
    if (this.animationTimer) {
      clearTimeout(this.animationTimer)
      this.animationTimer = null
    }
    const [width, height] = this.mainWindow.getSize()
    const sw = this.sidebarVisible ? SIDEBAR_WIDTH : 0
    const aw = this.assistantPanelWidth
    const startBounds = { ...this.bounds }
    const targetBounds = {
      x: sw,
      y: this.topBarHeight,
      width: Math.max(0, width - sw - aw),
      height: height - this.topBarHeight
    }
    const startTime = performance.now()

    const tick = (): void => {
      const elapsed = performance.now() - startTime
      const t = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - t, 2)

      this.bounds = {
        x: startBounds.x + (targetBounds.x - startBounds.x) * eased,
        y: startBounds.y + (targetBounds.y - startBounds.y) * eased,
        width: startBounds.width + (targetBounds.width - startBounds.width) * eased,
        height: startBounds.height + (targetBounds.height - startBounds.height) * eased
      }

      if (this.attachedViewId) {
        const tab = this.tabs.get(this.attachedViewId)
        if (tab) {
          tab.view.setBounds(this.bounds)
        }
      }

      if (t < 1) {
        this.animationTimer = setTimeout(tick, 16)
      } else {
        this.animationTimer = null
      }
    }

    tick()
  }

  setBounds(): void {
    const [width, height] = this.mainWindow.getSize()
    const sw = this.sidebarVisible ? SIDEBAR_WIDTH : 0
    const aw = this.assistantPanelWidth
    this.bounds = {
      x: sw,
      y: this.topBarHeight,
      width: Math.max(0, width - sw - aw),
      height: height - this.topBarHeight
    }
    console.log('[Cognix] setBounds: window=', width, 'x', height, 'sidebar=', sw, 'assistant=', aw, 'bounds=', this.bounds)

    if (this.attachedViewId) {
      const tab = this.tabs.get(this.attachedViewId)
      if (tab) {
        this.updateViewBounds(tab.view)
      }
    }
  }

  navigate(id: string, url: string): void {
    const tab = this.tabs.get(id)
    if (!tab) return

    tab.isNewTab = false
    tab.url = url

    if (this.attachedViewId !== id) {
      if (this.attachedViewId) {
        const current = this.tabs.get(this.attachedViewId)
        if (current) {
          this.mainWindow.contentView.removeChildView(current.view)
        }
      }
      this.mainWindow.contentView.addChildView(tab.view)
      this.updateViewBounds(tab.view)
      this.attachedViewId = id
    }

    tab.view.webContents.loadURL(url)
    this.emitTabsUpdate()
  }

  goBack(id: string): void {
    const tab = this.tabs.get(id)
    if (!tab || tab.isNewTab) return
    if (tab.view.webContents.canGoBack()) {
      tab.view.webContents.goBack()
    }
  }

  goForward(id: string): void {
    const tab = this.tabs.get(id)
    if (!tab || tab.isNewTab) return
    if (tab.view.webContents.canGoForward()) {
      tab.view.webContents.goForward()
    }
  }

  reload(id: string): void {
    const tab = this.tabs.get(id)
    if (!tab || tab.isNewTab) return
    tab.view.webContents.reload()
  }

  hideActiveView(): void {
    console.log('[Cognix] hideActiveView: attachedViewId =', this.attachedViewId, 'activeTabId =', this.activeTabId)
    if (this.attachedViewId) {
      const tab = this.tabs.get(this.attachedViewId)
      if (tab) {
        this.mainWindow.contentView.removeChildView(tab.view)
        console.log('[Cognix] hideActiveView: removed view for', this.attachedViewId)
        this.attachedViewId = null
      } else {
        console.log('[Cognix] hideActiveView: tab not found for', this.attachedViewId)
        this.attachedViewId = null
      }
    }
  }

  showActiveView(): void {
    console.log('[Cognix] showActiveView: activeTabId =', this.activeTabId, 'attachedViewId =', this.attachedViewId)
    if (this.activeTabId && !this.attachedViewId) {
      const tab = this.tabs.get(this.activeTabId)
      if (tab && !tab.isNewTab) {
        this.mainWindow.contentView.addChildView(tab.view)
        this.updateViewBounds(tab.view)
        this.attachedViewId = this.activeTabId
        console.log('[Cognix] showActiveView: added view for', this.activeTabId)
      } else {
        console.log('[Cognix] showActiveView: tab not found or is new tab')
      }
    }
  }

  getActiveTabId(): string | null {
    return this.activeTabId
  }

  getTabsInfo(): TabInfo[] {
    return Array.from(this.tabs.values()).map(({ id, url, title, favicon, loading, isNewTab }) => ({
      id,
      url,
      title,
      favicon,
      loading,
      isNewTab
    }))
  }

  private setupViewEvents(id: string): void {
    const tab = this.tabs.get(id)
    if (!tab) return

    tab.view.webContents.on('did-navigate', (_, url) => {
      tab.url = url
      if (tab.isNewTab && url !== NEW_TAB_URL) {
        tab.isNewTab = false
        if (this.attachedViewId !== id) {
          if (this.attachedViewId) {
            const current = this.tabs.get(this.attachedViewId)
            if (current) {
              this.mainWindow.contentView.removeChildView(current.view)
            }
          }
          this.mainWindow.contentView.addChildView(tab.view)
          this.updateViewBounds(tab.view)
          this.attachedViewId = id
        }
      }
      this.emitTabsUpdate()
    })

    tab.view.webContents.on('page-title-updated', (_, title) => {
      tab.title = title
      this.emitTabsUpdate()
    })

    tab.view.webContents.on('did-start-loading', () => {
      tab.loading = true
      this.emitTabsUpdate()
    })

    tab.view.webContents.on('did-stop-loading', () => {
      tab.loading = false
      this.injectScrollbarCSS(tab.view)
      this.emitTabsUpdate()
    })
    tab.view.webContents.on('did-navigate', () => this.injectScrollbarCSS(tab.view))
    tab.view.webContents.on('did-navigate-in-page', () => this.injectScrollbarCSS(tab.view))

    tab.view.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
      if (errorCode === -3) return // ERR_ABORTED — ignore (user navigation)
      this.showErrorPage(tab.view, validatedURL, errorCode, errorDescription)
    })

    tab.view.webContents.on('page-favicon-updated', (_, favicons) => {
      if (favicons.length > 0) {
        tab.favicon = favicons[0]
        this.emitTabsUpdate()
      }
    })
  }

  private updateViewBounds(view: WebContentsView): void {
    view.setBounds(this.bounds)
  }

  private showErrorPage(view: WebContentsView, url: string, errorCode: number, errorDescription: string): void {
    const errorInfo = this.getErrorInfo(errorCode, errorDescription)
    const escapedUrl = this.escapeHtml(url)
    const html = `<!DOCTYPE html><html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${errorInfo.title} — Cognix</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Oxygen,Ubuntu,Cantarell,sans-serif;
  background:radial-gradient(ellipse at 50% 30%,rgba(57,255,20,0.06),transparent 70%),#000;
  color:#e0e0e0;display:flex;align-items:center;justify-content:center;min-height:100vh;
  margin:0;padding:24px}
.card{background:rgba(255,255,255,0.03);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);
  border:1px solid rgba(255,255,255,0.06);border-radius:20px;padding:48px;max-width:520px;width:100%;
  text-align:center;box-shadow:0 8px 60px rgba(0,0,0,0.6)}
.icon{font-size:56px;margin-bottom:20px;display:block}
h1{font-size:22px;font-weight:600;color:#fff;margin-bottom:8px}
.url{font-size:13px;color:rgba(255,255,255,0.35);word-break:break-all;margin-bottom:16px;
  background:rgba(255,255,255,0.04);padding:8px 14px;border-radius:10px;display:inline-block}
.desc{font-size:14px;color:rgba(255,255,255,0.55);line-height:1.6;margin-bottom:28px}
.actions{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
.btn,.btn-primary{text-decoration:none;padding:10px 24px;border-radius:10px;font-size:14px;font-weight:500;
  cursor:pointer;transition:all .15s;border:none;display:inline-flex;align-items:center;gap:6px}
.btn{background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.8)}
.btn:hover{background:rgba(255,255,255,0.12)}
.btn-primary{background:rgba(57,255,20,0.12);color:#39FF14;border:1px solid rgba(57,255,20,0.2)}
.btn-primary:hover{background:rgba(57,255,20,0.2);box-shadow:0 0 20px rgba(57,255,20,0.1)}
.code{position:fixed;bottom:12px;right:16px;font-size:11px;color:rgba(255,255,255,0.12)}
</style></head><body>
<div class="card">
<span class="icon">${errorInfo.icon}</span>
<h1>${errorInfo.title}</h1>
<div class="url">${escapedUrl}</div>
<div class="desc">${this.escapeHtml(errorInfo.description)}</div>
<div class="actions">
<button class="btn-primary" onclick="location.href='${escapedUrl}'">↻ Retry</button>
<button class="btn" onclick="history.back()">← Go Back</button>
</div>
</div>
<div class="code">ERR ${errorCode}</div>
</body></html>`
    view.webContents.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
  }

  private getErrorInfo(code: number, desc: string): { title: string; description: string; icon: string } {
    const svg = (path: string) => `<svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#39FF14" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`
    switch (code) {
      case -102: case -118: case -109: case -110:
        return { title: 'Connection Failed', description: desc || "Could not connect to the server. Check your internet connection or try again.",
          icon: svg('<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>') }
      case -105: case -806:
        return { title: 'DNS Not Found', description: desc || "The website's address could not be found. Check the URL for typos.",
          icon: svg('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>') }
      case -106:
        return { title: 'No Internet', description: 'You are offline. Check your network connection and try again.',
          icon: svg('<path d="M12 2a15.3 15.3 0 0 1 10 4"/><path d="M5 7a10 10 0 0 1 14 0"/><path d="M8.5 11.5a5.5 5.5 0 0 1 7 0"/><path d="M12 18h.01"/><path d="m2 2 20 20"/>') }
      case -201: case -202: case -203:
        return { title: 'SSL Certificate Error', description: desc || "The website's security certificate is invalid or expired.",
          icon: svg('<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1"/><path d="M12 16v1"/>') }
      case -501:
        return { title: 'Insecure Response', description: 'The website responded in an unsafe way and was blocked.',
          icon: svg('<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>') }
      case -300: case -301: case -302:
        return { title: 'Redirect Error', description: 'The website has too many redirects or a broken redirect loop.',
          icon: svg('<path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>') }
      case -7: case -8:
        return { title: 'Request Timed Out', description: 'The server took too long to respond. Try again later.',
          icon: svg('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>') }
      default:
        return { title: 'Page Could Not Be Loaded', description: desc || 'An unexpected error occurred while loading the page.',
          icon: svg('<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>') }
    }
  }

  private escapeHtml(text: string): string {
    return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
  }

  async getActiveTabContent(): Promise<string> {
    if (!this.activeTabId) { console.log('[Cognix] getActiveTabContent: no active tab id'); return '' }
    const tab = this.tabs.get(this.activeTabId)
    if (!tab) { console.log('[Cognix] getActiveTabContent: tab not found'); return '' }
    if (tab.isNewTab) { console.log('[Cognix] getActiveTabContent: tab is new tab'); return '' }
    console.log('[Cognix] getActiveTabContent: tab URL =', tab.url)
    try {
      const result = await tab.view.webContents.executeJavaScript(
        '(function() { try { var t = document.body?.innerText || document.documentElement?.innerText || ""; return t.substring(0, 50000) } catch(e) { return "" } })()'
      )
      console.log('[Cognix] getActiveTabContent: got', result?.length || 0, 'chars')
      return result || ''
    } catch (e) {
      console.log('[Cognix] getActiveTabContent: error', e)
      return ''
    }
  }

  private injectScrollbarCSS(view: WebContentsView): void {
    const css = `::-webkit-scrollbar{width:1px;height:1px}
::-webkit-scrollbar-track{background:#000}
::-webkit-scrollbar-thumb{background:#39FF14;border-radius:5px;transition:background .2s;box-shadow:0 0 6px rgba(57,255,20,0.3)}
::-webkit-scrollbar-thumb:hover{background:#2bcc10;box-shadow:0 0 10px rgba(57,255,20,0.5)}
*{scrollbar-width:auto;scrollbar-color:#39FF14 #000}`
    try { view.webContents.insertCSS(css) } catch {}
  }

  private emitTabsUpdate(): void {
    if (this.emitTimer) clearTimeout(this.emitTimer)
    this.emitTimer = setTimeout(() => {
      if (this.mainWindow.isDestroyed()) return
      this.mainWindow.webContents.send('tab:updated', {
        tabs: this.getTabsInfo(),
        activeTabId: this.activeTabId
      })
    }, this.DEBOUNCE_MS)
  }
}

export { TabManager, TabInfo }
