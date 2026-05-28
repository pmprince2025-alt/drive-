import { ipcMain, dialog, session, app } from 'electron'
import { getStore } from '../storage/config'
import { join, basename } from 'path'
import { writeFileSync, mkdirSync, existsSync, createWriteStream, readFileSync } from 'fs'
import { get } from 'https'
import { URL } from 'url'
import AdmZip from 'adm-zip'

const loadedExtensions: Map<string, { name: string; version: string; path: string }> = new Map()

function getCrxCacheDir(): string {
  const dir = join(app.getPath('userData'), 'crx-cache')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return dir
}

function extractExtensionId(input: string): string | null {
  const trimmed = input.trim()
  const match = trimmed.match(/chromewebstore\.google\.com\/detail\/[^/]+\/([a-z]{32})/)
  if (match) return match[1]
  if (/^[a-z]{32}$/.test(trimmed)) return trimmed
  return null
}

function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url)
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
      },
      rejectUnauthorized: false
    }

    const followRedirect = (res: import('http').IncomingMessage, redirectsLeft: number) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        if (redirectsLeft <= 0) {
          reject(new Error('Too many redirects'))
          return
        }
        const redirectUrl = new URL(res.headers.location, url)
        downloadFile(redirectUrl.toString(), dest).then(resolve).catch(reject)
        return
      }

      if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
        reject(new Error(`HTTP ${res.statusCode}`))
        return
      }

      const file = createWriteStream(dest)
      res.pipe(file)
      file.on('finish', () => { file.close(); resolve() })
      file.on('error', (err) => { file.close(); reject(err) })
    }

    const req = get(options, (res) => followRedirect(res, 5))
    req.on('error', reject)
    req.end()
  })
}

function unpackCrx(crxPath: string, outputDir: string): void {
  const buf = readFileSync(crxPath)

  let zipStart = 0
  if (buf[0] === 0x43 && buf[1] === 0x72 && buf[2] === 0x32 && buf[3] === 0x34) {
    const version = buf.readUInt32LE(4)
    if (version === 2) {
      const pubKeyLen = buf.readUInt32LE(8)
      const sigLen = buf.readUInt32LE(12)
      zipStart = 16 + pubKeyLen + sigLen
    } else if (version === 3) {
      const headerLen = buf.readUInt32LE(8)
      zipStart = 12 + headerLen
    } else {
      throw new Error(`Unknown CRX version: ${version}`)
    }
  } else if (buf[0] === 0x50 && buf[1] === 0x4B) {
    zipStart = 0
  } else {
    throw new Error('Not a valid CRX or ZIP file')
  }

  const zip = new AdmZip(buf.slice(zipStart))
  zip.extractAllTo(outputDir, true)
}

async function loadExtensionInternal(extPath: string): Promise<Electron.Extension | null> {
  try {
    const ext = await session.defaultSession.loadExtension(extPath)
    loadedExtensions.set(ext.id, { name: ext.name, version: ext.version, path: extPath })
    return ext
  } catch {
    return null
  }
}

export function registerExtensionsIPC(): void {
  const store = getStore()
  const crxCache = getCrxCacheDir()

  ipcMain.handle('extensions:pick', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'openFile'],
      filters: [{ name: 'Chrome Extensions', extensions: ['crx'] }]
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })

  ipcMain.handle('extensions:load', async (_, { path }: { path: string }) => {
    try {
      let loadPath = path

      if (path.endsWith('.crx')) {
        const extDir = join(crxCache, basename(path).replace('.crx', '') + '_unpacked')
        if (existsSync(extDir)) {
          const stored = store.get('extensions')
          const existing = stored.find((e) => e.path === path)
          if (existing) return { id: existing.id, name: existing.name, version: '' }
        }
        unpackCrx(path, extDir)
        loadPath = extDir
      }

      const ext = await loadExtensionInternal(loadPath)
      if (!ext) throw new Error('Failed to load extension')

      const stored = store.get('extensions')
      if (!stored.find((e) => e.id === ext.id)) {
        stored.push({ id: ext.id, path: loadPath })
        store.set('extensions', stored)
      }

      return { id: ext.id, name: ext.name, version: ext.version }
    } catch (err) {
      return { error: (err as Error).message }
    }
  })

  ipcMain.handle('extensions:installFromStore', async (_, { url }: { url: string }) => {
    const extId = extractExtensionId(url)
    if (!extId) {
      return { error: 'Invalid Chrome Web Store URL or extension ID' }
    }

    const crxUrl = `https://clients2.google.com/service/update2/crx?response=redirect&prodversion=130.0.6723.70&acceptformat=crx3&x=id%3D${extId}%26installsource%3Dondemand%26uc`
    const crxPath = join(crxCache, `${extId}.crx`)
    const extDir = join(crxCache, `${extId}`)

    try {
      if (!existsSync(extDir)) {
        await downloadFile(crxUrl, crxPath)
        if (!existsSync(crxPath)) {
          return { error: 'Download failed - no file received' }
        }

        const stats = readFileSync(crxPath)
        if (stats.length < 100) {
          return { error: `Downloaded file is too small (${stats.length} bytes) - invalid CRX` }
        }

        unpackCrx(crxPath, extDir)
      }

      const ext = await loadExtensionInternal(extDir)
      if (!ext) throw new Error('Failed to load extension')

      const stored = store.get('extensions')
      if (!stored.find((e) => e.id === ext.id)) {
        stored.push({ id: ext.id, path: extDir })
        store.set('extensions', stored)
      }

      return { id: ext.id, name: ext.name, version: ext.version }
    } catch (err) {
      return { error: (err as Error).message }
    }
  })

  ipcMain.handle('extensions:reload', async (_, { id }: { id: string }) => {
    try {
      const info = loadedExtensions.get(id)
      if (!info) return { error: 'Extension not loaded' }

      session.defaultSession.removeExtension(id)
      loadedExtensions.delete(id)

      const ext = await loadExtensionInternal(info.path)
      if (!ext) throw new Error('Failed to reload extension')

      return { id: ext.id, name: ext.name, version: ext.version }
    } catch (err) {
      return { error: (err as Error).message }
    }
  })

  ipcMain.handle('extensions:openStore', async () => {
    return 'https://chromewebstore.google.com'
  })

  ipcMain.handle('extensions:unload', async (_, { id }: { id: string }) => {
    try {
      session.defaultSession.removeExtension(id)
      loadedExtensions.delete(id)

      const stored = store.get('extensions')
      store.set('extensions', stored.filter((e) => e.id !== id))

      return { success: true }
    } catch (err) {
      return { error: (err as Error).message }
    }
  })

  ipcMain.handle('extensions:list', () => {
    return Array.from(loadedExtensions.entries()).map(([id, info]) => ({
      id,
      name: info.name,
      version: info.version
    }))
  })

  const stored = store.get('extensions')
  for (const ext of stored) {
    if (existsSync(ext.path)) {
      loadExtensionInternal(ext.path).then((loaded) => {
        if (!loaded) {
          const storedList = store.get('extensions')
          store.set('extensions', storedList.filter((e) => e.id !== ext.id))
        }
      })
    } else {
      const storedList = store.get('extensions')
      store.set('extensions', storedList.filter((e) => e.id !== ext.id))
    }
  }
}
