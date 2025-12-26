// --- START OF FILE main.js ---

const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  shell,
  protocol,
  clipboard,
  nativeImage
} = require('electron')
const path = require('path')
const fs = require('fs').promises
const fsSync = require('fs')
const fastGlob = require('fast-glob')
const { pathToFileURL, fileURLToPath } = require('url')

let mainWindow

// --- PERFORMANCE OPTIMIZATIONS for Zen4 + NVIDIA Blackwell ---
// GPU acceleration - safe defaults that work with NVIDIA
app.commandLine.appendSwitch('enable-gpu-rasterization')
app.commandLine.appendSwitch('enable-accelerated-2d-canvas')
app.commandLine.appendSwitch('ignore-gpu-blocklist')
app.commandLine.appendSwitch('enable-zero-copy')
app.commandLine.appendSwitch('enable-accelerated-video-decode')
app.commandLine.appendSwitch('enable-accelerated-mjpeg-decode')

// Enable safe performance features
app.commandLine.appendSwitch('enable-features', [
  'CanvasOopRasterization',      // Out-of-process canvas rasterization
  'ParallelDownloading',         // Parallel resource loading
  'BackForwardCache'             // Cache navigation history
].join(','))

// Disable features that hurt performance on Linux
app.commandLine.appendSwitch('disable-features', [
  'UseChromeOSDirectVideoDecoder', // Not needed on Linux
  'CalculateNativeWinOcclusion',   // Windows-only
  'MediaFoundationVideoCapture'    // Windows-only
].join(','))

// Memory optimizations for large galleries
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=4096')
app.commandLine.appendSwitch('disk-cache-size', '536870912')  // 512MB disk cache

// GPU rasterization tuning
app.commandLine.appendSwitch('num-raster-threads', '4')  // Match Zen4 CCX topology

// Wayland/KDE optimizations (Arch Linux + KDE Plasma)
if (process.env.XDG_SESSION_TYPE === 'wayland') {
  app.commandLine.appendSwitch('ozone-platform-hint', 'auto')
}

// Cache for starred status checks
const starredCache = new Map()
let starredCacheDir = null

async function movePathsToTrash(paths) {
  const targets = Array.isArray(paths) ? paths : [paths]
  await Promise.all(
    targets.map(async target => {
      await shell.trashItem(path.normalize(target))
    })
  )
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false
  })

  mainWindow.loadFile('renderer/index.html')
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools()
  }
}

app.whenReady().then(() => {
  protocol.registerFileProtocol('local-image', (request, callback) => {
    try {
      const fileUrl = request.url.replace('local-image://', 'file://')
      const filePath = fileURLToPath(fileUrl)
      if (fsSync.existsSync(filePath)) {
        callback({ path: filePath })
      } else {
        console.error('File not found for protocol request:', filePath)
        callback({ error: -6 })
      }
    } catch (error) {
      console.error('Protocol handler error:', error, 'for URL:', request.url)
      callback({ error: -2 })
    }
  })

  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// --- IPC HANDLERS ---

// Get path to favorites and create it if needed
ipcMain.handle('get-favorites-dir', () => {
  const picturesPath = app.getPath('pictures')
  const favoritesPath = path.join(picturesPath, 'Starred Images')

  // Create the directory on first run if it doesn't exist
  if (!fsSync.existsSync(favoritesPath)) {
    fsSync.mkdirSync(favoritesPath, { recursive: true })
  }

  // Initialize starred cache
  if (starredCacheDir !== favoritesPath) {
    starredCacheDir = favoritesPath
    starredCache.clear()
    try {
      const files = fsSync.readdirSync(favoritesPath)
      files.forEach(f => starredCache.set(f, true))
    } catch (e) {}
  }

  return favoritesPath
})

// Check if an image is starred (with caching)
ipcMain.handle('is-image-starred', async (event, sourcePath) => {
  const basename = path.basename(sourcePath)
  if (starredCache.has(basename)) {
    return starredCache.get(basename)
  }
  const picturesPath = app.getPath('pictures')
  const favoritesPath = path.join(picturesPath, 'Starred Images')
  const destinationPath = path.join(favoritesPath, basename)
  const exists = fsSync.existsSync(destinationPath)
  starredCache.set(basename, exists)
  return exists
})

// Copy an image to the favorites directory or remove if already there
ipcMain.handle('star-image', async (event, sourcePath) => {
  try {
    const picturesPath = app.getPath('pictures')
    const favoritesPath = path.join(picturesPath, 'Starred Images')
    const basename = path.basename(sourcePath)
    const destinationPath = path.join(favoritesPath, basename)

    // Check if file already exists - if so, return info for toggle
    if (fsSync.existsSync(destinationPath)) {
      return { success: true, exists: true, starredPath: destinationPath }
    }

    // Perform the copy
    await fs.copyFile(sourcePath, destinationPath)
    starredCache.set(basename, true)
    return { success: true, exists: false, message: 'Image copied to Starred folder.' }
  } catch (error) {
    console.error('Failed to star image:', error)
    throw new Error(`Could not copy file: ${error.message}`)
  }
})

ipcMain.handle('unstar-image', async (event, starredPath) => {
  try {
    if (!fsSync.existsSync(starredPath)) {
      throw new Error('File not found in starred folder')
    }
    await movePathsToTrash([starredPath])
    starredCache.set(path.basename(starredPath), false)
    return { success: true }
  } catch (error) {
    console.error('Failed to unstar image:', error)
    throw new Error(`Could not remove from starred: ${error.message}`)
  }
})

ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select Image Directory'
  })
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0]
  }
  return null
})

