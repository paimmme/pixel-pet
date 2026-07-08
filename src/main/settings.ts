import { app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import type { SavedState } from '../shared/app-types'

const SETTINGS_PATH = path.join(app.getPath('userData'), 'pet-state.json')

export function loadState(): SavedState {
  try {
    const data = fs.readFileSync(SETTINGS_PATH, 'utf-8')
    const parsed = JSON.parse(data)
    if (typeof parsed.window?.x === 'number' && typeof parsed.window?.y === 'number') {
      return parsed as SavedState
    }
  } catch {
    /* use defaults */
  }
  return { window: { x: -1, y: -1 } }
}

export function patchState(partial: Partial<SavedState>): void {
  const current = loadState()
  saveState({
    window: partial.window ?? current.window,
    selection: partial.selection ?? current.selection,
    settings: partial.settings ?? current.settings,
  })
}

export function saveState(state: SavedState): void {
  try {
    fs.mkdirSync(path.dirname(SETTINGS_PATH), { recursive: true })
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(state, null, 2))
  } catch (err) {
    console.error('Failed to save state:', err)
  }
}
