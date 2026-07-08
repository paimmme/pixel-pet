import { PetState } from './pet-state-machine'
import type { PetStateMachine } from './pet-state-machine'
import type { SelectionStore } from './selection-store'
import type { MovementController } from '../engine/movement-controller'
import type { ElectronAPI } from '../../shared/ipc-types'

const MIN_IDLE_MS = 3000
const MARGIN = 50
const MIN_WALK_DISTANCE = 80
const MAX_WALK_DISTANCE = 300

export interface WalkController {
  tick(dt: number): void
  destroy(): void
}

export function createWalkController(
  api: ElectronAPI,
  stateMachine: PetStateMachine,
  selectionStore: SelectionStore,
  movement: MovementController,
  onWalkStart: () => void
): WalkController {
  let idleTimer = 0
  let walking = false
  let destroyed = false
  let screenBounds = { x: 0, y: 0, width: 1280, height: 720 }

  async function getDisplayInfo(): Promise<void> {
    try {
      const info = await api.getDisplayInfo()
      screenBounds = info
    } catch {
      // use defaults
    }
  }

  function pickRandomTarget(): { x: number; y: number } {
    const minX = screenBounds.x + MARGIN
    const maxX = screenBounds.x + screenBounds.width - MARGIN
    const minY = screenBounds.y + MARGIN
    const maxY = screenBounds.y + screenBounds.height - MARGIN

    const targetX = Math.floor(minX + Math.random() * (maxX - minX))
    const targetY = Math.floor(minY + Math.random() * (maxY - minY))

    return { x: targetX, y: targetY }
  }

  function startWalk(): void {
    if (destroyed) return
    const target = pickRandomTarget()
    movement.moveTo(target.x, target.y)
    selectionStore.setDirection(movement.currentDirection)
    walking = true
    idleTimer = 0
    onWalkStart()
  }

  function tick(dt: number): void {
    if (destroyed) return

    const currentState = stateMachine.state

    // While auto-walking, keep direction updated
    if (walking && movement.isMoving) {
      selectionStore.setDirection(movement.currentDirection)
      return
    }

    // Just arrived from auto-walk — reset
    if (walking && !movement.isMoving) {
      walking = false
      idleTimer = 0
      stateMachine.feedEvent({ type: 'animation-complete' })
      return
    }

    // Count idle time
    if (currentState === PetState.Idle && !walking) {
      idleTimer += dt
      if (idleTimer >= MIN_IDLE_MS) {
        startWalk()
      }
    } else if (currentState !== PetState.Idle) {
      // User interacting — reset idle timer
      idleTimer = 0
    }
  }

  function destroy(): void {
    destroyed = true
  }

  // Fetch display info on creation
  getDisplayInfo()

  return { tick, destroy }
}
