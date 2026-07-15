import type { PixelResolution, LayerDef, Rect, ZoneDef, Direction, ActionPhase } from './app-types'

export interface ValidationError {
  field: string
  message: string
}

// ──────────────────────────────────────
// Character Pack
// ──────────────────────────────────────

export interface CharacterPackManifest {
  schemaVersion: 1
  id: string
  name: string
  type: 'character'
  resolutions: PixelResolution[]
  defaultResolution: PixelResolution
  defaultPalette: string
  layers: LayerDef[]
  hitArea: Rect
  zones?: ZoneDef[]
}

export interface CharacterPack {
  manifest: CharacterPackManifest
  rootPath: string
  /** Part PNG paths by layer id — e.g. "body" -> "/path/to/parts/32/body.png" */
  parts: Record<string, string>
  /** Part paths for expression variants — e.g. "expr_eyes_blink0" -> "/path/...png" */
  expressionParts: Record<string, string>
  /** Palette JSON file paths by palette id */
  palettes: Record<string, string>
  /** Preview image path (optional) */
  previewPath?: string
}

export interface CharacterPackSummary {
  id: string
  name: string
  resolutions: PixelResolution[]
  defaultPalette: string
  layerCount: number
  qualityScore?: number
}

// ──────────────────────────────────────
// Action Pack
// ──────────────────────────────────────

export interface ActionPackManifest {
  schemaVersion: 1
  id: string
  name: string
  type: 'action'
  category: string
  frameCount: number
  fps: number
  loop: boolean
  directions: Direction[] | null
  requiredLayers: string[]
  phases?: ActionPhase[]
}

export interface ActionPack {
  manifest: ActionPackManifest
  rootPath: string
  /** Pose JSON file paths by resolution */
  poses: Record<number, string>
  /** Override spritesheet paths by characterId — e.g. "raccoon" -> "/path/overrides/raccoon/" */
  overrides: Record<string, string>
  /** Preview image path (optional) */
  previewPath?: string
}

export interface ActionPackSummary {
  id: string
  name: string
  category: string
  frameCount: number
  fps: number
  loop: boolean
}

// ──────────────────────────────────────
// Import / Export
// ──────────────────────────────────────

export interface PackImportResult {
  success: boolean
  packId?: string
  errors?: ValidationError[]
  qualityScore?: QualityScore | null
}

export type PackSourceEntry = CharacterPack | ActionPack

// ──────────────────────────────────────
// Quality Scoring
// ──────────────────────────────────────

export interface QualityScoreDetails {
  layerCompleteness: number
  resolutionCoverage: number
  expressionVariety: number
  paletteCount: number
  layerAlignment: number
  validColors: number
}

export interface QualityScore {
  overall: number
  details: QualityScoreDetails
  notes: string[]
}
