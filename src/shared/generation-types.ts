import type { ActionPackManifest } from './pack-types'

/** Status of an AI generation job */
export type GenerationJobStatus = 'queued' | 'running' | 'completed' | 'failed'

/** Input for character generation from an image */
export interface CharacterGenerationInput {
  imageData: string  // base64-encoded image data
  imageMimeType: string
  resolution?: number          // 16 or 32 (default: 32)
  maxPaletteColors?: number    // Palette size limit (default: 16)
  preferredPalette?: string    // Optional palette ID to guide colors
}

/** Result after character generation completes */
export interface CharacterGenerationResult {
  packId: string
  packName: string
  /** Base64-encoded PNG data for each layer, keyed by "{resolution}/{layerId}" */
  layers: Record<string, string>
  /** Expression variants, keyed by "{resolution}/{type}_{variant}" */
  expressionParts?: Record<string, string>
  /** Palette mappings */
  palettes: Array<{ id: string; name: string; mappings: Array<{ from: number[]; to: number[] }> }>
  /** Suggested layout metadata */
  layersOrder: Array<{ id: string; name: string; zIndex: number }>
  /** Validation errors if the generated output needs correction */
  validationIssues?: string[]
}

// ──────────────────────────────────────
// Action Generation
// ──────────────────────────────────────

/** Input for action generation from a text prompt */
export interface ActionGenerationInput {
  prompt: string
  /** The character ID this action is generated against (for rig compatibility) */
  characterId: string
  /** Pack ID if the character is from a pack (for layer set reference) */
  characterPackId?: string
  resolution?: number
}

/** A single pose frame in the generated action */
export interface GeneratedPoseFrame {
  index: number
  parts: Record<string, { dx: number; dy: number; rotation?: number }>
}

/** Pose data for one direction */
export interface GeneratedDirectionPoses {
  [direction: string]: GeneratedPoseFrame[]
}

/** Structured action plan from AI */
export interface ActionSemanticPlan {
  name: string
  category: string
  loop: boolean
  /** Number of frames in the action */
  frameCount: number
  fps: number
  directions: string[] | null
  /** Phase names for the action */
  phases: string[]
  /** Which layers need per-frame PNG overrides (layers whose motion can't be expressed as transforms alone) */
  needsOverrideFrames: string[]
  /** Human-readable notes from the AI */
  notes?: string
}

/** Result after action generation completes */
export interface ActionGenerationResult {
  packId: string
  packName: string
  /** The generated action semantic plan */
  plan: ActionSemanticPlan
  /** Pose data by resolution, keyed by resolution string — e.g. "32" */
  poses: Record<string, {
    action: string
    resolution: number
    directions: GeneratedDirectionPoses
  }>
  /** Override frames that couldn't be expressed as transforms, keyed by "{resolution}/{layerId}_{frameIndex}" */
  overridePngs?: Record<string, string>
  /** Validation issues detected during generation */
  validationIssues?: string[]
}

// ──────────────────────────────────────
// Job types
// ──────────────────────────────────────

export type GenerationInput = CharacterGenerationInput | ActionGenerationInput
export type GenerationResult = CharacterGenerationResult | ActionGenerationResult

/** A generation job tracked in the system */
export interface GenerationJob {
  id: string
  type: 'character' | 'action'
  status: GenerationJobStatus
  progress: number  // 0-100
  input: GenerationInput | null
  result: GenerationResult | null
  error?: string
  createdAt: number
  completedAt?: number
}

/** Provider interface — swap implementations for different AI backends */
export interface GenerationProvider {
  name: string
  /** Generate a character pack from an input image */
  generateCharacter(input: CharacterGenerationInput, onProgress?: (pct: number) => void): Promise<CharacterGenerationResult>
  /** Generate an action pack from a text prompt */
  generateAction(input: ActionGenerationInput, onProgress?: (pct: number) => void): Promise<ActionGenerationResult>
  /** Check if the provider is configured and ready */
  isAvailable(): boolean
}
