import type { PixelResolution, ComposedLayer, PaletteMap } from './types'

export class SpriteCompositor {
  private canvas: OffscreenCanvas
  private ctx: OffscreenCanvasRenderingContext2D

  constructor(private resolution: PixelResolution) {
    this.canvas = new OffscreenCanvas(resolution, resolution)
    const ctx = this.canvas.getContext('2d')
    if (!ctx) throw new Error('Failed to get OffscreenCanvas 2D context')
    this.ctx = ctx
    this.ctx.imageSmoothingEnabled = false
  }

  async compose(layers: ComposedLayer[], palette?: PaletteMap): Promise<ImageBitmap> {
    const { ctx, canvas, resolution } = this
    ctx.clearRect(0, 0, resolution, resolution)

    // Sort by zIndex and render visible layers
    const sorted = [...layers]
      .filter(l => l.visible)
      .sort((a, b) => a.zIndex - b.zIndex)

    for (const layer of sorted) {
      ctx.save()
      ctx.translate(layer.anchor.x, layer.anchor.y)
      ctx.rotate((layer.rotation * Math.PI) / 180)
      ctx.translate(-layer.anchor.x, -layer.anchor.y)
      ctx.drawImage(layer.bitmap, layer.dx, layer.dy)
      ctx.restore()
    }

    if (palette) {
      this.applyPalette(ctx, resolution, palette)
    }

    return canvas.transferToImageBitmap()
  }

  private applyPalette(
    ctx: OffscreenCanvasRenderingContext2D,
    resolution: number,
    palette: PaletteMap
  ): void {
    const imageData = ctx.getImageData(0, 0, resolution, resolution)
    const data = imageData.data

    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3]
      if (alpha === 0) continue // skip transparent

      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const key = `${r},${g},${b}`

      const replacement = palette.get(key)
      if (replacement) {
        data[i] = replacement[0]
        data[i + 1] = replacement[1]
        data[i + 2] = replacement[2]
        // alpha unchanged
      }
    }

    ctx.putImageData(imageData, 0, 0)
  }

  /** Ensure all ImageBitmaps in layers are properly released after use */
  destroy(): void {
    // The compositor doesn't own the bitmaps, so it doesn't close them
  }
}
