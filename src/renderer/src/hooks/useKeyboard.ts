import { useEffect, useCallback } from 'react'
import { useTabsStore } from '../store/tabs'

type ShortcutHandler = Record<string, () => void>

export function useKeyboard(handlers: ShortcutHandler): void {
  const tabs = useTabsStore((s) => s.tabs)
  const activeTabId = useTabsStore((s) => s.activeTabId)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey

      if (e.key === 'Escape') {
        handlers['Escape']?.()
        return
      }

      if (!mod) return

      const key = e.key.toLowerCase()

      if (key === 'k') {
        e.preventDefault()
        handlers['Cmd+K']?.()
      } else if (key === 't') {
        e.preventDefault()
        handlers['Cmd+T']?.()
      } else if (key === 'w') {
        e.preventDefault()
        handlers['Cmd+W']?.()
      } else if (key === 'l') {
        e.preventDefault()
        handlers['Cmd+L']?.()
      } else if (key === 'r') {
        e.preventDefault()
        handlers['Cmd+R']?.()
      }
    },
    [handlers]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}
