/**
 * Window drag handler.
 *
 * Drag is initiated only when a mousedown occurs on a non-transparent
 * pixel (checked via the pointer-router's hit state).  During the drag
 * click-through is disabled.  On mouse-up (listened on `window` so that
 * releases outside the canvas are caught) click-through is re-evaluated.
 *
 * CRITICAL: `mouseup` is listened on `window`, not on `canvas`, to
 * prevent the drag from getting stuck when the user releases the mouse
 * outside the canvas bounds (macOS).
 */

import type { ElectronAPI } from '../../shared/ipc-types'

export interface DragHandlerOptions {
  canvas: HTMLCanvasElement
  electronAPI: ElectronAPI
  getIsHit: () => boolean
  onDragStart?: () => void
  onDragEnd?: () => void
}

export interface DragHandler {
  destroy(): void
  readonly isDragging: boolean
}

export function setupDragHandler(options: DragHandlerOptions): DragHandler {
  const { canvas, electronAPI, getIsHit, onDragStart, onDragEnd } = options
  let isDragging = false
  let offsetX = 0
  let offsetY = 0

  async function onMouseDown(e: MouseEvent): Promise<void> {
    // Only start drag if clicking on non-transparent area
    if (!getIsHit()) return

    isDragging = true
    onDragStart?.()
    // Disable click-through during drag
    electronAPI.setIgnoreMouseEvents(false)

    // Get current window position — called once at drag start, not per-frame
    const bounds = await electronAPI.getWindowBounds()
    offsetX = e.screenX - bounds.x
    offsetY = e.screenY - bounds.y
  }

  function onMouseMove(e: MouseEvent): void {
    if (!isDragging) return
    electronAPI.moveWindow(e.screenX - offsetX, e.screenY - offsetY)
  }

  function onMouseUp(): void {
    if (!isDragging) return
    isDragging = false
    onDragEnd?.()

    // Save window position
    electronAPI.getWindowBounds().then((bounds) => {
      electronAPI.saveState({ window: { x: bounds.x, y: bounds.y } })
    })

    // Re-evaluate click-through — check hit state where the mouse is now
    const hit = getIsHit()
    electronAPI.setIgnoreMouseEvents(!hit, { forward: true })
  }

  // Listen on window for mouseup to catch releases outside canvas bounds
  window.addEventListener('mouseup', onMouseUp)
  // Safety net: window blur also ends drag
  window.addEventListener('blur', onMouseUp)

  canvas.addEventListener('mousedown', onMouseDown)

  return {
    get isDragging() {
      return isDragging
    },
    destroy: () => {
      canvas.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('blur', onMouseUp)
      // If dragging, force end
      if (isDragging) {
        isDragging = false
        electronAPI.setIgnoreMouseEvents(true, { forward: true })
      }
    },
  }
}
