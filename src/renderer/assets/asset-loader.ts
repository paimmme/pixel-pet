import type { AnimalDef, ActionDef, PoseTemplate, ComposeConfig, PaletteDef, PaletteMap } from '../engine/types'
import { getAnimal, getAction } from './catalog'
import { ANIMAL_FACTORIES, type TestAssets } from './test-factory'
import { AssetCache } from './asset-cache'

export class AssetLoader {
  private assetCache = new Map<string, TestAssets>()
  private loading = new Map<string, Promise<TestAssets>>()
  private frameCache: AssetCache

  constructor(frameCache?: AssetCache) {
    this.frameCache = frameCache ?? new AssetCache()
  }

  private async ensureLoaded(animalId: string, resolution: number): Promise<TestAssets> {
    const key = `${animalId}_${resolution}`
    const cached = this.assetCache.get(key)
    if (cached) return cached

    const pending = this.loading.get(key)
    if (pending) return pending

    const promise = Promise.resolve().then(() => {
      const factory = ANIMAL_FACTORIES[animalId]
      if (!factory) throw new Error(`No asset factory for animal: ${animalId}`)
      const assets = factory(resolution)
      this.assetCache.set(key, assets)
      this.loading.delete(key)
      return assets
    })
    this.loading.set(key, promise)
    return promise
  }

  async loadAnimalParts(animalId: string, resolution: number, layers: Array<{ id: string }>): Promise<Map<string, ImageBitmap>> {
    const assets = await this.ensureLoaded(animalId, resolution)
    const result = new Map<string, ImageBitmap>()
    for (const layer of layers) {
      const bitmap = assets.parts.get(layer.id)
      if (bitmap) result.set(layer.id, bitmap)
    }
    return result
  }

  async loadPoseTemplate(actionId: string, resolution: number, animalId?: string): Promise<PoseTemplate> {
    const assets = await this.ensureLoaded(animalId ?? 'raccoon', resolution)
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
    const assets = await this.ensureLoaded(animalId, resolution)
    const result = new Map<string, Map<number, ImageBitmap>>()
    for (const pose of poseFrames) {
      for (const [layerId, transform] of Object.entries(pose.parts)) {
        if (transform.override) {
          const sheetKey = `${actionId}_${transform.override.layer}`
          const sheet = assets.overrides.get(sheetKey)
          if (sheet && !result.has(sheetKey)) result.set(sheetKey, sheet)
        }
      }
    }
    return result
  }

  async loadPalette(paletteId: string, animalId?: string): Promise<PaletteDef> {
    const assets = await this.ensureLoaded(animalId ?? 'raccoon', 32)
    const palette = assets.palettes.find(p => p.id === paletteId)
    if (palette) return palette
    // Fallback to first palette
    return assets.palettes[0] ?? { id: 'default', name: 'Default', mappings: [] }
  }

  async loadAccessory(accessoryId: string, resolution: number): Promise<ImageBitmap | undefined> {
    const assets = await this.ensureLoaded('raccoon', resolution)
    const key = `accessory_${accessoryId}`
    return assets.parts.get(key)
  }

  getFrameCache(): AssetCache {
    return this.frameCache
  }

  clearCache(): void {
    this.frameCache.clear()
    this.assetCache.clear()
    this.loading.clear()
  }
}
