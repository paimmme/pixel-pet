import type { PetStateMachine } from '../state/pet-state-machine'

export interface GestureDetector {
  /** Call every frame from rAF game loop */
  tick(now: DOMHighResTimeStamp): void
  /** Is the user currently performing a petting gesture? */
  readonly isPetting: boolean
  /** Progress of the petting gesture: 0.0 to 1.0 ratio of direction changes / threshold */
  readonly progress: number
  destroy(): void
}

export interface GestureDetectorOptions {
  canvas: HTMLCanvasElement
  stateMachine: PetStateMachine
  /** Time between pet events in ms (default: 600) */
  cooldown?: number
  /** Minimum direction changes to trigger pet (default: 3) */
  threshold?: number
  /** Direction change detection window in ms (default: 400) */
  window?: number
  /** Called on each direction change with progress 0.0-1.0 */
  onProgress?: (progress: number) => void
}

/**
 * Petting gesture detector.
 * 
 * Tracks mouse position history (pet-local coords).
 * Detects rapid direction changes (back-and-forth motion).
 * Fires 'pet' event to FSM when threshold is exceeded.
 * 
 * Limitations:
 * - Uses pet-local coords (0-31) via toLocalCoords
 * - Ignores samples below 50px/s screen speed (prevents false positives)
 */
export function createGestureDetector(
  options: GestureDetectorOptions
): GestureDetector {
  const { canvas, stateMachine, cooldown = 600, threshold = 3, window: timeWindow = 400, onProgress } = options

  let lastPetTime = 0
  let lastSampleTime = 0
  let petting = false
  let progress = 0
  let lastReportedProgress = 0

  // Position history: stores { x, y, time } samples
  const MAX_SAMPLES = 10
  interface Sample { x: number; y: number; time: number }
  let samples: Sample[] = []

  // Track direction changes
  let directionChanges = 0
  let lastDirection: number | null = null // angle in radians

  function toLocalCoords(clientX: number, clientY: number): { x: number; y: number } | null {
    const rect = canvas.getBoundingClientRect()
    const x = Math.floor((clientX - rect.left) / rect.width * canvas.width)
    const y = Math.floor((clientY - rect.top) / rect.height * canvas.height)
    if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) return null
    return { x, y }
  }

  function onMouseMove(e: MouseEvent): void {
    const now = performance.now()
    const local = toLocalCoords(e.clientX, e.clientY)
    if (!local) return

    // Screen speed check: ignore if moving too slowly
    if (samples.length > 0) {
      const lastSample = samples[samples.length - 1]
      const screenDist = Math.sqrt(
        Math.pow(e.clientX - lastSample.x, 2) +
        Math.pow(e.clientY - lastSample.y, 2)
      )
      // Convert to pet-local velocity approximations
      if (screenDist < 3 && (now - lastSample.time) > 50) {
        // Too slow — don't sample but don't clear either
        return
      }
    }

    samples.push({ x: local.x, y: local.y, time: now })
    if (samples.length > MAX_SAMPLES) {
      samples.shift()
    }

    lastSampleTime = now
  }

  function onMouseLeave(): void {
    samples = []
    directionChanges = 0
    lastDirection = null
    petting = false
    progress = 0
    lastReportedProgress = 0
    if (onProgress) onProgress(0)
  }

  function tick(now: DOMHighResTimeStamp): void {
    // Clean old samples
    const cutoff = now - timeWindow
    while (samples.length > 0 && samples[0].time < cutoff) {
      samples.shift()
    }

    if (samples.length < 2) {
      petting = false
      return
    }

    // Count direction changes in the window
    let changes = 0
    let prevAngle: number | null = null

    for (let i = 1; i < samples.length; i++) {
      const dx = samples[i].x - samples[i - 1].x
      const dy = samples[i].y - samples[i - 1].y

      // Ignore zero-movement samples
      if (dx === 0 && dy === 0) continue

      const angle = Math.atan2(dy, dx)
      if (prevAngle !== null) {
        const diff = Math.abs(angle - prevAngle)
        // Significant direction change (> 60 degrees)
        if (diff > Math.PI / 3) {
          changes++
        }
      }
      prevAngle = angle
    }

    directionChanges = changes
    petting = changes >= threshold

    // Compute progress and report to callback
    progress = Math.min(changes / threshold, 1.0)
    if (onProgress && progress !== lastReportedProgress) {
      lastReportedProgress = progress
      onProgress(progress)
    }

    if (petting && (now - lastPetTime) >= cooldown) {
      lastPetTime = now
      stateMachine.feedEvent({ type: 'pet' })
    }
  }

  function destroy(): void {
    canvas.removeEventListener('mousemove', onMouseMove)
    canvas.removeEventListener('mouseleave', onMouseLeave)
    samples = []
  }

  canvas.addEventListener('mousemove', onMouseMove)
  canvas.addEventListener('mouseleave', onMouseLeave)

  return {
    tick,
    get isPetting() { return petting },
    get progress() { return progress },
    destroy
  }
}