ipcMain.handle('get-images', async (event, dirPath) => {
  try {
    const normalizedDirPath = path.normalize(dirPath)
    if (!fsSync.existsSync(normalizedDirPath)) {
      throw new Error('Directory does not exist')
    }
    const imageExtensions = ['**/*.{jpg,jpeg,png,gif,bmp,webp,svg,tiff,tif,avif,heic,heif,ico}']
    const files = await fastGlob(imageExtensions, {
      cwd: normalizedDirPath,
      absolute: true,
      caseSensitiveMatch: false,
      onlyFiles: true,
      followSymbolicLinks: false,
      stats: true // Get stats in one pass
    })

    // Process files in batches for better performance
    const BATCH_SIZE = 100
    const images = []

    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const batch = files.slice(i, i + BATCH_SIZE)
      const batchResults = await Promise.all(
        batch.map(async entry => {
          try {
            const filePath = entry.path
            const stats = entry.stats
            const relativePath = path.relative(normalizedDirPath, filePath)
            const fileUrl = pathToFileURL(filePath).href
            const customUrl = fileUrl.replace('file://', 'local-image://')

            return {
              name: path.basename(filePath),
              path: relativePath,
              fullPath: filePath,
              size: stats.size,
              lastModified: stats.mtime.getTime(),
              directory: path.dirname(relativePath) === '.' ? 'Root' : path.dirname(relativePath),
              url: customUrl
            }
          } catch (error) {
            return null
          }
        })
      )
      images.push(...batchResults.filter(img => img !== null))
    }

    return images.sort((a, b) => a.name.localeCompare(b.name))
  } catch (error) {
    console.error('Get images error:', error)
    throw new Error(`Failed to scan directory: ${error.message}`)
  }
})

ipcMain.handle('delete-image', async (event, filePaths) => {
  try {
    const pathsToDelete = Array.isArray(filePaths) ? filePaths : [filePaths]
    if (pathsToDelete.length === 0) return true

    const normalizedPaths = pathsToDelete.map(p => path.normalize(p))
    await movePathsToTrash(normalizedPaths)
    return true
  } catch (error) {
    console.error('Delete error:', error)
    throw new Error(`Failed to delete files: ${error.message}`)
  }
})

ipcMain.handle('open-file-location', async (event, filePath) => {
  try {
    const normalizedPath = path.normalize(filePath)
    if (!fsSync.existsSync(normalizedPath)) {
      throw new Error('File does not exist')
    }
    shell.showItemInFolder(normalizedPath)
    return true
  } catch (error) {
    console.error('Open file location error:', error)
    const parentDir = path.dirname(filePath)
    if (fsSync.existsSync(parentDir)) {
      await shell.openPath(parentDir)
      return true
    }
    throw new Error(`Failed to open file location: ${error.message}`)
  }
})

