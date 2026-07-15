/**
 * PixelPet Context Menu — Apple-inspired floating menu.
 * Fade-in, generous spacing, blue accent hover.
 */

import { injectDesignSystem, FONT_STACK } from './design-system'

export interface ContextMenuAction {
  actionId: string
  label: string
}

export interface ContextMenuOptions {
  actions: ContextMenuAction[]
  onAction: (actionId: string) => void
}

/**
 * Create and show an HTML overlay context menu at the given position.
 */
export function createContextMenu(
  canvas: HTMLCanvasElement,
  options: ContextMenuOptions,
): { show: (x: number, y: number, extraActions?: ContextMenuAction[]) => void; hide: () => void; destroy: () => void } {
  injectDesignSystem()

  const { actions, onAction } = options

  let menuEl: HTMLDivElement | null = null

  function onDocumentClick(e: MouseEvent): void {
    if (menuEl && !menuEl.contains(e.target as Node)) {
      hide()
    }
  }

  function onDocumentContextMenu(e: MouseEvent): void {
    if (menuEl && !menuEl.contains(e.target as Node)) {
      hide()
    }
  }

  function buildMenu(extraActions?: ContextMenuAction[]): HTMLDivElement {
    const allItems = [...actions]
    if (extraActions && extraActions.length > 0) {
      allItems.push({ actionId: 'separator-custom', label: '' })
      allItems.push(...extraActions)
    }

    const menu = document.createElement('div')
    menu.style.cssText = `
      position: fixed;
      background: var(--ds-panel-bg);
      border: 1px solid var(--ds-separator);
      border-radius: 12px;
      padding: 6px 0;
      min-width: 140px;
      box-shadow: var(--ds-shadow-lg);
      z-index: 9999;
      font-family: ${FONT_STACK};
      font-size: 13px;
      user-select: none;
      opacity: 0;
      transition: opacity 0.2s ease-out;
    `

    allItems.forEach((item) => {
      if (item.actionId === 'separator' || item.actionId === 'separator-custom') {
        const sep = document.createElement('div')
        sep.style.cssText = `height: 1px; background: var(--ds-separator); margin: 6px 8px;`
        menu.appendChild(sep)
        return
      }

      const el = document.createElement('div')
      el.textContent = item.label
      el.style.cssText = `
        padding: 6px 12px;
        min-height: 36px;
        display: flex; align-items: center;
        cursor: pointer;
        color: var(--ds-text-primary);
        transition: background 0.15s;
        margin: 0 6px;
        border-radius: 8px;
      `
      el.addEventListener('mouseenter', () => {
        el.style.background = '#007aff'
        el.style.color = '#fff'
      })
      el.addEventListener('mouseleave', () => {
        el.style.background = 'transparent'
        el.style.color = 'var(--ds-text-primary)'
      })
      el.addEventListener('click', (e) => {
        e.stopPropagation()
        onAction(item.actionId)
        hide()
      })
      menu.appendChild(el)
    })

    return menu
  }

  function show(x: number, y: number, extraActions?: ContextMenuAction[]): void {
    hide()
    menuEl = buildMenu(extraActions)
    const maxX = window.innerWidth - 150
    const maxY = window.innerHeight - 200
    menuEl.style.left = `${Math.min(x, maxX)}px`
    menuEl.style.top = `${Math.min(y, maxY)}px`
    document.body.appendChild(menuEl)

    // Fade in
    requestAnimationFrame(() => {
      if (menuEl) menuEl.style.opacity = '1'
    })

    setTimeout(() => {
      document.addEventListener('click', onDocumentClick)
      document.addEventListener('contextmenu', onDocumentContextMenu)
    }, 0)
  }

  function hide(): void {
    if (menuEl) {
      menuEl.remove()
      menuEl = null
    }
    document.removeEventListener('click', onDocumentClick)
    document.removeEventListener('contextmenu', onDocumentContextMenu)
  }

  function destroy(): void {
    hide()
  }

  return { show, hide, destroy }
}
