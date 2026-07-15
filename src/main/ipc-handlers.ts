import { app, BrowserWindow, ipcMain, screen, dialog } from 'electron'
import { existsSync } from 'fs'
import { join, basename } from 'path'
import { IPC_CHANNELS } from '../shared/ipc-types'
import { saveState, patchState } from './settings'
import type { SavedState, Point } from '../shared/app-types'
import { packRegistry } from './pack-registry'
import { generationService, createJob, getJob, listJobs, ClaudeGenerationProvider } from './generation'

export function registerIpcHandlers(win: BrowserWindow): void {
  // Set ignore mouse events — CRITICAL: forward:true for click-through
  ipcMain.on(IPC_CHANNELS.SET_IGNORE_MOUSE_EVENTS, (_event, ignore: boolean, options?: { forward?: boolean }) => {
    try {
      if (win && !win.isDestroyed()) {
        win.setIgnoreMouseEvents(ignore, { forward: options?.forward ?? true })
      }
    } catch (err) {
      console.error('Failed to set ignore mouse events:', err)
    }
  })

  // Get window bounds
  ipcMain.handle(IPC_CHANNELS.GET_WINDOW_BOUNDS, async () => {
    try {
      if (win && !win.isDestroyed()) {
        return win.getBounds()
      }
      return { x: 0, y: 0, width: 128, height: 128 }
    } catch (err) {
      console.error('Failed to get window bounds:', err)
      return { x: 0, y: 0, width: 128, height: 128 }
    }
  })

  // Get display info for current cursor location
  ipcMain.handle(IPC_CHANNELS.GET_DISPLAY_INFO, async () => {
    try {
      if (win && !win.isDestroyed()) {
        const cursorPoint = screen.getCursorScreenPoint()
        const display = screen.getDisplayNearestPoint(cursorPoint)
        return display.workArea
      }
    } catch (err) {
      console.error('Failed to get display info:', err)
    }
    return { x: 0, y: 0, width: 1920, height: 1080 }
  })

  // Move window to position
  ipcMain.on(IPC_CHANNELS.MOVE_WINDOW, (_event, x: number, y: number) => {
    try {
      if (win && !win.isDestroyed()) {
        const bounds = win.getBounds()
        win.setBounds({ x, y, width: bounds.width, height: bounds.height })
      }
    } catch (err) {
      console.error('Failed to move window:', err)
    }
  })

  // Persist window state
  ipcMain.on(IPC_CHANNELS.SAVE_STATE, (_event, state: SavedState) => {
    try {
      patchState(state)
    } catch (err) {
      console.error('Failed to save state via IPC:', err)
    }
  })

  // Center window on nearest display
  ipcMain.handle(IPC_CHANNELS.CENTER_WINDOW, async () => {
    try {
      if (win && !win.isDestroyed()) {
        const cursorPoint = screen.getCursorScreenPoint()
        const display = screen.getDisplayNearestPoint(cursorPoint)
        const bounds = win.getBounds()
        const x = Math.round(display.workArea.x + (display.workArea.width - bounds.width) / 2)
        const y = Math.round(display.workArea.y + (display.workArea.height - bounds.height) / 2)
        win.setBounds({ x, y, width: bounds.width, height: bounds.height })
      }
    } catch (err) {
      console.error('Failed to center window:', err)
    }
  })

  // Quit app
  ipcMain.on(IPC_CHANNELS.QUIT_APP, () => {
    try {
      app.quit()
    } catch (err) {
      console.error('Failed to quit app:', err)
    }
  })

  // Set auto-launch (start at login)
  ipcMain.on(IPC_CHANNELS.SET_AUTO_LAUNCH, (_event, enabled: boolean) => {
    try {
      app.setLoginItemSettings({ openAtLogin: enabled })
      patchState({ settings: { autoLaunch: enabled } })
    } catch (err) {
      console.error('Failed to set auto-launch:', err)
    }
  })

  // Get diagnostics info
  ipcMain.handle(IPC_CHANNELS.GET_DIAGNOSTICS, async () => {
    try {
      const bounds = win && !win.isDestroyed()
        ? win.getBounds()
        : { x: 0, y: 0, width: 128, height: 128 }
      return {
        version: app.getVersion(),
        platform: process.platform,
        electronVersion: process.versions.electron,
        uptimeMs: process.uptime() * 1000,
        windowBounds: bounds
      }
    } catch (err) {
      console.error('Failed to get diagnostics:', err)
      return {
        version: '0.0.0',
        platform: process.platform,
        electronVersion: 'unknown',
        uptimeMs: 0,
        windowBounds: { x: 0, y: 0, width: 128, height: 128 }
      }
    }
  })

  // ── Pack registry ──

  ipcMain.handle(IPC_CHANNELS.LIST_CHARACTER_PACKS, async () => {
    return packRegistry.listCharacterSummaries()
  })

  ipcMain.handle(IPC_CHANNELS.LIST_ACTION_PACKS, async () => {
    return packRegistry.listActionSummaries()
  })

  ipcMain.handle(IPC_CHANNELS.GET_CHARACTER_PACK_MANIFEST, async (_event, id: string) => {
    const pack = packRegistry.getCharacterById(id)
    return pack?.manifest ?? null
  })

  ipcMain.handle(IPC_CHANNELS.GET_ACTION_PACK_MANIFEST, async (_event, id: string) => {
    const pack = packRegistry.getActionById(id)
    return pack?.manifest ?? null
  })

  ipcMain.handle(IPC_CHANNELS.READ_PACK_ASSET, async (_event, packId: string, relativePath: string) => {
    return packRegistry.readAssetBytes(packId, relativePath)
  })

  // ── Pack management ──

  ipcMain.handle(IPC_CHANNELS.OPEN_PACK_DIALOG, async () => {
    try {
      const result = await dialog.showOpenDialog(win, {
        properties: ['openDirectory'],
        title: 'Select Pack Directory',
        message: 'Choose a character or action pack folder containing manifest.json',
      })
      if (result.canceled || result.filePaths.length === 0) return null
      return { path: result.filePaths[0] }
    } catch (err) {
      console.error('Failed to open pack dialog:', err)
      return null
    }
  })

  ipcMain.handle(IPC_CHANNELS.IMPORT_PACK, async (_event, sourcePath: string) => {
    const packsDir = join(app.getPath('userData'), 'packs')
    return packRegistry.importPack(sourcePath, packsDir)
  })

  ipcMain.handle(IPC_CHANNELS.EXPORT_PACK, async (_event, packId: string, kind: 'character' | 'action', destinationPath: string) => {
    return packRegistry.exportPack(packId, kind, destinationPath)
  })

  ipcMain.handle(IPC_CHANNELS.REMOVE_PACK, async (_event, packId: string) => {
    return packRegistry.removePack(packId)
  })

  // ── Image dialog for AI generation ──

  ipcMain.handle(IPC_CHANNELS.OPEN_IMAGE_DIALOG, async () => {
    try {
      const result = await dialog.showOpenDialog(win, {
        properties: ['openFile'],
        title: 'Select Image for Character Generation',
        filters: [
          { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp'] },
        ],
      })
      if (result.canceled || result.filePaths.length === 0) return null

      const { readFileSync } = await import('fs')
      const filePath = result.filePaths[0]
      const ext = filePath.split('.').pop()?.toLowerCase()
      const mimeMap: Record<string, string> = {
        png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
        gif: 'image/gif', webp: 'image/webp',
      }
      const mimeType = mimeMap[ext ?? ''] || 'image/png'
      const buffer = readFileSync(filePath)
      const data = buffer.toString('base64')

      return { data, mimeType }
    } catch (err) {
      console.error('Failed to open image dialog:', err)
      return null
    }
  })

  // ── AI Generation ──

  // Initialize Claude provider if ANTHROPIC_API_KEY is set
  const anthropicKey = process.env.ANTHROPIC_API_KEY || ''
  if (anthropicKey) {
    const provider = new ClaudeGenerationProvider(anthropicKey)
    generationService.setProvider(provider)
    console.log('[Generation] Claude provider initialized')
  }

  ipcMain.handle(IPC_CHANNELS.CREATE_GENERATION_JOB, async (_event, input) => {
    return createJob('character', input)
  })

  ipcMain.handle(IPC_CHANNELS.CREATE_ACTION_JOB, async (_event, input) => {
    return createJob('action', input)
  })

  ipcMain.handle(IPC_CHANNELS.START_GENERATION, async (_event, jobId: string) => {
    generationService.startGeneration(jobId).catch(err => {
      console.error(`[Generation] Job ${jobId} failed:`, err)
    })
  })

  ipcMain.handle(IPC_CHANNELS.LIST_GENERATION_JOBS, async () => {
    return listJobs()
  })

  ipcMain.handle(IPC_CHANNELS.GET_GENERATION_JOB, async (_event, jobId: string) => {
    return getJob(jobId) ?? null
  })

  ipcMain.handle(IPC_CHANNELS.SAVE_GENERATED_PACK, async (_event, jobId: string) => {
    const job = getJob(jobId)
    if (!job) return { success: false, errors: [{ field: 'job', message: 'Job not found' }] }

    const packsDir = join(app.getPath('userData'), 'packs')

    let packId: string | null = null
    if (job.type === 'character') {
      packId = generationService.saveCharacterResult(jobId, packsDir)
    } else if (job.type === 'action') {
      packId = generationService.saveActionResult(jobId, packsDir)
    }

    if (!packId) return { success: false, errors: [{ field: 'job', message: 'No result to save' }] }

    // Re-scan pack registry to pick up the new pack
    await packRegistry.initialize(packsDir)

    return { success: true, packId }
  })
}
