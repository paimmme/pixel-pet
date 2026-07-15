/**
 * PixelPet Design System
 * Apple-inspired dark mode UI tokens and reusable element factories.
 * Injected once into document head; all UI modules import from here.
 */

// ── Singleton injection ──

let injected = false

const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif"
const MONO = "'SF Mono', 'Menlo', monospace"
const SPRING = 'cubic-bezier(0.22, 1, 0.36, 1)'

export function injectDesignSystem(): void {
  if (injected) return
  injected = true

  // Shared JS-driven hover for button press
  const style = document.createElement('style')
  style.textContent = `
    :root {
      --ds-backdrop: rgba(0,0,0,0.5);
      --ds-panel-bg: #2c2c2e;
      --ds-secondary-fill: #3a3a3c;
      --ds-tertiary-fill: #444446;
      --ds-text-primary: #ffffff;
      --ds-text-secondary: #98989d;
      --ds-text-tertiary: #636366;
      --ds-separator: #38383a;
      --ds-accent-blue: #007aff;
      --ds-accent-green: #30d158;
      --ds-accent-red: #ff453a;
      --ds-accent-orange: #ff9f0a;
      --ds-font-stack: ${FONT};
      --ds-mono-stack: ${MONO};
      --ds-radius-sm: 6px;
      --ds-radius-md: 10px;
      --ds-radius-lg: 14px;
      --ds-shadow-lg: 0 8px 30px rgba(0,0,0,0.5);
      --ds-ease-spring: ${SPRING};
    }

    /* Scrollbar styling for panels */
    .ds-scroll::-webkit-scrollbar {
      width: 4px;
    }
    .ds-scroll::-webkit-scrollbar-track {
      background: transparent;
    }
    .ds-scroll::-webkit-scrollbar-thumb {
      background: #3a3a3c;
      border-radius: 2px;
    }

    /* Native select reset for custom-style dropdowns */
    .ds-select {
      -webkit-appearance: none;
      appearance: none;
    }
  `
  document.head.appendChild(style)
}

// ── Exported constants ──

export const FONT_STACK = FONT
export const MONO_STACK = MONO
export const SPRING_EASE = SPRING

// ── Reusable element factories ──

export interface Section {
  container: HTMLDivElement
  labelEl: HTMLDivElement
}

/**
 * Section header with uppercase label.
 * Returns the outer container and the label element for convenience.
 */
export function createSection(label: string): Section {
  const container = document.createElement('div')
  container.style.cssText = 'margin-bottom: 20px;'

  const labelEl = document.createElement('div')
  labelEl.textContent = label
  labelEl.style.cssText = `
    font-size: 12px; font-weight: 600;
    letter-spacing: 0.5px; text-transform: uppercase;
    color: #98989d; margin-bottom: 10px;
    font-family: ${FONT};
  `

  container.appendChild(labelEl)
  return { container, labelEl }
}

/**
 * Card container — groups related controls.
 */
export function createCard(...children: HTMLElement[]): HTMLDivElement {
  const card = document.createElement('div')
  card.style.cssText = `
    background: #3a3a3c; border-radius: 12px;
    padding: 16px; margin-bottom: 12px;
  `
  children.forEach(c => card.appendChild(c))
  return card
}

// ── Button ──

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'

export function createButton(
  text: string,
  variant: ButtonVariant,
  onClick: (e: MouseEvent) => void,
): HTMLButtonElement {
  const btn = document.createElement('button')
  btn.textContent = text
  btn.addEventListener('click', onClick as EventListener)

  const base = `
    border: none; border-radius: 10px; cursor: pointer;
    font-family: ${FONT}; font-size: 13px; font-weight: 500;
    padding: 8px 20px; transition: transform 0.1s, background 0.15s;
    user-select: none; outline: none;
  `

  switch (variant) {
    case 'primary':
      btn.style.cssText = base + 'background: #007aff; color: #fff;'
      btn.addEventListener('mouseenter', () => { btn.style.background = '#0a84ff' })
      btn.addEventListener('mouseleave', () => { btn.style.background = '#007aff' })
      break
    case 'secondary':
      btn.style.cssText = base + 'background: #3a3a3c; color: #fff; border: 1px solid #48484a;'
      btn.addEventListener('mouseenter', () => { btn.style.background = '#444446' })
      btn.addEventListener('mouseleave', () => { btn.style.background = '#3a3a3c' })
      break
    case 'danger':
      btn.style.cssText = base + 'background: #ff453a; color: #fff;'
      btn.addEventListener('mouseenter', () => { btn.style.background = '#ff6259' })
      btn.addEventListener('mouseleave', () => { btn.style.background = '#ff453a' })
      break
    case 'ghost':
      btn.style.cssText = base + 'background: transparent; color: #98989d; padding: 4px 12px;'
      btn.addEventListener('mouseenter', () => { btn.style.background = '#3a3a3c'; btn.style.color = '#fff' })
      btn.addEventListener('mouseleave', () => { btn.style.background = 'transparent'; btn.style.color = '#98989d' })
      break
    case 'outline':
      btn.style.cssText = base + 'background: transparent; color: #007aff; border: 1px solid #007aff;'
      btn.addEventListener('mouseenter', () => { btn.style.background = '#007aff'; btn.style.color = '#fff' })
      btn.addEventListener('mouseleave', () => { btn.style.background = 'transparent'; btn.style.color = '#007aff' })
      break
  }

  // Spring press
  btn.addEventListener('mousedown', () => { btn.style.transform = 'scale(0.97)' })
  btn.addEventListener('mouseup', () => { btn.style.transform = 'scale(1)' })
  btn.addEventListener('mouseleave', () => { btn.style.transform = 'scale(1)' })

  return btn
}

