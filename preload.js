const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Window controls
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  close: () => ipcRenderer.invoke('window-close'),

  // Downloads
  getDownloads: () => ipcRenderer.invoke('get-downloads'),
  startDownload: (data) => ipcRenderer.invoke('start-download', data),
  cancelDownload: (id) => ipcRenderer.invoke('cancel-download', id),
  deleteDownload: (id) => ipcRenderer.invoke('delete-download', id),
  clearHistory: () => ipcRenderer.invoke('clear-history'),

  // Video info
  getVideoInfo: (url) => ipcRenderer.invoke('get-video-info', url),

  // File operations
  openDownloadsFolder: () => ipcRenderer.invoke('open-downloads-folder'),
  openFile: (path) => ipcRenderer.invoke('open-file', path),
  showInFolder: (path) => ipcRenderer.invoke('show-in-folder', path),
  selectFolder: () => ipcRenderer.invoke('select-folder'),

  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),

  // Events
  onDownloadProgress: (callback) => {
    ipcRenderer.on('download-progress', (event, data) => callback(data));
  },
  onDownloadComplete: (callback) => {
    ipcRenderer.on('download-complete', (event, data) => callback(data));
  },
  onDownloadError: (callback) => {
    ipcRenderer.on('download-error', (event, data) => callback(data));
  }
});
