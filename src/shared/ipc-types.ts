import type { SavedState } from './app-types'

export const IPC_CHANNELS = {
  SET_IGNORE_MOUSE_EVENTS: 'set-ignore-mouse-events',
  GET_WINDOW_BOUNDS: 'get-window-bounds',
  MOVE_WINDOW: 'move-window',
  SAVE_STATE: 'save-state',
  GET_DISPLAY_INFO: 'get-display-info',
  CENTER_WINDOW: 'center-window',
  QUIT_APP: 'quit-app',
  SET_AUTO_LAUNCH: 'set-auto-launch',
  GET_DIAGNOSTICS: 'get-diagnostics'
} as const

export interface ElectronAPI {
  setIgnoreMouseEvents(ignore: boolean, options?: { forward?: boolean }): void
  getWindowBounds(): Promise<{ x: number; y: number; width: number; height: number }>
  moveWindow(x: number, y: number): void
  getDisplayInfo(): Promise<{ x: number; y: number; width: number; height: number }>
  saveState(state: Partial<SavedState>): void
  onAction(callback: (action: string) => void): () => void
  onRestoreState(callback: (state: SavedState) => void): () => void
  centerWindow(): void
  quitApp(): void
  setAutoLaunch(enabled: boolean): void
  getDiagnostics(): Promise<{
    version: string
    platform: string
    electronVersion: string
    uptimeMs: number
    windowBounds: { x: number; y: number; width: number; height: number }
  }>
}
