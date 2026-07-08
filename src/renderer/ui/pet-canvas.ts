/**
 * PixelPet display surface.
 *
 * Manages the HTMLCanvasElement for displaying composed frames,
 * handles pixel-perfect scaling, and draws the pupil overlay for
 * eye tracking.
 *
 * Logical resolution: 32×32.  Display scaling: 3× (96×96 CSS px).
 */

export interface DisplaySurface {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  resolution: number
  scale: number
  /** Draw a composed frame with optional pupil offset overlay */
  drawFrame(bitmap: ImageBitmap, pupilOffset?: { dx: number; dy: number }): void
  /** Clear the canvas */
  clear(): void
}

export function createDisplaySurface(
  canvas: HTMLCanvasElement,
  resolution = 32,
  scale = 3,
): DisplaySurface {
  canvas.width = resolution
  canvas.height = resolution
  canvas.style.width = `${resolution * scale}px`
  canvas.style.height = `${resolution * scale}px`

  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = false

  function drawFrame(bitmap: ImageBitmap, pupilOffset?: { dx: number; dy: number }): void {
    ctx.clearRect(0, 0, resolution, resolution)
    ctx.drawImage(bitmap, 0, 0)

    // Overlay pupils at offset position for eye tracking
    if (pupilOffset && (pupilOffset.dx !== 0 || pupilOffset.dy !== 0)) {
      // Default pupil positions in pet-local coordinates
      const LEFT_PUPIL_BASE = { x: 13, y: 11 }
      const RIGHT_PUPIL_BASE = { x: 19, y: 11 }

      ctx.fillStyle = '#000000'
      // Left pupil
      ctx.fillRect(
        LEFT_PUPIL_BASE.x + pupilOffset.dx,
        LEFT_PUPIL_BASE.y + pupilOffset.dy,
        2, 3
      )
      // Right pupil
      ctx.fillRect(
        RIGHT_PUPIL_BASE.x + pupilOffset.dx,
        RIGHT_PUPIL_BASE.y + pupilOffset.dy,
        2, 3
      )
    }
  }

  function clear(): void {
    ctx.clearRect(0, 0, resolution, resolution)
  }

  return { canvas, ctx, resolution, scale, drawFrame, clear }
}
