const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  getImages: (dirPath) => ipcRenderer.invoke('get-images', dirPath),
  deleteImage: (filePath) => ipcRenderer.invoke('delete-image', filePath),
  openFileLocation: (filePath) => ipcRenderer.invoke('open-file-location', filePath)
});