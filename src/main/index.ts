import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { readFile, writeFile } from 'fs/promises'

const isDev = !app.isPackaged

function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

app.whenReady().then(() => {
  app.setAppUserModelId?.('com.narrativeforge')

  // IPC: Read file from disk
  ipcMain.handle('file:read', async (_event, filePath: string) => {
    const content = await readFile(filePath, 'utf-8')
    return content
  })

  // IPC: Write file to disk
  ipcMain.handle('file:write', async (_event, filePath: string, content: string) => {
    await writeFile(filePath, content, 'utf-8')
  })

  // IPC: Open file dialog
  ipcMain.handle('dialog:openFile', async (_event, filters?: Electron.FileFilter[]) => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: filters || [
        { name: 'Text Files', extensions: ['txt', 'md'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })
    if (result.canceled || result.filePaths.length === 0) return null
    const filePath = result.filePaths[0]
    const content = await readFile(filePath, 'utf-8')
    return { filePath, content }
  })

  // IPC: Save file dialog
  ipcMain.handle('dialog:saveFile', async (_event, defaultName: string, content: string, filters?: Electron.FileFilter[]) => {
    const result = await dialog.showSaveDialog({
      defaultPath: defaultName,
      filters: filters || [
        { name: 'HTML Files', extensions: ['html'] },
        { name: 'Ink Files', extensions: ['ink'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })
    if (result.canceled || !result.filePath) return null
    await writeFile(result.filePath, content, 'utf-8')
    return result.filePath
  })

  // IPC: Open image file and return as base64 data URL
  ipcMain.handle('image:import', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'] }
      ]
    })
    if (result.canceled || result.filePaths.length === 0) return null
    const filePath = result.filePaths[0]
    const buffer = await readFile(filePath)
    const ext = filePath.split('.').pop()?.toLowerCase() || 'png'
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
      webp: 'image/webp', gif: 'image/gif', svg: 'image/svg+xml'
    }
    const mime = mimeTypes[ext] || 'image/png'
    const base64 = Buffer.from(buffer).toString('base64')
    const dataUrl = `data:${mime};base64,${base64}`
    const fileName = filePath.split('/').pop() || `image.${ext}`
    return { dataUrl, fileName, filePath }
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
