import type { AnimalDef, ActionDef, PoseTemplate, ComposeConfig, PaletteDef, PaletteMap } from '../engine/types'
import { getAnimal, getAction } from './catalog'
import { ANIMAL_FACTORIES, type TestAssets } from './test-factory'
import { AssetCache } from './asset-cache'
import { PackAssetSource } from './pack-asset-source'

/**
 * AssetLoader with source chain:
 *   1. PackAssetSource (file-backed packs via IPC)
 *   2. FactoryRuntimeSource (current test-factory)
 */
export class AssetLoader {
  private factoryCache = new Map<string, TestAssets>()
  private factoryLoading = new Map<string, Promise<TestAssets>>()
  private frameCache: AssetCache
  private packSource: PackAssetSource
  private packCharacterIds: Set<string> | null = null

  constructor(packSource: PackAssetSource, frameCache?: AssetCache) {
    this.packSource = packSource
    this.frameCache = frameCache ?? new AssetCache()
  }

  /** Warm the pack character ID set for fast lookup */
  private async ensurePackIds(): Promise<Set<string>> {
    if (this.packCharacterIds) return this.packCharacterIds
    const characters = await this.packSource.listCharacters()
    this.packCharacterIds = new Set(characters.map(c => c.id))
    return this.packCharacterIds
  }

  /** Check if a character pack is available */
  async hasPackCharacter(animalId: string): Promise<boolean> {
    const ids = await this.ensurePackIds()
    return ids.has(animalId)
  }

  // ── Factory fallback helpers ──

  private async ensureFactory(animalId: string, resolution: number): Promise<TestAssets> {
    const key = `${animalId}_${resolution}`
    const cached = this.factoryCache.get(key)
    if (cached) return cached

    const pending = this.factoryLoading.get(key)
    if (pending) return pending

    const promise = Promise.resolve().then(() => {
      const factory = ANIMAL_FACTORIES[animalId]
      if (!factory) throw new Error(`No asset factory for animal: ${animalId}`)
      const assets = factory(resolution)
      this.factoryCache.set(key, assets)
      this.factoryLoading.delete(key)
      return assets
    })
    this.factoryLoading.set(key, promise)
    return promise
  }

  // ── Public load API ──

  async loadAnimalParts(animalId: string, resolution: number, layers: Array<{ id: string }>): Promise<Map<string, ImageBitmap>> {
    // Try pack source first
    if (await this.hasPackCharacter(animalId)) {
      const result = new Map<string, ImageBitmap>()
      for (const layer of layers) {
        const bitmap = await this.packSource.loadLayerBitmap(animalId, layer.id, resolution)
        if (bitmap) result.set(layer.id, bitmap)
      }
      if (result.size > 0) return result
    }

    // Fallback to factory
    const assets = await this.ensureFactory(animalId, resolution)
    const result = new Map<string, ImageBitmap>()
    for (const layer of layers) {
      const bitmap = assets.parts.get(layer.id)
      if (bitmap) result.set(layer.id, bitmap)
    }
    return result
  }

  async loadPoseTemplate(actionId: string, resolution: number, animalId?: string): Promise<PoseTemplate> {
    // Try pack source first
    const fromPack = await this.packSource.loadPoseTemplate(actionId, resolution)
    if (fromPack) return fromPack

    // Fallback to factory
    const assets = await this.ensureFactory(animalId ?? 'raccoon', resolution)
    const pose = assets.poses.get(actionId)
    if (!pose) throw new Error(`Pose template not found: ${actionId}`)
    return pose
  }

  async loadOverridesForPose(
    animalId: string,
    actionId: string,
    resolution: number,
    poseFrames: Array<{ parts: Record<string, { override?: { layer: string; frame: number } }> }>
  ): Promise<Map<string, Map<number, ImageBitmap>>> {
    const result = new Map<string, Map<number, ImageBitmap>>()

    const loadFromPack = await this.hasPackCharacter(animalId)
    for (const pose of poseFrames) {
      for (const [layerId, transform] of Object.entries(pose.parts)) {
        if (transform.override) {
          const sheetKey = `${actionId}_${transform.override.layer}`

          if (loadFromPack) {
            const bitmap = await this.packSource.loadOverrideFrame(
              actionId, animalId, transform.override.layer, transform.override.frame, resolution
            )
            if (bitmap) {
              const sheet = new Map<number, ImageBitmap>()
              sheet.set(transform.override.frame, bitmap)
              if (!result.has(sheetKey)) result.set(sheetKey, sheet)
              else result.get(sheetKey)?.set(transform.override.frame, bitmap)
              continue
            }
          }

          // Fallback to factory
          const assets = await this.ensureFactory(animalId, resolution)
          const sheet = assets.overrides.get(sheetKey)
          if (sheet && !result.has(sheetKey)) result.set(sheetKey, sheet)
        }
      }
    }
    return result
  }

  async loadPalette(paletteId: string, animalId?: string): Promise<PaletteDef> {
    const aid = animalId ?? 'raccoon'

    // Try pack source first
    if (await this.hasPackCharacter(aid)) {
      const fromPack = await this.packSource.loadPaletteDef(aid, paletteId)
      if (fromPack) return fromPack
    }

    // Fallback to factory
    const assets = await this.ensureFactory(aid, 32)
    const palette = assets.palettes.find(p => p.id === paletteId)
    return palette ?? assets.palettes[0] ?? { id: 'default', name: 'Default', mappings: [] }
  }

  async loadAccessory(accessoryId: string, resolution: number): Promise<ImageBitmap | undefined> {
    // Try pack source first — accessories are per character, try 'raccoon' as default
    const fromPack = await this.packSource.loadLayerBitmap('raccoon', `accessory_${accessoryId}`, resolution)
    if (fromPack) return fromPack

    // Fallback to factory
    const assets = await this.ensureFactory('raccoon', resolution)
    const key = `accessory_${accessoryId}`
    return assets.parts.get(key)
  }

  async loadExpressionPart(animalId: string, partType: 'eyes' | 'mouth', variant: string, resolution: number): Promise<ImageBitmap | undefined> {
    // Try pack source first
    if (await this.hasPackCharacter(animalId)) {
      const fromPack = await this.packSource.loadExpressionPart(animalId, partType, variant, resolution)
      if (fromPack) return fromPack
    }

    // Fallback to factory
    const assets = await this.ensureFactory(animalId, resolution)
    const key = `expr_${partType}_${variant}`
    return assets.parts.get(key)
  }

  getFrameCache(): AssetCache {
    return this.frameCache
  }

  clearCache(): void {
    this.frameCache.clear()
    this.factoryCache.clear()
    this.factoryLoading.clear()
    this.packCharacterIds = null
  }
}
