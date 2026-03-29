import { contextBridge, ipcRenderer } from 'electron'

export type FileFilter = { name: string; extensions: string[] }

const api = {
  readFile: (filePath: string): Promise<string> =>
    ipcRenderer.invoke('file:read', filePath),

  writeFile: (filePath: string, content: string): Promise<void> =>
    ipcRenderer.invoke('file:write', filePath, content),

  openFile: (filters?: FileFilter[]): Promise<{ filePath: string; content: string } | null> =>
    ipcRenderer.invoke('dialog:openFile', filters),

  saveFile: (defaultName: string, content: string, filters?: FileFilter[]): Promise<string | null> =>
    ipcRenderer.invoke('dialog:saveFile', defaultName, content, filters),

  importImage: (): Promise<{ dataUrl: string; fileName: string; filePath: string } | null> =>
    ipcRenderer.invoke('image:import')
}

contextBridge.exposeInMainWorld('api', api)

export type ElectronAPI = typeof api
