/**
 * PixelPet Welcome Screen — card grid with 3 columns per row.
 * Apple-inspired card selection with hover lift and blue accent.
 */

import type { ElectronAPI } from '../../shared/ipc-types'
import { ANIMALS, getPalettesForAnimal } from '../assets/catalog'
import { injectDesignSystem, FONT_STACK, createButton } from './design-system'
import { t } from '../assets/locale'

export interface WelcomeScreen {
  readonly element: HTMLElement
  destroy(): void
}

const ANIMAL_COLORS: Record<string, string> = {
  raccoon: '#808080',
  cat: '#d4a574',
  fox: '#e87020',
  rabbit: '#c0b0a0',
  panda: '#e8e8e8',
  frog: '#6abf40',
  penguin: '#406080',
  mouse: '#a0a0a0',
  bear: '#8b6914',
  koala: '#808068',
  owl: '#604020',
}

export function createWelcomeScreen(
  api: ElectronAPI,
  onSelect: (animalId: string) => void,
): WelcomeScreen {
  injectDesignSystem()

  const container = document.createElement('div')
  container.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: var(--ds-backdrop);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    z-index: 10000; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    font-family: ${FONT_STACK};
    color: var(--ds-text-primary);
  `

  let selected = 'raccoon'

  function buildGrid(): void {
    // Clear everything
    container.innerHTML = ''

    // ── Header ──
    const header = document.createElement('div')
    header.style.cssText = 'text-align: center; margin-bottom: 32px;'

    const icon = document.createElement('div')
    icon.textContent = '👾'
    icon.style.cssText = 'font-size: 40px; margin-bottom: 8px;'
    header.appendChild(icon)

    const title = document.createElement('h1')
    title.textContent = 'PixelPet'
    title.style.cssText = `
      margin: 0; font-size: 24px; font-weight: 700;
      background: linear-gradient(90deg, #007aff, #bf5af2);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    `
    header.appendChild(title)

    const subtitle = document.createElement('p')
    subtitle.textContent = t('welcome.subtitle')
    subtitle.style.cssText = 'margin: 4px 0 0; font-size: 14px; color: var(--ds-text-secondary);'
    header.appendChild(subtitle)

    container.appendChild(header)

    // ── Card Grid (3 columns) ──
    const grid = document.createElement('div')
    grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      max-width: 420px;
      width: 100%;
      padding: 0 24px;
    `

    ANIMALS.forEach((a) => {
      const color = ANIMAL_COLORS[a.id] ?? '#666'
      const isSelected = selected === a.id

      const card = document.createElement('div')
      card.dataset.id = a.id
      card.style.cssText = `
        display: flex; flex-direction: column; align-items: center;
        gap: 8px; padding: 16px 8px 12px;
        border-radius: 14px;
        cursor: pointer; text-align: center;
        background: ${isSelected ? 'var(--ds-secondary-fill)' : 'var(--ds-panel-bg)'};
        border: 2px solid ${isSelected ? '#007aff' : 'var(--ds-separator)'};
        transition: transform 0.2s ${'cubic-bezier(0.22, 1, 0.36, 1)'},
                    box-shadow 0.2s ease,
                    background 0.15s,
                    border-color 0.15s;
        box-shadow: ${isSelected ? '0 4px 12px rgba(0,122,255,0.3)' : '0 1px 3px rgba(0,0,0,0.2)'};
      `

      // Hover lift
      card.addEventListener('mouseenter', () => {
        if (selected !== a.id) {
          card.style.transform = 'translateY(-2px)'
          card.style.boxShadow = '0 6px 16px rgba(0,0,0,0.4)'
        }
      })
      card.addEventListener('mouseleave', () => {
        if (selected !== a.id) {
          card.style.transform = 'translateY(0)'
          card.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)'
        }
      })

      card.addEventListener('click', () => {
        selected = a.id
        buildGrid()
      })

      // Icon
      const iconEl = document.createElement('div')
      iconEl.textContent = a.id[0].toUpperCase()
      iconEl.style.cssText = `
        width: 48px; height: 48px; border-radius: 12px;
        display: flex; align-items: center; justify-content: center;
        font-size: 24px; font-weight: 700; color: #fff;
        background: ${color};
        border: 1px solid rgba(255,255,255,0.1);
      `
      card.appendChild(iconEl)

      // Name
      const name = document.createElement('div')
      name.textContent = a.name
      name.style.cssText = `
        font-size: 13px; font-weight: 500;
        color: ${isSelected ? 'var(--ds-text-primary)' : 'var(--ds-text-secondary)'};
      `
      card.appendChild(name)

      grid.appendChild(card)
    })

    container.appendChild(grid)

    // ── Button row ──
    const btnRow = document.createElement('div')
    btnRow.style.cssText = 'margin-top: 24px; text-align: center;'

    const animalName = ANIMALS.find((a) => a.id === selected)?.name ?? '...'
    const getStartedBtn = createButton(`Adopt ${animalName}!`, 'primary', () => {
      onSelect(selected)
    })
    getStartedBtn.style.cssText = getStartedBtn.style.cssText + ';padding: 10px 36px; font-size: 15px; font-weight: 600;'
    btnRow.appendChild(getStartedBtn)

    container.appendChild(btnRow)

    // ── Hint ──
    const hint = document.createElement('p')
    hint.textContent = 'You can change your companion later in Settings'
    hint.style.cssText = 'margin-top: 12px; font-size: 11px; color: var(--ds-text-tertiary);'
    container.appendChild(hint)
  }

  buildGrid()
  document.body.appendChild(container)

  return {
    element: container,
    destroy() {
      container.remove()
    },
  }
}
