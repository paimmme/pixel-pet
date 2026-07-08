import type { ComposeConfig } from '../engine/types'
import { createComposeCacheKey } from '../engine/types'

export class AssetCache {
  private cache = new Map<string, ImageBitmap[]>()
  private maxSize: number

  constructor(maxSize = 50) {
    this.maxSize = maxSize
  }

  get(config: ComposeConfig): ImageBitmap[] | undefined {
    const key = createComposeCacheKey(config)
    return this.cache.get(key)
  }

  set(config: ComposeConfig, frames: ImageBitmap[]): void {
    const key = createComposeCacheKey(config)

    // Evict oldest entry if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey !== undefined) {
        const oldFrames = this.cache.get(oldestKey)
        if (oldFrames) {
          oldFrames.forEach(f => f.close())
        }
        this.cache.delete(oldestKey)
      }
    }

    this.cache.set(key, frames)
  }

  has(config: ComposeConfig): boolean {
    return this.cache.has(createComposeCacheKey(config))
  }

  clear(): void {
    for (const frames of this.cache.values()) {
      frames.forEach(f => f.close())
    }
    this.cache.clear()
  }

  get size(): number {
    return this.cache.size
  }
}