// ── Toggle switch ──

export interface ToggleControl {
  element: HTMLDivElement
  setChecked: (v: boolean) => void
}

export function createToggle(
  checked: boolean,
  onChange: (checked: boolean) => void,
): ToggleControl {
  const track = document.createElement('div')
  track.style.cssText = `
    width: 44px; height: 26px; border-radius: 13px;
    background: ${checked ? '#007aff' : '#3a3a3c'};
    cursor: pointer; position: relative; transition: background 0.2s;
    flex-shrink: 0;
  `

  const thumb = document.createElement('div')
  thumb.style.cssText = `
    width: 22px; height: 22px; border-radius: 11px;
    background: #fff; position: absolute; top: 2px;
    left: ${checked ? '20px' : '2px'};
    transition: left 0.2s ${SPRING};
    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
  `

  track.appendChild(thumb)

  const toggle = () => {
    const next = !checked
    checked = next
    track.style.background = next ? '#007aff' : '#3a3a3c'
    thumb.style.left = next ? '20px' : '2px'
    onChange(next)
  }

  track.addEventListener('click', toggle)

  return {
    element: track,
    setChecked(v) {
      checked = v
      track.style.background = v ? '#007aff' : '#3a3a3c'
      thumb.style.left = v ? '20px' : '2px'
    },
  }
}

// ── Select (styled native <select>) ──

export function createSelect(
  options: Array<{ id: string; name: string }>,
  currentId: string,
  onChange: (id: string) => void,
): HTMLDivElement {
  const container = document.createElement('div')
  container.style.cssText = 'position: relative;'

  const select = document.createElement('select')
  options.forEach(o => {
    const opt = document.createElement('option')
    opt.value = o.id
    opt.textContent = o.name
    if (o.id === currentId) opt.selected = true
    select.appendChild(opt)
  })

  select.className = 'ds-select'
  select.style.cssText = `
    -webkit-appearance: none; appearance: none;
    width: 100%; padding: 8px 32px 8px 12px;
    background: #3a3a3c; border: 1px solid #48484a; border-radius: 8px;
    color: #fff; font-family: ${FONT}; font-size: 13px;
    outline: none; cursor: pointer; transition: border-color 0.15s;
  `

  select.addEventListener('focus', () => { select.style.borderColor = '#007aff' })
  select.addEventListener('blur', () => { select.style.borderColor = '#48484a' })
  select.addEventListener('change', () => { onChange(select.value) })

  // Custom chevron
  const chevron = document.createElement('div')
  chevron.textContent = '▾'
  chevron.style.cssText = `
    position: absolute; right: 10px; top: 50%;
    transform: translateY(-50%);
    color: #98989d; font-size: 10px; pointer-events: none;
    line-height: 1;
  `

  container.appendChild(select)
  container.appendChild(chevron)
  return container
}

// ── Badge (coloured dot + text) ──

export function createBadge(text: string, color: string): HTMLSpanElement {
  const badge = document.createElement('span')
  badge.style.cssText = `
    display: inline-flex; align-items: center; gap: 4px;
    padding: 2px 8px; border-radius: 6px;
    font-size: 11px; font-weight: 500; font-family: ${FONT};
    background: ${color}22; color: ${color};
  `

  const dot = document.createElement('span')
  dot.style.cssText = `
    width: 6px; height: 6px; border-radius: 50%;
    background: ${color}; flex-shrink: 0;
  `

  badge.appendChild(dot)

  const textSpan = document.createElement('span')
  textSpan.textContent = text
  badge.appendChild(textSpan)

  return badge
}

