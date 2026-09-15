import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  store: {
    get: (key: string) => ipcRenderer.invoke('store:get', key),
    set: (key: string, value: any) => ipcRenderer.invoke('store:set', key, value),
    delete: (key: string) => ipcRenderer.invoke('store:delete', key)
  },
  clipboard: {
    writeText: (text: string) => ipcRenderer.invoke('clipboard:writeText', text),
    readText: () => ipcRenderer.invoke('clipboard:readText')
  },
  dialog: {
    openFile: () => ipcRenderer.invoke('dialog:openFile'),
    saveFile: (content: string, defaultName: string) => ipcRenderer.invoke('dialog:saveFile', content, defaultName)
  },
  autoFill: {
    open: (record: any, url: string) => ipcRenderer.invoke('auto-fill:open', { url, record }),
    onStatus: (callback: (message: string) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, message: string) => callback(message);
      ipcRenderer.on('auto-fill:status-update', listener);
      return () => ipcRenderer.removeListener('auto-fill:status-update', listener);
    },
    onError: (callback: (message: string) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, message: string) => callback(message);
      ipcRenderer.on('auto-fill:error-update', listener);
      return () => ipcRenderer.removeListener('auto-fill:error-update', listener);
    },
    onComplete: (callback: (result: string, errorMessage?: string) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, result: string, errorMessage?: string) => callback(result, errorMessage);
      ipcRenderer.on('auto-fill:complete-update', listener);
      return () => ipcRenderer.removeListener('auto-fill:complete-update', listener);
    }
  }
});

export type ElectronAPI = typeof window.electronAPI;
