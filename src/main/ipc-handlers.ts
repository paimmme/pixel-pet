import { app, BrowserWindow, ipcMain, screen } from 'electron'
import { IPC_CHANNELS } from '../shared/ipc-types'
import { saveState, patchState } from './settings'
import type { SavedState, Point } from '../shared/app-types'

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
}
