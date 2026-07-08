import type { ElectronAPI } from '../../shared/ipc-types'
import type { Direction } from './types'

export interface MovementController {
  moveTo(targetX: number, targetY: number): void
  tick(dt: number): void
  stop(): void
  readonly isMoving: boolean
  readonly target: { x: number; y: number } | null
  readonly currentDirection: Direction
}

export interface MoveCompleteCallback {
  (): void
}

/**
 * Creates a movement controller that smoothly interpolates window position.
 * 
 * Speed: 300px/s
 * On arrival: calls onComplete callback and stops
 */
export function createMovementController(
  api: ElectronAPI,
  onComplete?: MoveCompleteCallback
): MovementController {
  let currentTarget: { x: number; y: number } | null = null
  let moving = false
  let initializing = false
  let startX = 0
  let startY = 0
  let traveledX = 0
  let traveledY = 0
  let totalDistance = 0
  let currentDirection: Direction = 'down'

  function updateDirection(dx: number, dy: number): void {
    if (Math.abs(dx) > Math.abs(dy)) {
      currentDirection = dx > 0 ? 'right' : 'left'
    } else if (dy !== 0) {
      currentDirection = dy > 0 ? 'down' : 'up'
    }
    // If dx === 0 && dy === 0, keep current direction
  }

  const SPEED = 300 // px/s

  function moveTo(targetX: number, targetY: number): void {
    // Stop any current movement
    currentTarget = { x: targetX, y: targetY }
    initializing = true
    traveledX = 0
    traveledY = 0
    totalDistance = 0
    // Get current position
    api.getWindowBounds().then(bounds => {
      startX = bounds.x
      startY = bounds.y
      const dx = targetX - startX
      const dy = targetY - startY
      totalDistance = Math.sqrt(dx * dx + dy * dy)
      if (dx !== 0 || dy !== 0) {
        updateDirection(dx, dy)
      }
      initializing = false
      moving = true
    })
  }

  function tick(dt: number): void {
    if (!moving || !currentTarget || initializing) return

    const seconds = dt / 1000
    const step = SPEED * seconds

    const dx = currentTarget.x - startX
    const dy = currentTarget.y - startY
    const remaining = Math.sqrt(
      Math.pow(currentTarget.x - (startX + traveledX), 2) +
      Math.pow(currentTarget.y - (startY + traveledY), 2)
    )

    if (remaining <= step) {
      // Arrived
      api.moveWindow(currentTarget.x, currentTarget.y)
      moving = false
      currentTarget = null
      onComplete?.()
      return
    }

    // Move by step along the direction vector
    const ratio = step / remaining
    const moveDx = dx * ratio
    const moveDy = dy * ratio
    traveledX += moveDx
    traveledY += moveDy

    api.moveWindow(
      Math.round(startX + traveledX),
      Math.round(startY + traveledY)
    )
  }

  function stop(): void {
    moving = false
    initializing = false
    currentTarget = null
  }

  return {
    moveTo,
    tick,
    stop,
    get isMoving() { return moving },
    get target() { return currentTarget },
    get currentDirection() { return currentDirection }
  }
}
