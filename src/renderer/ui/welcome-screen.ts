import type { ElectronAPI } from '../../shared/ipc-types'
import { ANIMALS, getPalettesForAnimal } from '../assets/catalog'

export interface WelcomeScreen {
  readonly element: HTMLElement
  destroy(): void
}

const ANIMAL_COLORS: Record<string, string> = {
  raccoon: '#808080', cat: '#d4a574', fox: '#e87020',
  rabbit: '#c0b0a0', panda: '#e8e8e8', frog: '#6abf40',
  penguin: '#406080', mouse: '#a0a0a0', bear: '#8b6914',
  koala: '#808068', owl: '#604020',
}

export function createWelcomeScreen(api: ElectronAPI, onSelect: (animalId: string) => void): WelcomeScreen {
  const container = document.createElement('div')
  container.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: linear-gradient(135deg, #0f0f2a 0%, #1a1a3e 50%, #0f0f2a 100%);
    z-index: 10000; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: #e0e0e0;
  `

  let selected = 'raccoon'

  function buildGrid(): void {
    const gridRows: string[] = []
    const chunkSize = 4
    for (let i = 0; i < ANIMALS.length; i += chunkSize) {
      const chunk = ANIMALS.slice(i, i + chunkSize)
      const cells = chunk.map(a => {
        const color = ANIMAL_COLORS[a.id] ?? '#666'
        return `
          <div class="wc-card" data-id="${a.id}" style="
            width:120px; padding:14px 8px; border-radius:10px;
            background: ${selected === a.id ? '#3a3a6e' : '#1a1a36'};
            border: 2px solid ${selected === a.id ? '#6a6af7' : '#2a2a4a'};
            cursor: pointer; text-align: center;
            transition: all 0.15s ease;
          ">
            <div style="width:64px;height:64px;margin:0 auto 6px;border-radius:6px;background:${color};display:flex;align-items:center;justify-content:center;font-size:28px;border:1px solid #444;">
              ${a.id[0].toUpperCase()}
            </div>
            <div style="font-size:13px;font-weight:500;color:${selected === a.id ? '#fff' : '#aaa'};">${a.name}</div>
          </div>
        `
      }).join('')
      gridRows.push(`<div style="display:flex;gap:12px;justify-content:center;margin-bottom:12px;">${cells}</div>`)
    }

    container.innerHTML = `
      <div style="text-align:center;margin-bottom:28px;">
        <div style="font-size:36px;margin-bottom:4px;">👾</div>
        <h1 style="margin:0;font-size:22px;font-weight:700;background:linear-gradient(90deg,#7af,#a7f);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">PixelPet</h1>
        <p style="margin:4px 0 0;font-size:13px;color:#888;">Pick your new companion</p>
      </div>
      <div>${gridRows.join('')}</div>
      <div style="margin-top:20px;display:flex;gap:10px;">
        <button id="wc-confirm" style="
          padding:10px 32px; border-radius:8px; border:none; cursor:pointer;
          background:linear-gradient(90deg,#4a6cf7,#7a4cf7); color:#fff;
          font-size:15px; font-weight:600;
        ">Adopt ${ANIMALS.find(a => a.id === selected)?.name ?? '...'}!</button>
      </div>
      <p style="margin-top:12px;font-size:11px;color:#555;">You can change your companion later in Settings</p>
    `

    // Bind card clicks
    container.querySelectorAll('.wc-card').forEach(card => {
      card.addEventListener('click', () => {
        selected = (card as HTMLElement).dataset.id!
        buildGrid()
      })
    })

    // Bind confirm
    container.querySelector('#wc-confirm')!.addEventListener('click', () => {
      onSelect(selected)
    })
  }

  buildGrid()
  document.body.appendChild(container)

  return {
    element: container,
    destroy() { container.remove() },
  }
}
