import { useState, useEffect } from 'react'

interface UpdateBannerProps {
  update: { status: string; info?: any; progress?: any; error?: string } | null
  onDismiss: () => void
}

export function UpdateBanner({ update, onDismiss }: UpdateBannerProps): JSX.Element | null {
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (update?.status === 'downloaded') setDownloading(false)
  }, [update?.status])

  if (!update) return null

  if (update.status === 'checking') {
    return (
      <div className="fixed bottom-4 right-4 z-[100] glass-panel px-4 py-2.5 rounded-xl flex items-center gap-2.5 text-sm">
        <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeDasharray="31.4 31.4" strokeLinecap="round"/></svg>
        Checking for updates...
      </div>
    )
  }

  if (update.status === 'available') {
    return (
      <div className="fixed bottom-4 right-4 z-[100] glass-panel px-4 py-2.5 rounded-xl flex items-center gap-3 text-sm">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#39FF14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        <span>Update v{update.info?.version} available</span>
        <button
          disabled={downloading}
          className="px-3 py-1 rounded-lg text-xs font-medium transition-colors"
          style={{ background: 'rgba(57,255,20,0.12)', color: '#39FF14', border: '1px solid rgba(57,255,20,0.2)' }}
          onClick={() => { setDownloading(true); window.ipc.invoke('update:download') }}
        >
          {downloading ? 'Downloading...' : 'Download'}
        </button>
        <button className="text-[rgba(255,255,255,0.3)] hover:text-white transition-colors text-xs" onClick={onDismiss}>Dismiss</button>
      </div>
    )
  }

  if (update.status === 'downloading') {
    const pct = update.progress?.percent?.toFixed(0) || 0
    return (
      <div className="fixed bottom-4 right-4 z-[100] glass-panel px-4 py-2.5 rounded-xl flex items-center gap-3 text-sm min-w-[260px]">
        <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeDasharray="31.4 31.4" strokeLinecap="round"/></svg>
        <span>Downloading update... {pct}%</span>
        <div className="w-16 h-1.5 rounded-full bg-[rgba(255,255,255,0.1)] overflow-hidden flex-shrink-0">
          <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: '#39FF14' }} />
        </div>
      </div>
    )
  }

  if (update.status === 'downloaded') {
    return (
      <div className="fixed bottom-4 right-4 z-[100] glass-panel px-4 py-2.5 rounded-xl flex items-center gap-3 text-sm">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#39FF14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        <span>Update ready to install</span>
        <button
          className="px-3 py-1 rounded-lg text-xs font-medium transition-colors"
          style={{ background: 'rgba(57,255,20,0.12)', color: '#39FF14', border: '1px solid rgba(57,255,20,0.2)' }}
          onClick={() => window.ipc.invoke('update:install')}
        >
          Restart & Install
        </button>
        <button className="text-[rgba(255,255,255,0.3)] hover:text-white transition-colors text-xs" onClick={onDismiss}>Later</button>
      </div>
    )
  }

  if (update.status === 'error') {
    return (
      <div className="fixed bottom-4 right-4 z-[100] glass-panel px-4 py-2.5 rounded-xl flex items-center gap-2.5 text-sm">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <span className="text-[rgba(255,255,255,0.6)]">Update check failed</span>
        <button className="text-[rgba(255,255,255,0.3)] hover:text-white transition-colors text-xs" onClick={onDismiss}>Dismiss</button>
      </div>
    )
  }

  return null
}
