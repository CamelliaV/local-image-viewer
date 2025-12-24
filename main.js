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
const fs = require('fs').promises // Use promises for async operations
const fsSync = require('fs')
const fastGlob = require('fast-glob')
const { pathToFileURL, fileURLToPath } = require('url')

let mainWindow

app.disableHardwareAcceleration()

let trash
;(async () => {
  try {
    trash = (await import('trash')).default
  } catch (err) {
    console.error('Failed to load trash module:', err)
  }
})()

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
  return favoritesPath
})

// Check if an image is starred
ipcMain.handle('is-image-starred', async (event, sourcePath) => {
  const picturesPath = app.getPath('pictures')
  const favoritesPath = path.join(picturesPath, 'Starred Images')
  const destinationPath = path.join(favoritesPath, path.basename(sourcePath))
  return fsSync.existsSync(destinationPath)
})

// Copy an image to the favorites directory or remove if already there
ipcMain.handle('star-image', async (event, sourcePath) => {
  try {
    const picturesPath = app.getPath('pictures')
    const favoritesPath = path.join(picturesPath, 'Starred Images')
    const destinationPath = path.join(favoritesPath, path.basename(sourcePath))

    // Check if file already exists - if so, return info for toggle
    if (fsSync.existsSync(destinationPath)) {
      return { success: true, exists: true, starredPath: destinationPath }
    }

    // Perform the copy
    await fs.copyFile(sourcePath, destinationPath)
    console.log('Copied to stars:', destinationPath)
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
    if (!trash) {
      trash = (await import('trash')).default
    }
    await trash([starredPath])
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
      followSymbolicLinks: false
    })

    const images = await Promise.all(
      files.map(async filePath => {
        try {
          const normalizedFilePath = path.normalize(filePath)
          if (!fsSync.existsSync(normalizedFilePath)) return null

          const stats = await fs.stat(normalizedFilePath)
          const relativePath = path.relative(
            normalizedDirPath,
            normalizedFilePath
          )

          const fileUrl = pathToFileURL(normalizedFilePath).href
          const customUrl = fileUrl.replace('file://', 'local-image://')

          return {
            name: path.basename(normalizedFilePath),
            path: relativePath,
            fullPath: normalizedFilePath,
            size: stats.size,
            lastModified: stats.mtime.getTime(),
            directory:
              path.dirname(relativePath) === '.'
                ? 'Root'
                : path.dirname(relativePath),
            url: customUrl
          }
        } catch (error) {
          console.error('Error processing file:', filePath, error)
          return null
        }
      })
    )

    const validImages = images.filter(img => img !== null)
    return validImages.sort((a, b) => a.name.localeCompare(b.name))
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
    if (!trash) {
      trash = (await import('trash')).default
    }
    await trash(normalizedPaths)
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
