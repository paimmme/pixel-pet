export type AnimationCompleteCallback = () => void

export class AnimationController {
  private frames: ImageBitmap[] = []
  private currentIndex = 0
  private lastFrameTime = 0
  private playing = false
  private animFrameId: number | null = null
  private fps = 4
  private loop = false
  private onCompleteCallback: AnimationCompleteCallback | null = null
  private drawCallback: ((bitmap: ImageBitmap) => void) | null = null

  setFrames(frames: ImageBitmap[], fps: number, loop: boolean): void {
    this.stop()
    // Clean up old frames (we don't own them, cache does)
    this.frames = frames
    this.fps = fps
    this.loop = loop
    this.currentIndex = 0
  }

  setDrawCallback(cb: (bitmap: ImageBitmap) => void): void {
    this.drawCallback = cb
  }

  onComplete(callback: AnimationCompleteCallback): void {
    this.onCompleteCallback = callback
  }

  start(): void {
    if (this.playing) return
    if (this.frames.length === 0) return
    this.playing = true
    this.lastFrameTime = performance.now()
    this.currentIndex = 0
    this.tick()
  }

  stop(): void {
    this.playing = false
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId)
      this.animFrameId = null
    }
  }

  destroy(): void {
    this.stop()
    this.frames = []
    this.drawCallback = null
    this.onCompleteCallback = null
  }

  isPlaying(): boolean {
    return this.playing
  }

  currentFrameIndex(): number {
    return this.currentIndex
  }

  private tick = (): void => {
    if (!this.playing) return

    const now = performance.now()
    const elapsed = now - this.lastFrameTime
    const frameDuration = 1000 / this.fps

    if (elapsed >= frameDuration) {
      // Draw current frame
      this.drawCurrentFrame()

      // Advance to next frame
      this.currentIndex++

      if (this.currentIndex >= this.frames.length) {
        if (this.loop) {
          this.currentIndex = 0
        } else {
          this.currentIndex = this.frames.length - 1
          this.playing = false
          // Draw last frame before stopping
          this.drawCurrentFrame()
          this.onCompleteCallback?.()
          return
        }
      }

      this.lastFrameTime = now
    }

    this.animFrameId = requestAnimationFrame(this.tick)
  }

  private drawCurrentFrame(): void {
    if (this.drawCallback && this.currentIndex < this.frames.length) {
      this.drawCallback(this.frames[this.currentIndex])
    }
  }
}
