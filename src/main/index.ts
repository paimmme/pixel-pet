import { app, BrowserWindow } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import { createWindow, getWindow, setIgnoreMouseEventsState } from './window-manager'
import { registerIpcHandlers } from './ipc-handlers'
import { createTray } from './tray'
import { loadState, saveState, patchState } from './settings'
import { startActivityDetection } from './activity-detector'

// Crash/diagnostics logging
const crashLogPath = path.join(app.getPath('userData'), 'crash.log')
function logCrash(err: Error): void {
  try {
    const dir = path.dirname(crashLogPath)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    const timestamp = new Date().toISOString()
    const msg = `[${timestamp}] ${err.stack || err.message}\n`
    fs.appendFileSync(crashLogPath, msg)
  } catch {
    // don't crash the crash logger
  }
}
process.on('uncaughtException', (err) => {
  logCrash(err)
})
process.on('unhandledRejection', (reason) => {
  if (reason instanceof Error) logCrash(reason)
})

// Prevent multiple instances
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const win = getWindow()
    if (win && !win.isDestroyed()) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
  })
}

app.whenReady().then(() => {
  // Restore previous window position or center on screen
  const savedState = loadState()
  const win = createWindow(savedState.window.x, savedState.window.y)

  // Register IPC handlers
  registerIpcHandlers(win)

  // Create system tray
  createTray(win)

  // Start foreground activity detection
  const stopActivity = startActivityDetection(win)

  // Load the renderer
  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  // Restore saved state on load
  win.webContents.on('did-finish-load', () => {
    try {
      if (!win.isDestroyed()) {
        win.webContents.send('restore-state', savedState)
      }
    } catch {
      // ignore if already destroyed
    }
  })

  // Save window position on move
  win.on('move', () => {
    try {
      if (!win.isDestroyed()) {
        const bounds = win.getBounds()
        patchState({ window: { x: bounds.x, y: bounds.y } })
      }
    } catch {
      // ignore errors during move
    }
  })

  // Save position before closing
  win.on('close', () => {
    try {
      if (!win.isDestroyed()) {
        const bounds = win.getBounds()
        patchState({ window: { x: bounds.x, y: bounds.y } })
      }
    } catch {
      // ignore errors during close
    }
  })
})

// macOS: don't quit when all windows are closed; hide instead
app.on('window-all-closed', () => {
  if (process.platform === 'darwin') {
    const win = getWindow()
    if (win && !win.isDestroyed()) {
      win.hide()
    }
  } else {
    app.quit()
  }
})

// macOS: re-show window on activate
app.on('activate', () => {
  const win = getWindow()
  if (win && !win.isDestroyed()) {
    win.show()
    win.focus()
  }
})
