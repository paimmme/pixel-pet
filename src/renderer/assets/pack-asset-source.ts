import type { CharacterPackSummary, ActionPackSummary, CharacterPackManifest, ActionPackManifest } from '../../shared/pack-types'
import type { PoseTemplate, PaletteDef } from '../engine/types'
import type { Profiler } from '../engine/profiler'

const MAX_BITMAP_CACHE = 500
const MAX_PALETTE_CACHE = 100

export class PackAssetSource {
  static profiler: Profiler | null = null

  constructor(private api: typeof window.electronAPI) {}

  // ── LRU caches ──

  private bitmapCache = new Map<string, ImageBitmap>()
  private paletteCache = new Map<string, PaletteDef>()

  /** Evict oldest entry if at capacity */
  private evictIfNeeded(cache: Map<string, unknown>, max: number): void {
    if (cache.size >= max) {
      const oldest = cache.keys().next().value
      if (oldest !== undefined) {
        const val = cache.get(oldest)
        if (val instanceof ImageBitmap) (val as ImageBitmap).close()
        cache.delete(oldest)
      }
    }
  }

  private memoKey(...parts: (string | number)[]): string {
    return parts.join(':')
  }

  /** Cache an ImageBitmap with LRU eviction */
  private cacheBitmap(key: string, bitmap: ImageBitmap): ImageBitmap {
    this.evictIfNeeded(this.bitmapCache, MAX_BITMAP_CACHE)
    this.bitmapCache.set(key, bitmap)
    PackAssetSource.profiler?.recordCacheMiss('bitmap')
    return bitmap
  }

  /** Retrieve a cached ImageBitmap */
  private getCachedBitmap(key: string): ImageBitmap | undefined {
    const bmp = this.bitmapCache.get(key)
    if (bmp) {
      PackAssetSource.profiler?.recordCacheHit('bitmap')
    } else {
      PackAssetSource.profiler?.recordCacheMiss('bitmap')
    }
    return bmp
  }

  /** Cache a parsed PaletteDef */
  private cachePalette(key: string, def: PaletteDef): PaletteDef {
    this.evictIfNeeded(this.paletteCache as Map<string, unknown>, MAX_PALETTE_CACHE)
    this.paletteCache.set(key, def)
    PackAssetSource.profiler?.recordCacheMiss('palette')
    return def
  }

  /** Retrieve a cached PaletteDef */
  private getCachedPalette(key: string): PaletteDef | undefined {
    const def = this.paletteCache.get(key)
    if (def) {
      PackAssetSource.profiler?.recordCacheHit('palette')
    } else {
      PackAssetSource.profiler?.recordCacheMiss('palette')
    }
    return def
  }

  /** Clear both caches */
  clearCache(): void {
    for (const v of this.bitmapCache.values()) v.close()
    this.bitmapCache.clear()
    this.paletteCache.clear()
  }

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

  // ── Asset loading (with caching) ──

  /** Load a layer part PNG as ImageBitmap (cached) */
  async loadLayerBitmap(characterId: string, layerId: string, resolution: number): Promise<ImageBitmap | null> {
    const key = this.memoKey(characterId, layerId, resolution)
    const cached = this.getCachedBitmap(key)
    if (cached) return cached

    const bytes = await this.readPackBytes(characterId, `parts/${resolution}/${layerId}.png`)
    if (!bytes) return null

    try {
      const bitmap = await this.bytesToImageBitmap(bytes)
      return this.cacheBitmap(key, bitmap)
    } catch {
      return null
    }
  }

  /** Load a palette definition JSON (cached) */
  async loadPaletteDef(characterId: string, paletteId: string): Promise<PaletteDef | null> {
    const key = this.memoKey(characterId, paletteId)
    const cached = this.getCachedPalette(key)
    if (cached) return cached

    const bytes = await this.readPackBytes(characterId, `palettes/${paletteId}.json`)
    if (!bytes) return null

    try {
      const decoder = new TextDecoder()
      const def = JSON.parse(decoder.decode(bytes)) as PaletteDef
      return this.cachePalette(key, def)
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

  /** Load an override spritesheet frame as ImageBitmap (cached) */
  async loadOverrideFrame(actionId: string, characterId: string, layerId: string, frame: number, resolution: number): Promise<ImageBitmap | null> {
    const key = this.memoKey('ovr', actionId, characterId, layerId, frame, resolution)
    const cached = this.getCachedBitmap(key)
    if (cached) return cached

    const bytes = await this.readPackBytes(actionId, `overrides/${characterId}/${resolution}/${layerId}_${frame}.png`)
    if (!bytes) return null
    try {
      const bitmap = await this.bytesToImageBitmap(bytes)
      return this.cacheBitmap(key, bitmap)
    } catch {
      return null
    }
  }

  /** Load an expression part (eyes/mouth variant) — cached */
  async loadExpressionPart(characterId: string, partType: string, variant: string, resolution: number): Promise<ImageBitmap | null> {
    const key = this.memoKey('expr', characterId, partType, variant, resolution)
    const cached = this.bitmapCache.get(key)
    if (cached) return cached

    const bytes = await this.readPackBytes(characterId, `expression/${resolution}/${partType}_${variant}.png`)
    if (!bytes) return null
    try {
      const bitmap = await this.bytesToImageBitmap(bytes)
      return this.cacheBitmap(key, bitmap)
    } catch {
      return null
    }
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
