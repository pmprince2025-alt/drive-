import { useState, useRef, useEffect } from 'react'
import { X, FileText, MessageSquare, Globe, Loader2, RefreshCw, AlertTriangle, KeyRound, WifiOff, Timer } from 'lucide-react'

type ActionType = 'idle' | 'summarize' | 'ask' | 'translate'

interface Props {
  open: boolean
  onClose: () => void
}

export function AiPageAssistant({ open, onClose }: Props) {
  const [action, setAction] = useState<ActionType>('idle')
  const [question, setQuestion] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    window.ipc.invoke('assistant:setPanel', { open }).catch(() => {})
  }, [open])

  useEffect(() => {
    if (action === 'ask') inputRef.current?.focus()
  }, [action])

  const invokeWithTimeout = <T,>(channel: string, timeout = 15000, ...args: unknown[]): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Request timed out')), timeout)
      window.ipc.invoke<T>(channel, ...args).then((r) => { clearTimeout(timer); resolve(r) }).catch((e) => { clearTimeout(timer); reject(e) })
    })
  }

  const getPageContent = async () => {
    const text = await invokeWithTimeout<string>('webContents:getContent', 10000)
    return text || ''
  }

  const doSummarize = async () => {
    setLoading(true); setError(''); setErrorCode(null); setResult(''); setAction('summarize')
    try {
      let text = ''
      try { text = await getPageContent() } catch (e: any) { setError('Failed to read page: ' + (e.message || 'timeout')); setLoading(false); return }
      if (!text) { setError('Could not read page content'); setLoading(false); return }
      const res = await invokeWithTimeout<{ text?: string; error?: string; code?: string }>('ai:summarize', 30000, text)
      if (res.error) { setError(res.error); setErrorCode(res.code || null) }
      else if (res.text) { setResult(res.text) }
      else { setError('Received empty response from AI') }
    } catch (err: any) { setError(err.message || 'Request failed'); setErrorCode('UNKNOWN') }
    setLoading(false)
  }

  const doAsk = async () => {
    const q = question.trim()
    if (!q) return
    setLoading(true); setError(''); setErrorCode(null); setResult(''); setAction('ask')
    try {
      let text = ''
      try { text = await getPageContent() } catch (e: any) { setError('Failed to read page: ' + (e.message || 'timeout')); setLoading(false); return }
      if (!text) { setError('Could not read page content'); setLoading(false); return }
      const res = await invokeWithTimeout<{ text?: string; error?: string; code?: string }>('ai:ask:page', 30000, text, q)
      if (res.error) { setError(res.error); setErrorCode(res.code || null) }
      else if (res.text) { setResult(res.text) }
      else { setError('Received empty response from AI') }
    } catch (err: any) { setError(err.message || 'Request failed'); setErrorCode('UNKNOWN') }
    setLoading(false)
  }

  const doTranslate = async () => {
    setLoading(true); setError(''); setErrorCode(null); setResult(''); setAction('translate')
    try {
      let text = ''
      try { text = await getPageContent() } catch (e: any) { setError('Failed to read page: ' + (e.message || 'timeout')); setLoading(false); return }
      if (!text) { setError('Could not read page content'); setLoading(false); return }
      const res = await invokeWithTimeout<{ text?: string; error?: string; code?: string }>('ai:translate', 30000, text, 'English')
      if (res.error) { setError(res.error); setErrorCode(res.code || null) }
      else if (res.text) { setResult(res.text) }
      else { setError('Received empty response from AI') }
    } catch (err: any) { setError(err.message || 'Request failed'); setErrorCode('UNKNOWN') }
    setLoading(false)
  }

  const ErrorIcon = errorCode === 'INVALID_KEY' ? KeyRound
    : errorCode === 'API_KEY_MISSING' ? KeyRound
    : errorCode === 'RATE_LIMITED' ? Timer
    : errorCode === 'NETWORK' ? WifiOff
    : AlertTriangle

  return (
    <>
      {open && (
        <div
          className="fixed top-10 right-0 bottom-0 w-[340px] z-50 border-l border-white/10 bg-gray-950 shadow-2xl shadow-black/40 flex flex-col"
          style={{ height: 'calc(100vh - 40px)' }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
            <span className="text-xs font-medium text-gray-200 tracking-wide">Page Assistant</span>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-all">
              <X size={14} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0" style={{ background: '#111' }}>
            {action === 'idle' && !loading && !result && !error && (
                <>
                  <button onClick={doSummarize} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-left transition-all hover:bg-white/5 group">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#39FF14]/10 group-hover:bg-[#39FF14]/20 transition-colors shrink-0">
                      <FileText size={15} className="text-[#39FF14]" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-200">Summarize</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">Get a concise summary of this page</div>
                    </div>
                  </button>

                  <button onClick={() => setAction('ask')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-left transition-all hover:bg-white/5 group">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#39FF14]/10 group-hover:bg-[#39FF14]/20 transition-colors shrink-0">
                      <MessageSquare size={15} className="text-[#39FF14]" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-200">Ask about this page</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">Ask questions about the page content</div>
                    </div>
                  </button>

                  <button onClick={doTranslate} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-left transition-all hover:bg-white/5 group">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#39FF14]/10 group-hover:bg-[#39FF14]/20 transition-colors shrink-0">
                      <Globe size={15} className="text-[#39FF14]" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-200">Translate to English</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">Translate the page to English</div>
                    </div>
                  </button>
                </>
              )}

              {action === 'ask' && !loading && !result && !error && (
                <div>
                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && doAsk()}
                      placeholder="What do you want to know?"
                      className="flex-1 px-3 py-2 rounded-lg bg-gray-800 text-sm text-gray-200 outline-none border border-gray-700 focus:border-[#39FF14]/50 transition-colors placeholder:text-gray-500"
                    />
                    <button onClick={doAsk} disabled={!question.trim()} className="px-3 py-2 rounded-lg bg-[#39FF14]/15 text-[#39FF14] text-sm hover:bg-[#39FF14]/25 transition-all disabled:opacity-40">
                      Ask
                    </button>
                  </div>
                  <button onClick={() => setAction('idle')} className="mt-2 text-xs text-gray-500 hover:text-gray-300">
                    Back
                  </button>
                </div>
              )}

              {loading && (
                <div className="flex items-center gap-3 py-8 text-sm text-gray-400 justify-center">
                  <Loader2 size={16} className="animate-spin text-[#39FF14]" />
                  Processing...
                </div>
              )}

              {result && !loading && (
                <div>
                  <div className="max-h-[60vh] overflow-y-auto px-4 py-3 rounded-xl bg-gray-800 text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
                    {result}
                  </div>
                  <button onClick={() => { setAction('idle'); setResult(''); setError('') }} className="mt-2 text-xs text-gray-500 hover:text-gray-300">
                    Back
                  </button>
                </div>
              )}

              {error && !loading && (
                <div>
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 text-red-400 text-sm">
                    <ErrorIcon size={14} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <button onClick={action === 'ask' ? doAsk : action === 'translate' ? doTranslate : doSummarize} className="flex items-center gap-1.5 text-xs text-[#39FF14]/70 hover:text-[#39FF14] px-3 py-1 rounded-lg hover:bg-[#39FF14]/5">
                      <RefreshCw size={12} /> Retry
                    </button>
                    <button onClick={() => { setAction('idle'); setError(''); setErrorCode(null) }} className="text-xs text-gray-500 hover:text-gray-300">
                      Back
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
    </>
  )
}