ipcMain.handle('save-edited-image', async (event, { originalPath, dataUrl, suffix }) => {
  try {
    const dir = path.dirname(originalPath)
    const ext = path.extname(originalPath)
    const base = path.basename(originalPath, ext)
    const newPath = path.join(dir, `${base}_${suffix}${ext}`)

    const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '')
    await fs.writeFile(newPath, Buffer.from(base64Data, 'base64'))
    return { success: true, path: newPath }
  } catch (error) {
    console.error('Save edited image error:', error)
    throw new Error(`Failed to save image: ${error.message}`)
  }
})

ipcMain.handle('copy-image-to-clipboard', async (event, filePath) => {
  try {
    const image = nativeImage.createFromPath(filePath)
    clipboard.writeImage(image)
    return { success: true }
  } catch (error) {
    console.error('Copy to clipboard error:', error)
    throw new Error(`Failed to copy: ${error.message}`)
  }
})

ipcMain.handle('rename-image', async (event, { oldPath, newName }) => {
  try {
    const dir = path.dirname(oldPath)
    const newPath = path.join(dir, newName)
    if (fsSync.existsSync(newPath)) {
      throw new Error('A file with that name already exists')
    }
    // Copy instead of rename to preserve original
    await fs.copyFile(oldPath, newPath)
    return { success: true, newPath }
  } catch (error) {
    console.error('Rename (copy) error:', error)
    throw new Error(`Failed to copy with new name: ${error.message}`)
  }
})

// --- i18n HANDLERS ---

ipcMain.handle('get-system-locale', () => {
  return app.getLocale()
})

ipcMain.handle('get-locale-data', async (event, locale) => {
  // Handle both development and production paths
  let localesPath = path.join(__dirname, 'locales')
  console.log('Looking for locales in:', localesPath)

  if (!fsSync.existsSync(localesPath)) {
    // In production, locales are in resources folder
    localesPath = path.join(process.resourcesPath, 'locales')
    console.log('Dev path not found, trying production path:', localesPath)
  }

  // Mapping for locale variants
  const localeMapping = {
    'zh': 'zh-CN',
    'zh-Hans': 'zh-CN',
    'zh-Hant': 'zh-CN',
    'zh-TW': 'zh-CN',
    'zh-HK': 'zh-CN',
    'ja-JP': 'ja'
  }

  // Normalize locale
  let normalizedLocale = localeMapping[locale] || locale
  console.log('Requested locale:', locale, '-> Normalized:', normalizedLocale)

  // Try exact match first
  let localePath = path.join(localesPath, `${normalizedLocale}.json`)
  if (!fsSync.existsSync(localePath)) {
    // Try language code only (e.g., 'en-US' -> 'en')
    const langCode = normalizedLocale.split('-')[0]
    localePath = path.join(localesPath, `${langCode}.json`)
    console.log('Exact match not found, trying language code:', langCode)
  }

  // Fallback to English
  if (!fsSync.existsSync(localePath)) {
    localePath = path.join(localesPath, 'en.json')
    console.log('Falling back to English')
  }

  console.log('Final locale path:', localePath)

  try {
    const data = await fs.readFile(localePath, 'utf-8')
    const parsed = JSON.parse(data)
    console.log('Loaded locale:', path.basename(localePath, '.json'), 'with', Object.keys(parsed).length, 'top-level keys')
    return { locale: path.basename(localePath, '.json'), data: parsed }
  } catch (error) {
    console.error('Failed to load locale:', error)
    // Return empty object as fallback
    return { locale: 'en', data: {} }
  }
})

ipcMain.handle('get-available-locales', async () => {
  // Handle both development and production paths
  let localesPath = path.join(__dirname, 'locales')
  if (!fsSync.existsSync(localesPath)) {
    localesPath = path.join(process.resourcesPath, 'locales')
  }

  try {
    const files = await fs.readdir(localesPath)
    return files
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''))
  } catch (error) {
    console.error('Failed to list locales:', error)
    return ['en']
  }
})
