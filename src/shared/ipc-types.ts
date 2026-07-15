import type { SavedState } from './app-types'
import type { ActivityInfo } from './activity-types'
import type { CharacterPackSummary, ActionPackSummary, CharacterPackManifest, ActionPackManifest, PackImportResult } from './pack-types'
import type { GenerationJob, CharacterGenerationInput, ActionGenerationInput } from './generation-types'

export const IPC_CHANNELS = {
  SET_IGNORE_MOUSE_EVENTS: 'set-ignore-mouse-events',
  GET_WINDOW_BOUNDS: 'get-window-bounds',
  MOVE_WINDOW: 'move-window',
  SAVE_STATE: 'save-state',
  GET_DISPLAY_INFO: 'get-display-info',
  CENTER_WINDOW: 'center-window',
  QUIT_APP: 'quit-app',
  SET_AUTO_LAUNCH: 'set-auto-launch',
  GET_DIAGNOSTICS: 'get-diagnostics',
  ACTIVITY_CHANGED: 'activity-changed',
  // Pack registry
  LIST_CHARACTER_PACKS: 'list-character-packs',
  LIST_ACTION_PACKS: 'list-action-packs',
  GET_CHARACTER_PACK_MANIFEST: 'get-character-pack-manifest',
  GET_ACTION_PACK_MANIFEST: 'get-action-pack-manifest',
  READ_PACK_ASSET: 'read-pack-asset',
  // Pack management
  OPEN_PACK_DIALOG: 'open-pack-dialog',     // Open file dialog for pack selection
  IMPORT_PACK: 'import-pack',               // Import pack from a path
  EXPORT_PACK: 'export-pack',               // Export pack to a path
  REMOVE_PACK: 'remove-pack',               // Remove a pack from the registry
  // AI Generation
  OPEN_IMAGE_DIALOG: 'open-image-dialog',
  CREATE_GENERATION_JOB: 'create-generation-job',
  CREATE_ACTION_JOB: 'create-action-job',
  START_GENERATION: 'start-generation',
  LIST_GENERATION_JOBS: 'list-generation-jobs',
  GET_GENERATION_JOB: 'get-generation-job',
  SAVE_GENERATED_PACK: 'save-generated-pack',
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
  onActivityChanged(callback: (info: ActivityInfo) => void): () => void
  // Pack registry
  listCharacterPacks(): Promise<CharacterPackSummary[]>
  listActionPacks(): Promise<ActionPackSummary[]>
  getCharacterPackManifest(id: string): Promise<CharacterPackManifest | null>
  getActionPackManifest(id: string): Promise<ActionPackManifest | null>
  /** Read raw asset bytes from a pack (PNG/JSON). Returns null if not found. */
  readPackAsset(packId: string, relativePath: string): Promise<Uint8Array | null>
  // Pack management
  openPackDialog(): Promise<{ path: string } | null>
  importPack(sourcePath: string): Promise<PackImportResult>
  exportPack(packId: string, kind: 'character' | 'action', destinationPath: string): Promise<PackImportResult>
  removePack(packId: string): Promise<boolean>
  // AI Generation
  openImageDialog(): Promise<{ data: string; mimeType: string } | null>
  createGenerationJob(input: CharacterGenerationInput): Promise<string>
  createActionJob(input: ActionGenerationInput): Promise<string>
  startGeneration(jobId: string): Promise<void>
  listGenerationJobs(): Promise<GenerationJob[]>
  getGenerationJob(jobId: string): Promise<GenerationJob | null>
  saveGeneratedPack(jobId: string): Promise<PackImportResult>
}
