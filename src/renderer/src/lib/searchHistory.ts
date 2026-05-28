export interface SearchEntry {
  query: string
  count: number
  lastSearched: number
}

const STORAGE_KEY = 'cognix:searchHistory'
const MAX_ENTRIES = 200

function load(): SearchEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function save(entries: SearchEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

export function addSearchEntry(query: string) {
  const q = query.trim().toLowerCase()
  if (!q || q.length < 2) return
  const entries = load()
  const existing = entries.find((e) => e.query === q)
  if (existing) {
    existing.count += 1
    existing.lastSearched = Date.now()
  } else {
    entries.unshift({ query: q, count: 1, lastSearched: Date.now() })
  }
  if (entries.length > MAX_ENTRIES) entries.length = MAX_ENTRIES
  save(entries)
}

function score(entry: SearchEntry, input: string): number {
  const q = entry.query
  const inp = input.toLowerCase()
  let s = 0
  if (q === inp) s += 1000
  else if (q.startsWith(inp)) s += 500
  else if (q.includes(inp)) s += 100
  s += entry.count * 10
  s += Math.min(entry.lastSearched / 100000, 50)
  return s
}

export function getSuggestions(input: string): SearchEntry[] {
  if (!input.trim()) return []
  const entries = load()
  const inp = input.toLowerCase()
  const filtered = entries.filter((e) => e.query.includes(inp))
  filtered.sort((a, b) => score(b, inp) - score(a, inp))
  return filtered.slice(0, 8)
}

export function getAutocomplete(input: string): string | null {
  if (!input.trim()) return null
  const entries = load()
  const inp = input.toLowerCase()
  for (const e of entries) {
    if (e.query.startsWith(inp) && e.query !== inp) return e.query
  }
  return null
}

export function clearHistory() {
  localStorage.removeItem(STORAGE_KEY)
}
