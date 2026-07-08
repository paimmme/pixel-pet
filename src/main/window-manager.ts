import { BrowserWindow, app } from 'electron'
import * as path from 'path'

let mainWindow: BrowserWindow | null = null
let ignoreMouseEvents = false

export function createWindow(x?: number, y?: number): BrowserWindow {
  const preloadPath = path.join(__dirname, '../preload/index.js')

  const windowOptions: Electron.BrowserWindowConstructorOptions = {
    width: 128,
    height: 128,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    backgroundColor: '#00000000',
    show: false,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  }

  // Apply saved position if valid
  if (x !== undefined && y !== undefined && x >= 0 && y >= 0) {
    windowOptions.x = x
    windowOptions.y = y
  }

  mainWindow = new BrowserWindow(windowOptions)

  // Prevent white flash by delaying show until ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  // Clean up on close
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  return mainWindow
}

export function getWindow(): BrowserWindow | null {
  return mainWindow
}

export function setIgnoreMouseEventsState(ignore: boolean): void {
  ignoreMouseEvents = ignore
  if (mainWindow && !mainWindow.isDestroyed()) {
    // CRITICAL: forward: true ensures clicks pass through to windows behind
    mainWindow.setIgnoreMouseEvents(ignore, { forward: true })
  }
}

export function getIgnoreMouseEventsState(): boolean {
  return ignoreMouseEvents
}
