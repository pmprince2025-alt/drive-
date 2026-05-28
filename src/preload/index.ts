import { contextBridge, ipcRenderer } from 'electron'

const api = {
  invoke: <T = unknown>(channel: string, ...args: unknown[]): Promise<T> => {
    const validChannels = [
      'window:minimize',
      'window:maximize',
      'window:close',
      'browser:navigate',
      'browser:goBack',
      'browser:goForward',
      'browser:reload',
      'browser:newTab',
      'browser:closeTab',
      'browser:switchTab',
      'browser:getState',
      'browser:hideView',
      'browser:showView',
      'browser:setTopBarVisible',
      'sidebar:setVisible',
      'storage:getHistory',
      'storage:addBookmark',
      'storage:getBookmarks',
      'storage:removeBookmark',
      'storage:isBookmarked',
      'storage:addHistory',
      'extensions:pick',
      'extensions:load',
      'extensions:unload',
      'extensions:list',
      'extensions:installFromStore',
      'extensions:openStore',
      'extensions:reload',
      'suggestions:fetch',
      'ai:chat:send',
      'ai:chat:stop',
      'ai:summarize',
      'ai:ask:page',
      'ai:translate',
      'ai:getKey',
      'ai:setKey',
      'webContents:getContent',
      'devtools:open',
      'assistant:setPanel',
      'assistant:getPanelState',
      'update:check',
      'update:download',
      'update:install'
    ]
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args)
    }
    return Promise.reject(new Error(`Invalid channel: ${channel}`))
  },
  on: (channel: string, callback: (...args: unknown[]) => void): (() => void) => {
    const validChannels = ['tab:updated', 'ai:chat:chunk', 'ai:openAssistant', 'homescreen:add', 'update:status']
    if (validChannels.includes(channel)) {
      const listener = (_event: Electron.IpcRendererEvent, ...args: unknown[]): void => callback(...args)
      ipcRenderer.on(channel, listener)
      return () => ipcRenderer.removeListener(channel, listener)
    }
    return () => {}
  }
}

contextBridge.exposeInMainWorld('ipc', api)
