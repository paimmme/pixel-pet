import type { CharacterPackSummary, ActionPackSummary, CharacterPackManifest, ActionPackManifest } from '../../shared/pack-types'
import type { PoseTemplate, PaletteDef } from '../engine/types'

/**
 * Renderer-side bridge to file-backed pack assets.
 * Reads PNG/JSON data from the main process via IPC and converts to renderer objects.
 */
export class PackAssetSource {
  constructor(private api: typeof window.electronAPI) {}

  // ── Queries ──

  async listCharacters(): Promise<CharacterPackSummary[]> {
    try {
      return await this.api.listCharacterPacks()
    } catch {
      return []
    }
  }

  async listActions(): Promise<ActionPackSummary[]> {
    try {
      return await this.api.listActionPacks()
    } catch {
      return []
    }
  }

  async getCharacterManifest(id: string): Promise<CharacterPackManifest | null> {
    try {
      return await this.api.getCharacterPackManifest(id)
    } catch {
      return null
    }
  }

  async getActionManifest(id: string): Promise<ActionPackManifest | null> {
    try {
      return await this.api.getActionPackManifest(id)
    } catch {
      return null
    }
  }

  /** Check if a character pack exists */
  async hasCharacter(id: string): Promise<boolean> {
    const manifest = await this.getCharacterManifest(id)
    return manifest !== null
  }

  // ── Asset loading ──

  /** Load a layer part PNG as ImageBitmap */
  async loadLayerBitmap(characterId: string, layerId: string, resolution: number): Promise<ImageBitmap | null> {
    const bytes = await this.readPackBytes(characterId, `parts/${resolution}/${layerId}.png`)
    if (!bytes) return null
    return this.bytesToImageBitmap(bytes)
  }

  /** Load a palette definition JSON */
  async loadPaletteDef(characterId: string, paletteId: string): Promise<PaletteDef | null> {
    const bytes = await this.readPackBytes(characterId, `palettes/${paletteId}.json`)
    if (!bytes) return null
    try {
      const decoder = new TextDecoder()
      return JSON.parse(decoder.decode(bytes)) as PaletteDef
    } catch {
      return null
    }
  }

  /** Load a pose template JSON for an action */
  async loadPoseTemplate(actionId: string, resolution: number): Promise<PoseTemplate | null> {
    const bytes = await this.readPackBytes(actionId, `poses/${resolution}.json`)
    if (!bytes) return null
    try {
      const decoder = new TextDecoder()
      return JSON.parse(decoder.decode(bytes)) as PoseTemplate
    } catch {
      return null
    }
  }

  /** Load an override spritesheet frame as ImageBitmap */
  async loadOverrideFrame(actionId: string, characterId: string, layerId: string, frame: number, resolution: number): Promise<ImageBitmap | null> {
    const bytes = await this.readPackBytes(actionId, `overrides/${characterId}/${resolution}/${layerId}_${frame}.png`)
    if (!bytes) return null
    return this.bytesToImageBitmap(bytes)
  }

  /** Load an expression part (eyes/mouth variant) */
  async loadExpressionPart(characterId: string, partType: string, variant: string, resolution: number): Promise<ImageBitmap | null> {
    const bytes = await this.readPackBytes(characterId, `expression/${resolution}/${partType}_${variant}.png`)
    if (!bytes) return null
    return this.bytesToImageBitmap(bytes)
  }

  // ── Internal ──

  private async readPackBytes(packId: string, relativePath: string): Promise<Uint8Array | null> {
    try {
      return await this.api.readPackAsset(packId, relativePath)
    } catch {
      return null
    }
  }

  private async bytesToImageBitmap(bytes: Uint8Array): Promise<ImageBitmap> {
    const blob = new Blob([bytes as BlobPart], { type: 'image/png' })
    return createImageBitmap(blob)
  }
}
