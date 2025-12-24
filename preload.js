// --- START OF FILE preload.js ---

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  getFavoritesDir: () => ipcRenderer.invoke('get-favorites-dir'),
  isImageStarred: filePath => ipcRenderer.invoke('is-image-starred', filePath),
  starImage: filePath => ipcRenderer.invoke('star-image', filePath),
  unstarImage: starredPath => ipcRenderer.invoke('unstar-image', starredPath),

  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  getImages: dirPath => ipcRenderer.invoke('get-images', dirPath),
  deleteImage: filePaths => ipcRenderer.invoke('delete-image', filePaths),
  openFileLocation: filePath =>
    ipcRenderer.invoke('open-file-location', filePath),
  saveEditedImage: (originalPath, dataUrl, suffix) =>
    ipcRenderer.invoke('save-edited-image', { originalPath, dataUrl, suffix }),
  copyImageToClipboard: filePath =>
    ipcRenderer.invoke('copy-image-to-clipboard', filePath),
  renameImage: (oldPath, newName) =>
    ipcRenderer.invoke('rename-image', { oldPath, newName })
})
