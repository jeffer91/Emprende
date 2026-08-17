const { contextBridge, ipcRenderer } = require('electron');

const api = {
  getState: () => ipcRenderer.invoke('app:state'),
  saveInstitution: (data) => ipcRenderer.invoke('institution:save', data),
  listDocuments: () => ipcRenderer.invoke('documents:list'),
  updateDocumentStatus: (payload) => ipcRenderer.invoke('documents:status', payload),
  getDraft: (code) => ipcRenderer.invoke('draft:get', code),
  saveSection: (payload) => ipcRenderer.invoke('draft:save-section', payload),
  generateWord: (code) => ipcRenderer.invoke('document:generate-word', code),
  attachFiles: (code) => ipcRenderer.invoke('document:attach', code),
  getAttachments: (code) => ipcRenderer.invoke('document:attachments', code),
  getVersions: (code) => ipcRenderer.invoke('document:versions', code),
  openFile: (filePath) => ipcRenderer.invoke('file:open', filePath),
  openWorkspace: () => ipcRenderer.invoke('folder:open-workspace'),
  createBackup: () => ipcRenderer.invoke('backup:create'),
};

contextBridge.exposeInMainWorld('emprende', api);
