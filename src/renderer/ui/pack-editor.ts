/**
 * PixelPet Pack Editor — layer browser and palette editor.
 * Apple-inspired compact layout with pill buttons and chip swatches.
 */

import type { EditorPackData, PaletteMapping } from '../../shared/editor-types'
import {
  injectDesignSystem,
  FONT_STACK,
  MONO_STACK,
  createButton,
  createSeparator,
} from './design-system'

export interface PackEditorOptions {
  packId: string
  onClose: () => void
  onSave: () => void
}

export interface PackEditor {
  readonly element: HTMLElement
  update(): void
  destroy(): void
}

const PREVIEW_COLS = 8
const PREVIEW_CELL = 64
const RESOLUTION = 32

export function createPackEditor(options: PackEditorOptions): PackEditor {
  injectDesignSystem()

  const { packId, onClose, onSave } = options

  const container = document.createElement('div')
  container.id = 'pack-editor'
  container.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.75);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    z-index: 9999;
    display: flex; justify-content: center; align-items: center;
    font-family: ${FONT_STACK};
    color: #fff;
  `

  let packData: EditorPackData | null = null
  let dirty = false
  let layerThumbUrls = new Map<string, string>()
  let selectedLayerId: string | null = null

  async function getThumbUrl(layerId: string): Promise<string> {
    const cached = layerThumbUrls.get(layerId)
    if (cached) return cached
    try {
      const bytes: Uint8Array | null = await (window as any).electronAPI.readPackAsset(packId, `parts/${RESOLUTION}/${layerId}.png`)
      if (!bytes) return ''
      const blob = new Blob([bytes.buffer] as ArrayBuffer[], { type: 'image/png' })
      const url = URL.createObjectURL(blob)
      layerThumbUrls.set(layerId, url)
      return url
    } catch { return '' }
  }

  function build(): void {
    container.innerHTML = `
      <div class="ds-panel" style="
        background: #2c2c2e; border-radius: 14px;
        width: 90%; max-width: 960px; max-height: 88vh;
        display: flex; flex-direction: column;
        overflow: hidden;
        box-shadow: 0 8px 30px rgba(0,0,0,0.5);
      ">
        <!-- Header -->
        <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 24px;border-bottom:1px solid #38383a;flex-shrink:0;">
          <h2 style="margin:0;font-size:15px;font-weight:600;">
            <span id="pe-pack-name">${packId}</span>
          </h2>
          <div style="display:flex;gap:8px;">
            <button id="pe-save-btn" class="pe-pill pe-pill-primary" disabled>Save</button>
            <button id="pe-close-btn" class="pe-pill">Close</button>
          </div>
        </div>
        <div style="display:flex;flex:1;min-height:0;">
          <!-- Left: Layer grid -->
          <div style="width:50%;border-right:1px solid #38383a;display:flex;flex-direction:column;">
            <div style="padding:10px 16px;font-size:12px;font-weight:600;border-bottom:1px solid #38383a;color:#98989d;flex-shrink:0;letter-spacing:0.5px;text-transform:uppercase;">
              Layers ${RESOLUTION}px
            </div>
            <div id="pe-layer-grid" class="ds-scroll" style="flex:1;overflow-y:auto;padding:8px;">
            </div>
          </div>
          <!-- Right: Palettes + preview -->
          <div style="flex:1;display:flex;flex-direction:column;">
            <div style="padding:10px 16px;font-size:12px;font-weight:600;border-bottom:1px solid #38383a;color:#98989d;flex-shrink:0;letter-spacing:0.5px;text-transform:uppercase;">
              Palettes
            </div>
            <div id="pe-palette-section" style="padding:12px 16px;border-bottom:1px solid #38383a;flex-shrink:0;overflow-y:auto;max-height:200px;" class="ds-scroll"></div>
            <!-- Full composite preview -->
            <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#1c1c1e;padding:16px;">
              <div style="font-size:11px;color:#636366;margin-bottom:8px;">Composite Preview</div>
              <canvas id="pe-composite-canvas" width="128" height="128" style="image-rendering:pixelated;border:1px solid #38383a;border-radius:8px;max-width:100%;"></canvas>
            </div>
          </div>
        </div>
      </div>
    `

    // Inject pill button styles
    const style = document.createElement('style')
    style.textContent = `
      .pe-pill {
        padding: 6px 16px; border-radius: 10px; border: 1px solid #48484a;
        background: #3a3a3c; color: #fff; cursor: pointer;
        font-size: 12px; font-family: ${FONT_STACK};
        transition: background 0.15s, transform 0.1s;
        user-select: none;
      }
      .pe-pill:hover { background: #444446; }
      .pe-pill:active { transform: scale(0.97); }
      .pe-pill-primary {
        background: #007aff; border-color: #007aff; color: #fff;
      }
      .pe-pill-primary:hover { background: #0a84ff; }
      .pe-pill:disabled { opacity: 0.4; cursor: default; }
      .pe-pill-danger {
        background: transparent; border-color: #ff453a; color: #ff453a;
      }
      .pe-pill-danger:hover { background: #ff453a22; }
      .ds-scroll::-webkit-scrollbar { width: 4px; }
      .ds-scroll::-webkit-scrollbar-track { background: transparent; }
      .ds-scroll::-webkit-scrollbar-thumb { background: #3a3a3c; border-radius: 2px; }
    `
    document.head.appendChild(style)

    // Bind
    container.querySelector('#pe-close-btn')!.addEventListener('click', () => {
      if (dirty && !confirm('Unsaved changes will be lost. Close anyway?')) return
      destroy()
    })
    container.querySelector('#pe-save-btn')!.addEventListener('click', () => {
      onSave()
      dirty = false
      updateSaveBtn()
    })
  }

  function updateSaveBtn(): void {
    const btn = container.querySelector('#pe-save-btn') as HTMLButtonElement
    if (btn) btn.disabled = !dirty
  }

  function setDirty(): void {
    dirty = true
    updateSaveBtn()
  }

  async function populateLayers(): Promise<void> {
    if (!packData) return
    const grid = container.querySelector('#pe-layer-grid')!
    const manifest = packData.manifest
    const layers = manifest.layers.sort((a, b) => a.zIndex - b.zIndex)

    // Select first layer by default
    if (!selectedLayerId && layers.length > 0) {
      selectedLayerId = layers[0].id
    }

    grid.innerHTML = ''

    for (const layer of layers) {
      const exists = packData!.layers.some(l => l.id === layer.id && l.resolution === RESOLUTION && l.pngExists)
      const isSelected = layer.id === selectedLayerId
      const thumb = await getThumbUrl(layer.id)

      const row = document.createElement('div')
      row.style.cssText = `
        display: flex; align-items: center; gap: 10px;
        padding: 8px 12px; margin-bottom: 4px;
        border-radius: 8px;
        cursor: pointer;
        background: ${isSelected ? '#3a3a3c' : 'transparent'};
        border-left: 3px solid ${isSelected ? '#007aff' : 'transparent'};
        transition: background 0.15s;
        min-height: 44px;
      `
      row.dataset.layer = layer.id
      row.title = `z${layer.zIndex} ${layer.zone}${layer.optional ? ' optional' : ''}`

      row.addEventListener('click', () => {
        selectedLayerId = layer.id
        populateLayers()
      })

      // Thumbnail or placeholder
      if (thumb) {
        const img = document.createElement('img')
        img.src = thumb
        img.alt = layer.name
        img.style.cssText = `
          width: 32px; height: 32px; border-radius: 4px;
          image-rendering: pixelated;
          border: 1px solid #48484a; flex-shrink: 0;
          object-fit: cover;
        `
        row.appendChild(img)
      } else {
        const placeholder = document.createElement('div')
        placeholder.textContent = '×'
        placeholder.style.cssText = `
          width: 32px; height: 32px; border-radius: 4px;
          display: flex; align-items: center; justify-content: center;
          background: #1c1c1e; border: 1px solid #48484a;
          color: #636366; font-size: 16px; flex-shrink: 0;
        `
        row.appendChild(placeholder)
      }

      // Name
      const nameSpan = document.createElement('span')
      nameSpan.textContent = layer.name
      nameSpan.style.cssText = `
        flex: 1; font-size: 13px;
        color: ${isSelected ? '#fff' : '#98989d'};
        font-weight: ${isSelected ? '500' : '400'};
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      `
      row.appendChild(nameSpan)

      // Replace button
      const replaceBtn = document.createElement('button')
      replaceBtn.textContent = 'Replace'
      replaceBtn.className = 'pe-pill pe-pill-danger'
      replaceBtn.style.cssText = 'padding: 2px 10px; font-size: 10px; flex-shrink: 0;'
      replaceBtn.addEventListener('click', async (e) => {
        e.stopPropagation()
        try {
          row.style.opacity = '0.5'
          const ok: boolean = await (window as any).electronAPI.replaceLayerPng(packId, layer.id, RESOLUTION)
          if (ok) {
            setDirty()
            layerThumbUrls.delete(layer.id)
            const fresh: EditorPackData | null = await (window as any).electronAPI.getEditorPackData(packId)
            if (fresh) packData = fresh
            await populateLayers()
            renderComposite()
          } else {
            row.style.opacity = '1'
          }
        } catch (err) {
          console.error('[PackEditor] Replace failed:', err)
        }
      })
      row.appendChild(replaceBtn)

      grid.appendChild(row)
    }
  }

  function populatePalettes(): void {
    if (!packData) return
    const section = container.querySelector('#pe-palette-section')!
    section.innerHTML = ''

    for (const pal of packData.palettes) {
      const row = document.createElement('div')
      row.style.cssText = 'margin-bottom: 10px;'

      // Palette header
      const header = document.createElement('div')
      header.style.cssText = 'display: flex; align-items: center; gap: 6px; margin-bottom: 4px;'

      const nameSpan = document.createElement('span')
      nameSpan.textContent = pal.name
      nameSpan.style.cssText = 'font-size: 12px; font-weight: 500; color: #fff;'
      header.appendChild(nameSpan)

      const editBtn = document.createElement('button')
      editBtn.textContent = 'Edit'
      editBtn.className = 'pe-pill'
      editBtn.style.cssText = 'padding: 1px 8px; font-size: 9px; margin-left: auto;'
      editBtn.addEventListener('click', () => openPaletteEditor(pal.id))
      header.appendChild(editBtn)

      row.appendChild(header)

      // Color swatches — small rounded squares in flex-wrap row
      const swatchRow = document.createElement('div')
      swatchRow.style.cssText = 'display: flex; flex-wrap: wrap; gap: 4px;'

      pal.mappings.forEach(m => {
        const [r, g, b] = m.to
        const hex = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
        const swatch = document.createElement('div')
        swatch.style.cssText = `
          width: 16px; height: 16px; border-radius: 4px;
          background: ${hex};
          border: 1px solid #48484a;
          cursor: default;
          flex-shrink: 0;
        `
        swatch.title = `#${m.from.join(',')} → ${hex}`
        swatchRow.appendChild(swatch)
      })

      row.appendChild(swatchRow)
      section.appendChild(row)
    }

    // Palette selector for composite
    const selectorRow = document.createElement('div')
    selectorRow.style.cssText = 'margin-top: 8px; display: flex; align-items: center; gap: 6px;'

    const selectorLabel = document.createElement('label')
    selectorLabel.textContent = 'Show:'
    selectorLabel.style.cssText = 'font-size: 11px; color: #98989d;'
    selectorRow.appendChild(selectorLabel)

    const select = document.createElement('select')
    select.id = 'pe-palette-select'
    select.style.cssText = `
      background: #3a3a3c; color: #fff;
      border: 1px solid #48484a; border-radius: 6px;
      padding: 4px 8px; font-size: 12px;
      font-family: ${FONT_STACK};
      outline: none; cursor: pointer;
    `
    packData.palettes.forEach(p => {
      const opt = document.createElement('option')
      opt.value = p.id
      opt.textContent = p.name
      select.appendChild(opt)
    })
    select.addEventListener('change', () => renderComposite())
    selectorRow.appendChild(select)

    section.appendChild(selectorRow)
  }

  async function renderComposite(): Promise<void> {
    if (!packData) return
    const select = container.querySelector('#pe-palette-select') as HTMLSelectElement
    const paletteId = select ? select.value : packData.manifest.defaultPalette
    const palette = packData.palettes.find(p => p.id === paletteId)
    const canvas = container.querySelector('#pe-composite-canvas') as HTMLCanvasElement
    if (!canvas) return

    const offscreen = new OffscreenCanvas(RESOLUTION, RESOLUTION)
    const ctx = offscreen.getContext('2d')!
    ctx.imageSmoothingEnabled = false
    ctx.clearRect(0, 0, RESOLUTION, RESOLUTION)

    const layers = packData.manifest.layers.sort((a, b) => a.zIndex - b.zIndex)
    for (const layer of layers) {
      try {
        const bytes: Uint8Array | null = await (window as any).electronAPI.readPackAsset(packId, `parts/${RESOLUTION}/${layer.id}.png`)
        if (!bytes) continue
        const blob = new Blob([bytes.buffer] as ArrayBuffer[], { type: 'image/png' })
        const bitmap = await createImageBitmap(blob)

        if (palette && palette.mappings.length > 0) {
          const imgCanvas = new OffscreenCanvas(RESOLUTION, RESOLUTION)
          const imgCtx = imgCanvas.getContext('2d')!
          imgCtx.imageSmoothingEnabled = false
          imgCtx.drawImage(bitmap, 0, 0)

          const imageData = imgCtx.getImageData(0, 0, RESOLUTION, RESOLUTION)
          const pixels = imageData.data
          const paletteMap = new Map<string, number[]>()
          for (const m of palette.mappings) {
            const key = `${m.from[0]},${m.from[1]},${m.from[2]}`
            paletteMap.set(key, m.to)
          }

          for (let i = 0; i < pixels.length; i += 4) {
            if (pixels[i + 3] === 0) continue
            const key = `${pixels[i]},${pixels[i + 1]},${pixels[i + 2]}`
            const to = paletteMap.get(key)
            if (to) {
              pixels[i] = to[0]
              pixels[i + 1] = to[1]
              pixels[i + 2] = to[2]
            }
          }
          imgCtx.putImageData(imageData, 0, 0)
          ctx.drawImage(imgCanvas, 0, 0)
        } else {
          ctx.drawImage(bitmap, 0, 0)
        }
        bitmap.close()
      } catch { /* skip missing */ }
    }

    const displayCanvas = new OffscreenCanvas(RESOLUTION * 4, RESOLUTION * 4)
    const dCtx = displayCanvas.getContext('2d')!
    dCtx.imageSmoothingEnabled = false
    dCtx.drawImage(offscreen, 0, 0, RESOLUTION * 4, RESOLUTION * 4)
    const blob = await displayCanvas.convertToBlob()
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      canvas.width = RESOLUTION * 4
      canvas.height = RESOLUTION * 4
      const ctx2 = canvas.getContext('2d')!
      ctx2.imageSmoothingEnabled = false
      ctx2.drawImage(img, 0, 0)
      URL.revokeObjectURL(url)
    }
    img.src = url
  }

  // ── Palette editor modal ──

  function openPaletteEditor(paletteId: string): void {
    if (!packData) return
    const palette = packData.palettes.find(p => p.id === paletteId)
    if (!palette) return

    const overlay = document.createElement('div')
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.5);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 10000;
      display: flex; justify-content: center; align-items: center;
    `

    const rows = palette.mappings.map((m, i) => {
      const fromHex = '#' + m.from.map(v => v.toString(16).padStart(2, '0')).join('')
      const toHex = '#' + m.to.map(v => v.toString(16).padStart(2, '0')).join('')
      return `<div style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:11px;font-family:${MONO_STACK};">
        <span style="width:40px;color:#636366;">C${i}</span>
        <span style="width:56px;color:#636366;">${fromHex}</span>
        <span style="color:#48484a;">→</span>
        <input type="color" class="pe-color-input" value="${toHex}" data-index="${i}" style="width:28px;height:24px;border:none;cursor:pointer;background:transparent;padding:0;border-radius:4px;">
        <input type="text" class="pe-color-text" value="${toHex}" data-index="${i}" style="width:64px;background:#2c2c2e;border:1px solid #48484a;border-radius:6px;color:#fff;padding:2px 6px;font-family:${MONO_STACK};font-size:11px;outline:none;">
      </div>`
    }).join('')

    overlay.innerHTML = `<div style="background:#2c2c2e;border-radius:14px;padding:20px;min-width:380px;max-width:460px;box-shadow:0 8px 30px rgba(0,0,0,0.5);">
      <h3 style="margin:0 0 12px;font-size:14px;font-weight:600;">Edit: ${palette.name}</h3>
      <div class="ds-scroll" style="max-height:350px;overflow-y:auto;">${rows}</div>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px;border-top:1px solid #38383a;padding-top:12px;">
        <button class="pe-pill" id="pe-pal-cancel">Cancel</button>
        <button class="pe-pill pe-pill-primary" id="pe-pal-save">Save</button>
      </div>
    </div>`
    document.body.appendChild(overlay)

    overlay.querySelectorAll('.pe-color-input').forEach(input => {
      input.addEventListener('input', () => {
        const idx = (input as HTMLElement).dataset.index!
        const txt = overlay.querySelector(`.pe-color-text[data-index="${idx}"]`) as HTMLInputElement
        if (txt) txt.value = (input as HTMLInputElement).value
      })
    })
    overlay.querySelectorAll('.pe-color-text').forEach(el => {
      const input = el as HTMLInputElement
      input.addEventListener('input', () => {
        const v = input.value
        if (/^#[0-9a-f]{6}$/i.test(v)) {
          const idx = input.dataset.index!
          const ci = overlay.querySelector(`.pe-color-input[data-index="${idx}"]`) as HTMLInputElement
          if (ci) ci.value = v
          input.style.borderColor = '#48484a'
        } else {
          input.style.borderColor = '#ff453a'
        }
      })
    })

    overlay.querySelector('#pe-pal-cancel')!.addEventListener('click', () => overlay.remove())
    overlay.querySelector('#pe-pal-save')!.addEventListener('click', async () => {
      const newMappings: Array<{ from: number[]; to: number[] }> = []
      let valid = true
      overlay.querySelectorAll('.pe-color-input').forEach(input => {
        const i = parseInt((input as HTMLElement).dataset.index!)
        const h = (input as HTMLInputElement).value.slice(1)
        const r = parseInt(h.slice(0, 2), 16); const g = parseInt(h.slice(2, 4), 16); const b = parseInt(h.slice(4, 6), 16)
        if (!isNaN(r) && !isNaN(g) && !isNaN(b)) newMappings[i] = { from: palette.mappings[i].from, to: [r, g, b] }
        else valid = false
      })
      if (!valid) { alert('Invalid color values'); return }
      try {
        const ok: boolean = await (window as any).electronAPI.updatePackPalette(packId, paletteId, newMappings)
        if (ok) {
          setDirty()
          const fresh = await (window as any).electronAPI.getEditorPackData(packId)
          if (fresh) { packData = fresh; populatePalettes(); renderComposite() }
        }
        overlay.remove()
      } catch (err) { console.error(err); alert('Save failed') }
    })
  }

  // ── Init ──

  build()

  ;(async () => {
    try {
      const data: EditorPackData | null = await (window as any).electronAPI.getEditorPackData(packId)
      if (!data) {
        container.innerHTML = `<div style="display:flex;justify-content:center;align-items:center;height:100%;color:#ff453a;">Failed to load pack data</div>`
        return
      }
      packData = data
      const nameEl = container.querySelector('#pe-pack-name')
      if (nameEl) nameEl.textContent = data.manifest.name

      await populateLayers()
      populatePalettes()
      renderComposite()
    } catch (err) {
      container.innerHTML = `<div style="display:flex;justify-content:center;align-items:center;height:100%;color:#ff453a;">Error: ${err instanceof Error ? err.message : String(err)}</div>`
    }
  })()

  function update(): void {}
  function destroy(): void {
    layerThumbUrls.forEach(url => URL.revokeObjectURL(url))
    layerThumbUrls.clear()
    onClose()
    container.remove()
    const s = document.querySelector('style')
    if (s && s.textContent?.includes('.pe-pill')) (s as HTMLStyleElement).remove()
  }

  container.addEventListener('click', (e) => {
    if (e.target === container) destroy()
  })

  return { element: container, update, destroy }
}
