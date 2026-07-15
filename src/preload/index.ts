import { contextBridge, ipcRenderer } from 'electron'
import type { ElectronAPI } from '../shared/ipc-types'
import { IPC_CHANNELS } from '../shared/ipc-types'
import type { SavedState } from '../shared/app-types'
import type { ActivityInfo } from '../shared/activity-types'
import type { CharacterPackSummary, ActionPackSummary, CharacterPackManifest, ActionPackManifest } from '../shared/pack-types'

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
  onRestoreState: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, state: SavedState) => callback(state)
    ipcRenderer.on('restore-state', handler)
    return () => ipcRenderer.removeListener('restore-state', handler)
  },
  centerWindow: () => ipcRenderer.invoke(IPC_CHANNELS.CENTER_WINDOW),
  quitApp: () => ipcRenderer.send(IPC_CHANNELS.QUIT_APP),
  setAutoLaunch: (enabled) => ipcRenderer.send(IPC_CHANNELS.SET_AUTO_LAUNCH, enabled),
  getDiagnostics: () => ipcRenderer.invoke(IPC_CHANNELS.GET_DIAGNOSTICS),
  onActivityChanged: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, info: ActivityInfo) => callback(info)
    ipcRenderer.on('activity-changed', handler)
    return () => ipcRenderer.removeListener('activity-changed', handler)
  },
  // Pack registry
  listCharacterPacks: () => ipcRenderer.invoke(IPC_CHANNELS.LIST_CHARACTER_PACKS),
  listActionPacks: () => ipcRenderer.invoke(IPC_CHANNELS.LIST_ACTION_PACKS),
  getCharacterPackManifest: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.GET_CHARACTER_PACK_MANIFEST, id),
  getActionPackManifest: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.GET_ACTION_PACK_MANIFEST, id),
  readPackAsset: (packId: string, relativePath: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.READ_PACK_ASSET, packId, relativePath),
  // Pack management
  openPackDialog: () => ipcRenderer.invoke(IPC_CHANNELS.OPEN_PACK_DIALOG),
  importPack: (sourcePath: string) => ipcRenderer.invoke(IPC_CHANNELS.IMPORT_PACK, sourcePath),
  exportPack: (packId: string, kind: 'character' | 'action', destinationPath: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.EXPORT_PACK, packId, kind, destinationPath),
  removePack: (packId: string) => ipcRenderer.invoke(IPC_CHANNELS.REMOVE_PACK, packId),
  openPacksDir: () => ipcRenderer.invoke(IPC_CHANNELS.OPEN_PACKS_DIR),
  getPackQualityScore: (packId: string) => ipcRenderer.invoke(IPC_CHANNELS.GET_PACK_QUALITY_SCORE, packId),
  getEditorPackData: (packId: string) => ipcRenderer.invoke(IPC_CHANNELS.GET_EDITOR_PACK_DATA, packId),
  updatePackPalette: (packId: string, paletteId: string, mappings) => ipcRenderer.invoke(IPC_CHANNELS.UPDATE_PACK_PALETTE, packId, paletteId, mappings),
  replaceLayerPng: (packId: string, layerId: string, resolution) => ipcRenderer.invoke(IPC_CHANNELS.REPLACE_LAYER_PNG, packId, layerId, resolution),
  // AI Generation
  openImageDialog: () => ipcRenderer.invoke(IPC_CHANNELS.OPEN_IMAGE_DIALOG),
  createGenerationJob: (input) => ipcRenderer.invoke(IPC_CHANNELS.CREATE_GENERATION_JOB, input),
  createActionJob: (input) => ipcRenderer.invoke(IPC_CHANNELS.CREATE_ACTION_JOB, input),
  startGeneration: (jobId) => ipcRenderer.invoke(IPC_CHANNELS.START_GENERATION, jobId),
  listGenerationJobs: () => ipcRenderer.invoke(IPC_CHANNELS.LIST_GENERATION_JOBS),
  getGenerationJob: (jobId) => ipcRenderer.invoke(IPC_CHANNELS.GET_GENERATION_JOB, jobId),
  saveGeneratedPack: (jobId) => ipcRenderer.invoke(IPC_CHANNELS.SAVE_GENERATED_PACK, jobId),
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
