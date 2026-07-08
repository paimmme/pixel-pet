export interface ContextMenuAction {
  actionId: string
  label: string
}

export interface ContextMenuOptions {
  actions: ContextMenuAction[]
  onAction: (actionId: string) => void
  theme?: 'light' | 'dark'
}

/**
 * Create and show an HTML overlay context menu at the given position.
 * 
 * - Positioned at (x, y) relative to the viewport
 * - Click outside closes the menu
 * - Click on an action item calls onAction and closes
 * - Returns cleanup function
 */
export function createContextMenu(
  canvas: HTMLCanvasElement,
  options: ContextMenuOptions
): { show: (x: number, y: number) => void; hide: () => void; destroy: () => void } {
  const { actions, onAction, theme = 'dark' } = options

  let menuEl: HTMLDivElement | null = null

  function onDocumentClick(e: MouseEvent): void {
    // Check if click is inside menu
    if (menuEl && !menuEl.contains(e.target as Node)) {
      hide()
    }
  }

  function onDocumentContextMenu(e: MouseEvent): void {
    // Hide menu on right-click elsewhere
    if (menuEl && !menuEl.contains(e.target as Node)) {
      hide()
    }
  }

  function buildMenu(): HTMLDivElement {
    const menu = document.createElement('div')
    menu.style.cssText = `
      position: fixed;
      background: ${theme === 'dark' ? '#1a1a1a' : '#ffffff'};
      border: 1px solid ${theme === 'dark' ? '#333' : '#ccc'};
      border-radius: 6px;
      padding: 4px 0;
      min-width: 120px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 13px;
      user-select: none;
    `

    actions.forEach((item) => {
      if (item.actionId === 'separator') {
        const sep = document.createElement('div')
        sep.style.cssText = `
          height: 1px;
          background: ${theme === 'dark' ? '#333' : '#ddd'};
          margin: 4px 8px;
        `
        menu.appendChild(sep)
        return
      }

      const el = document.createElement('div')
      el.textContent = item.label
      el.style.cssText = `
        padding: 6px 16px;
        cursor: pointer;
        color: ${theme === 'dark' ? '#eee' : '#333'};
        transition: background 0.1s;
      `
      el.addEventListener('mouseenter', () => {
        el.style.background = theme === 'dark' ? '#333' : '#e8e8e8'
      })
      el.addEventListener('mouseleave', () => {
        el.style.background = 'transparent'
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

  function show(x: number, y: number): void {
    hide()
    menuEl = buildMenu()
    // Adjust position to stay within viewport
    const maxX = window.innerWidth - 130
    const maxY = window.innerHeight - 200
    menuEl.style.left = `${Math.min(x, maxX)}px`
    menuEl.style.top = `${Math.min(y, maxY)}px`
    document.body.appendChild(menuEl)

    // Listen for outside clicks
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
