import { create } from 'zustand'
import type { AiMessage } from '../../../main/ai/client'

const STORAGE_KEY = 'cognix:aiMessages'
const MAX_MESSAGES = 100

function loadMessages(): AiMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveMessages(messages: AiMessage[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
}

interface AiState {
  mode: 'search' | 'chat'
  messages: AiMessage[]
  loading: boolean
  streamingText: string
  error: string | null
  errorCode: string | null
  lastQuery: string
  setMode: (mode: 'search' | 'chat') => void
  sendMessage: (text: string) => Promise<void>
  stopGeneration: () => void
  clearChat: () => void
  appendMessage: (msg: AiMessage) => void
  retryLast: () => Promise<void>
  setApiKey: (key: string) => Promise<void>
  checkApiKey: () => Promise<boolean>
}

export const useAiStore = create<AiState>((set, get) => ({
  mode: 'search',
  messages: loadMessages(),
  loading: false,
  streamingText: '',
  error: null,
  errorCode: null,
  lastQuery: '',

  setMode: (mode) => set({ mode }),

  sendMessage: async (text) => {
    const { messages } = get()
    const userMsg: AiMessage = { role: 'user', content: text }
    const updated = [...messages, userMsg]
    set({ messages: updated, loading: true, error: null, errorCode: null, streamingText: '', lastQuery: text })
    saveMessages(updated)

    const unsubscribe = window.ipc.on('ai:chat:chunk', (chunk: unknown) => {
      set((s) => ({ streamingText: s.streamingText + (chunk as string) }))
    })

    try {
      const result = await window.ipc.invoke<{ text?: string; error?: string; code?: string }>('ai:chat:send', text)
      unsubscribe()

      if (result.error) {
        set({ error: result.error, errorCode: result.code || null, loading: false, streamingText: '' })
        return
      }

      const assistantMsg: AiMessage = { role: 'assistant', content: result.text || '' }
      const final = [...get().messages, assistantMsg]
      set({ messages: final, loading: false, streamingText: '' })
      saveMessages(final)
    } catch (err: any) {
      unsubscribe()
      set({ error: err.message || 'Request failed', errorCode: 'UNKNOWN', loading: false, streamingText: '' })
    }
  },

  stopGeneration: () => {
    window.ipc.invoke('ai:chat:stop').catch(() => {})
    const { messages, streamingText } = get()
    if (streamingText) {
      const msg: AiMessage = { role: 'assistant', content: streamingText }
      const final = [...messages, msg]
      set({ messages: final, loading: false, streamingText: '' })
      saveMessages(final)
    } else {
      set({ loading: false })
    }
  },

  clearChat: () => {
    set({ messages: [], loading: false, streamingText: '', error: null, errorCode: null })
    saveMessages([])
  },

  retryLast: async () => {
    const { lastQuery } = get()
    if (!lastQuery) return
    set((s) => ({
      messages: s.messages.slice(0, -1),
      error: null,
      errorCode: null
    }))
    await get().sendMessage(lastQuery)
  },

  appendMessage: (msg) => {
    set((s) => {
      const messages = [...s.messages, msg]
      saveMessages(messages)
      return { messages }
    })
  },

  setApiKey: async (key) => {
    await window.ipc.invoke('ai:setKey', key)
  },

  checkApiKey: async () => {
    const result = await window.ipc.invoke<{ key: string }>('ai:getKey')
    return !!result.key
  }
}))
