import { net } from 'electron'

const GROQ_BASE = 'https://api.groq.com/openai/v1'

export interface AiMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

let activeRequest: { abort: () => void } | null = null

function buildHeaders(apiKey: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  }
}

export async function chatCompletion(
  apiKey: string,
  messages: AiMessage[],
  model: string,
  onChunk?: (text: string) => void
): Promise<string> {
  const url = `${GROQ_BASE}/chat/completions`
  const body = JSON.stringify({
    model,
    messages,
    stream: !!onChunk,
    temperature: 0.7,
    max_tokens: 2048
  })

    const headers = buildHeaders(apiKey)

    return new Promise((resolve, reject) => {
      let full = ''
      const req = net.request({ url, method: 'POST', headers })
      req.on('response', (res) => {
        if (res.statusCode !== 200) {
          let errData = ''
          res.on('data', (chunk) => { errData += chunk.toString() })
          res.on('end', () => {
            let msg: string
            try {
              const parsed = JSON.parse(errData)
              msg = parsed.error?.message || `Groq API error: ${res.statusCode}`
            } catch {
              msg = `Groq API error: ${res.statusCode}`
            }
            if (res.statusCode === 429) {
              reject(Object.assign(new Error('Rate limited. Please wait a moment and try again.'), { code: 'RATE_LIMITED' }))
            } else if (res.statusCode === 401) {
              reject(Object.assign(new Error('Invalid API key. Check your key in Settings → AI.'), { code: 'INVALID_KEY' }))
            } else {
              reject(new Error(msg))
            }
          })
        return
      }

      if (onChunk) {
        let buffer = ''
        res.on('data', (chunk: Buffer) => {
          buffer += chunk.toString()
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''
          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed || trimmed === 'data: [DONE]') continue
            if (trimmed.startsWith('data: ')) {
              try {
                const json = JSON.parse(trimmed.slice(6))
                const content = json.choices?.[0]?.delta?.content || ''
                if (content) {
                  full += content
                  onChunk(content)
                }
              } catch { /* skip malformed */ }
            }
          }
        })
        res.on('end', () => resolve(full))
      } else {
        let data = ''
        res.on('data', (chunk: Buffer) => { data += chunk.toString() })
        res.on('end', () => {
          try {
            const json = JSON.parse(data)
            resolve(json.choices?.[0]?.message?.content || '')
          } catch {
            reject(new Error('Failed to parse Groq response'))
          }
        })
      }
    })
    req.on('error', (err) => reject(Object.assign(err, { code: 'NETWORK' })))
    req.write(body)
    req.end()

    activeRequest = {
      abort: () => {
        req.destroy()
        activeRequest = null
      }
    }
  }).finally(() => {
    activeRequest = null
  })
}

export function abortChat() {
  if (activeRequest) {
    activeRequest.abort()
    activeRequest = null
  }
}

export async function summarizeContent(apiKey: string, text: string, model: string): Promise<string> {
  const messages: AiMessage[] = [
    { role: 'system', content: 'Summarize the following content concisely in a few paragraphs.' },
    { role: 'user', content: text.slice(0, 15000) }
  ]
  return chatCompletion(apiKey, messages, model)
}

export async function askAboutContent(apiKey: string, text: string, question: string, model: string): Promise<string> {
  const messages: AiMessage[] = [
    { role: 'system', content: 'Answer the question based only on the provided content.' },
    { role: 'user', content: `Content:\n${text.slice(0, 12000)}\n\nQuestion: ${question}` }
  ]
  return chatCompletion(apiKey, messages, model)
}

export async function translateContent(apiKey: string, text: string, targetLang: string, model: string): Promise<string> {
  const messages: AiMessage[] = [
    { role: 'system', content: `Translate the following content to ${targetLang}. Preserve formatting.` },
    { role: 'user', content: text.slice(0, 15000) }
  ]
  return chatCompletion(apiKey, messages, model)
}
