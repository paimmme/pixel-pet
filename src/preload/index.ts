import { contextBridge, ipcRenderer } from 'electron'
import type { ElectronAPI } from '../shared/ipc-types'
import { IPC_CHANNELS } from '../shared/ipc-types'

const electronAPI: ElectronAPI = {
  setIgnoreMouseEvents: (ignore, options) => {
    ipcRenderer.send(IPC_CHANNELS.SET_IGNORE_MOUSE_EVENTS, ignore, options)
  },
  getWindowBounds: () => ipcRenderer.invoke(IPC_CHANNELS.GET_WINDOW_BOUNDS),
  moveWindow: (x, y) => ipcRenderer.send(IPC_CHANNELS.MOVE_WINDOW, x, y),
  getDisplayInfo: () => ipcRenderer.invoke(IPC_CHANNELS.GET_DISPLAY_INFO),
  saveState: (state) => ipcRenderer.send(IPC_CHANNELS.SAVE_STATE, state),
  onAction: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, action: string) => callback(action)
    ipcRenderer.on('action', handler)
    return () => ipcRenderer.removeListener('action', handler)
  },
  centerWindow: () => ipcRenderer.invoke(IPC_CHANNELS.CENTER_WINDOW),
  quitApp: () => ipcRenderer.send(IPC_CHANNELS.QUIT_APP),
  setAutoLaunch: (enabled) => ipcRenderer.send(IPC_CHANNELS.SET_AUTO_LAUNCH, enabled),
  getDiagnostics: () => ipcRenderer.invoke(IPC_CHANNELS.GET_DIAGNOSTICS)
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
