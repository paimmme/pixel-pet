/**
 * Click-through manager.
 *
 * Reads canvas pixel data at the mouse position and toggles
 * `setIgnoreMouseEvents` on the Electron window so that clicks
 * pass through when the pointer is over a transparent pixel.
 *
 * CRITICAL: Every call to `setIgnoreMouseEvents(true)` MUST include
 * `{ forward: true }` so the renderer continues to receive mouse
 * events and hit detection stays alive.
 */

import type { ElectronAPI } from '../../shared/ipc-types'

export interface PointerRouter {
  /** Whether the pointer is currently over a non-transparent pixel. */
  isHit: boolean
  /** Called when a drag starts — changes cursor to 'grabbing'. */
  onDragStart: () => void
  /** Called when a drag ends — restores cursor based on hit state. */
  onDragEnd: () => void
  /** Remove all event listeners and reset state. */
  destroy: () => void
}

export function setupPointerRouter(
  canvas: HTMLCanvasElement,
  electronAPI: ElectronAPI,
): PointerRouter {
  const ctx = canvas.getContext('2d')!
  let isHit = false
  let lastHit = false

  function checkHit(clientX: number, clientY: number): boolean {
    const rect = canvas.getBoundingClientRect()
    const x = Math.floor(((clientX - rect.left) / rect.width) * canvas.width)
    const y = Math.floor(((clientY - rect.top) / rect.height) * canvas.height)

    if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) {
      return false
    }

    const pixel = ctx.getImageData(x, y, 1, 1).data
    return pixel[3] > 0 // alpha > 0 means non-transparent
  }

  function updateIgnoreState(hit: boolean): void {
    if (hit === lastHit) return // no change → skip IPC
    lastHit = hit
    // CRITICAL: forward: true lets the renderer keep receiving mousemove
    // events so hit detection continues to work.
    electronAPI.setIgnoreMouseEvents(!hit, { forward: true })
  }

  function onMouseMove(e: MouseEvent): void {
    isHit = checkHit(e.clientX, e.clientY)
    updateIgnoreState(isHit)
    canvas.style.cursor = isHit ? 'pointer' : 'default'
  }

  function onMouseLeave(): void {
    isHit = false
    updateIgnoreState(false)
    canvas.style.cursor = 'default'
  }

  // Start with click-through enabled (forward: true so we get mouse events)
  electronAPI.setIgnoreMouseEvents(true, { forward: true })
  lastHit = false

  canvas.addEventListener('mousemove', onMouseMove)
  canvas.addEventListener('mouseleave', onMouseLeave)

  return {
    get isHit() {
      return isHit
    },
    onDragStart: () => {
      canvas.style.cursor = 'grabbing'
    },
    onDragEnd: () => {
      canvas.style.cursor = isHit ? 'pointer' : 'default'
    },
    destroy: () => {
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mouseleave', onMouseLeave)
      canvas.style.cursor = 'default'
    },
  }
}
