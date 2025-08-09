// --- START OF FILE preload.js ---

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  getFavoritesDir: () => ipcRenderer.invoke('get-favorites-dir'),
  starImage: filePath => ipcRenderer.invoke('star-image', filePath),

  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  getImages: dirPath => ipcRenderer.invoke('get-images', dirPath),
  deleteImage: filePaths => ipcRenderer.invoke('delete-image', filePaths),
  openFileLocation: filePath =>
    ipcRenderer.invoke('open-file-location', filePath)
})