// ── Progress bar ──

export function createProgressBar(percent: number): HTMLDivElement {
  const bar = document.createElement('div')
  bar.style.cssText = 'width: 100%; height: 3px; background: #3a3a3c; border-radius: 2px; overflow: hidden;'

  const fill = document.createElement('div')
  fill.style.cssText = `
    width: ${Math.max(0, Math.min(100, percent))}%;
    height: 100%; background: #007aff; border-radius: 2px;
    transition: width 0.4s;
  `

  bar.appendChild(fill)
  return bar
}

// ── Inline row (label + control) ──

export function createRow(label: string, control: HTMLElement): HTMLDivElement {
  const row = document.createElement('div')
  row.style.cssText = `
    display: flex; align-items: center; gap: 12px;
    min-height: 36px; margin-bottom: 8px;
  `

  const labelSpan = document.createElement('span')
  labelSpan.textContent = label
  labelSpan.style.cssText = `flex: 1; font-size: 13px; color: #fff; font-family: ${FONT};`

  row.appendChild(labelSpan)
  row.appendChild(control)
  return row
}

// ── Code block (mono diagnostics) ──

export function createCodeBlock(lines: string[]): HTMLDivElement {
  const block = document.createElement('div')
  block.style.cssText = `
    background: #2c2c2e; border-radius: 8px;
    padding: 10px 12px; font-family: ${MONO};
    font-size: 11px; line-height: 1.6; color: #98989d;
    overflow-x: auto;
  `
  block.textContent = lines.join('\n')
  return block
}

// ── Separator ──

export function createSeparator(): HTMLDivElement {
  const sep = document.createElement('div')
  sep.style.cssText = 'height: 1px; background: #38383a; margin: 12px 0;'
  return sep
}

// ── Icon (large letter avatar for animal cards) ──

export function createAnimalIcon(letter: string, color: string): HTMLDivElement {
  const el = document.createElement('div')
  el.textContent = letter.toUpperCase()
  el.style.cssText = `
    width: 48px; height: 48px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 22px; font-weight: 700; color: #fff;
    background: ${color}; flex-shrink: 0;
  `
  return el
}

// ── Animation utilities ──

/**
 * Fade + slide-in animation for general elements.
 * @param from 'top' (default) — slide down, 'bottom' — slide up
 */
export function animateEnter(element: HTMLElement, from: 'top' | 'bottom' = 'top'): void {
  const dy = from === 'top' ? '-8px' : '8px'
  element.style.opacity = '0'
  element.style.transform = `translateY(${dy})`

  requestAnimationFrame(() => {
    element.style.transition = `opacity 0.35s ${SPRING}, transform 0.35s ${SPRING}`
    element.style.opacity = '1'
    element.style.transform = 'translateY(0)'
  })
}

/**
 * Fade-out + scale-down exit animation. Returns a promise that resolves
 * when the animation completes (~200ms).
 */
export function animateExit(element: HTMLElement): Promise<void> {
  return new Promise(resolve => {
    element.style.transition = 'opacity 0.2s ease-out, transform 0.2s ease-out'
    element.style.opacity = '0'
    element.style.transform = 'scale(0.97)'
    setTimeout(resolve, 200)
  })
}

/**
 * Bottom-sheet slide-up for overlay + panel.
 * Expects `overlay` to have a child `.ds-sheet` element.
 */
export function animateSheetIn(container: HTMLElement): void {
  const sheet = container.querySelector('.ds-sheet') as HTMLElement | null
  // Start hidden
  container.style.opacity = '0'
  if (sheet) sheet.style.transform = 'translateY(100%)'

  requestAnimationFrame(() => {
    container.style.transition = 'opacity 0.35s ' + SPRING
    container.style.opacity = '1'
    if (sheet) {
      sheet.style.transition = 'transform 0.4s ' + SPRING
      sheet.style.transform = 'translateY(0)'
    }
  })
}

/**
 * Reverse — slide sheet down + fade overlay.
 */
export function animateSheetOut(container: HTMLElement): Promise<void> {
  return new Promise(resolve => {
    const sheet = container.querySelector('.ds-sheet') as HTMLElement | null
    container.style.transition = 'opacity 0.2s ease-out'
    container.style.opacity = '0'
    if (sheet) {
      sheet.style.transition = 'transform 0.25s ease-out'
      sheet.style.transform = 'translateY(100%)'
    }
    setTimeout(resolve, 250)
  })
}
