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

/** A generation job tracked in the system */
export interface GenerationJob {
  id: string
  type: 'character' | 'action'
  status: GenerationJobStatus
  progress: number  // 0-100
  input: CharacterGenerationInput | null
  result: CharacterGenerationResult | null
  error?: string
  createdAt: number
  completedAt?: number
}

/** Provider interface — swap implementations for different AI backends */
export interface GenerationProvider {
  name: string
  /** Generate a character pack from an input image */
  generateCharacter(input: CharacterGenerationInput, onProgress?: (pct: number) => void): Promise<CharacterGenerationResult>
  /** Check if the provider is configured and ready */
  isAvailable(): boolean
}
