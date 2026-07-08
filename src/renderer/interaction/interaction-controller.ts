import type { PetStateMachine } from '../state/pet-state-machine'

export type InteractionEventType = 'hover' | 'click' | 'double-click'

export interface InteractionEvent {
  type: InteractionEventType
  localX: number // 0-31 pet-local pixel coordinates
  localY: number
  timestamp: number
}

export type InteractionHandler = (event: InteractionEvent) => void

export interface InteractionController {
  /** Pupil offset for eye tracking: { dx, dy } in pixel coords */
  readonly pupilOffset: { dx: number; dy: number }
  /** Is the pointer currently over the pet (non-transparent area)? */
  readonly isHovering: boolean
  /** Context menu handler — set externally by main.ts */
  onContextMenu: ((x: number, y: number) => void) | null
  /** Cleanup */
  destroy: () => void
}

/**
 * Creates the pet interaction controller.
 *
 * Phase 1 implements:
 * - Cursor-follow eye tracking (pupil offset within ±2px)
 * - Mouse hover/click detection
 * - Event dispatch to PetStateMachine for future reactions
 *
 * Eye tracking works by:
 * 1. Every mousemove converts screen position to pet-local coordinates
 * 2. Calculates vector from each eye center to mouse position
 * 3. Clamps pupil offset to 2px radius
 * 4. On mouse leave, pupils return to center (0,0)
 */
export function createInteractionController(
  canvas: HTMLCanvasElement,
  petStateMachine: PetStateMachine
): InteractionController {
  const pupilOffset = { dx: 0, dy: 0 }
  let isHovering = false
  let lastClickTime = 0

  // Eye center positions (in pet-local 32x32 coordinates)
  const LEFT_EYE_CENTER = { x: 13, y: 12 }
  const RIGHT_EYE_CENTER = { x: 19, y: 12 }
  const MAX_PUPIL_OFFSET = 2

  function toLocalCoords(
    clientX: number,
    clientY: number
  ): { x: number; y: number } | null {
    const rect = canvas.getBoundingClientRect()
    const x = Math.floor(
      ((clientX - rect.left) / rect.width) * canvas.width
    )
    const y = Math.floor(
      ((clientY - rect.top) / rect.height) * canvas.height
    )

    if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) {
      return null
    }
    return { x, y }
  }

  function updatePupilOffset(localX: number, localY: number): void {
    // Average both eye centers
    const eyeCenterX = (LEFT_EYE_CENTER.x + RIGHT_EYE_CENTER.x) / 2
    const eyeCenterY = (LEFT_EYE_CENTER.y + RIGHT_EYE_CENTER.y) / 2

    // Calculate direction from eyes to cursor
    let dx = localX - eyeCenterX
    let dy = localY - eyeCenterY

    // Clamp distance to max offset
    const distance = Math.sqrt(dx * dx + dy * dy)
    if (distance > MAX_PUPIL_OFFSET) {
      dx = (dx / distance) * MAX_PUPIL_OFFSET
      dy = (dy / distance) * MAX_PUPIL_OFFSET
    }

    pupilOffset.dx = Math.round(dx)
    pupilOffset.dy = Math.round(dy)
  }

  function resetPupils(): void {
    pupilOffset.dx = 0
    pupilOffset.dy = 0
  }

  function handleHover(localX: number, localY: number): void {
    isHovering = true
    updatePupilOffset(localX, localY)
  }

  function handleLeave(): void {
    isHovering = false
    resetPupils()
  }

  function handleClick(): void {
    const now = Date.now()
    const isDoubleClick = now - lastClickTime < 300
    lastClickTime = now

    if (isDoubleClick) {
      petStateMachine.feedEvent({ type: 'react' })
    }
  }

  function onMouseMove(e: MouseEvent): void {
    const local = toLocalCoords(e.clientX, e.clientY)
    if (local) {
      handleHover(local.x, local.y)
    } else {
      handleLeave()
    }
  }

  function onMouseLeave(): void {
    handleLeave()
  }

  function onClick(): void {
    if (!isHovering) return
    handleClick()
  }

  canvas.addEventListener('mousemove', onMouseMove)
  canvas.addEventListener('mouseleave', onMouseLeave)
  canvas.addEventListener('click', onClick)

  const instance: InteractionController = {
    pupilOffset,
    get isHovering() {
      return isHovering
    },
    onContextMenu: null,
    destroy: () => {
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mouseleave', onMouseLeave)
      canvas.removeEventListener('click', onClick)
      canvas.removeEventListener('contextmenu', onContextMenu)
    }
  }

  function onContextMenu(e: MouseEvent): void {
    e.preventDefault()
    const local = toLocalCoords(e.clientX, e.clientY)
    if (local) {
      instance.onContextMenu?.(e.clientX, e.clientY)
    }
  }

  canvas.addEventListener('contextmenu', onContextMenu)

  return instance
}
