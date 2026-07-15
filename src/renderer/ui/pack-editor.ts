import type { EditorPackData, PaletteMapping } from '../../shared/editor-types'

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
  const { packId, onClose, onSave } = options

  const container = document.createElement('div')
  container.id = 'pack-editor'
  container.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.75); z-index: 9999;
    display: flex; justify-content: center; align-items: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: #e0e0e0;
  `

  let packData: EditorPackData | null = null
  let dirty = false
  let layerThumbUrls = new Map<string, string>()

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
      <div style="background:#1a1a2e; border-radius:12px; width:90%; max-width:960px; max-height:88vh; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 8px 32px rgba(0,0,0,0.5);">
        <!-- Header -->
        <div style="display:flex; justify-content:space-between; align-items:center; padding:14px 20px; border-bottom:1px solid #2a2a4a; flex-shrink:0;">
          <h2 style="margin:0; font-size:16px; font-weight:600;"><span id="pe-pack-name">${packId}</span></h2>
          <div style="display:flex; gap:6px;">
            <button id="pe-save-btn" class="pe-btn pe-btn-primary" disabled>Save</button>
            <button id="pe-close-btn" class="pe-btn">Close</button>
          </div>
        </div>
        <div style="display:flex; flex:1; min-height:0;">
          <!-- Left: Layer grid -->
          <div style="width:50%; border-right:1px solid #2a2a4a; display:flex; flex-direction:column;">
            <div style="padding:8px 12px; font-size:12px; font-weight:600; border-bottom:1px solid #2a2a4a; color:#888; flex-shrink:0;">Layers ${RESOLUTION}px</div>
            <div id="pe-layer-grid" style="flex:1; overflow-y:auto; padding:8px; display:grid; grid-template-columns:repeat(${PREVIEW_COLS}, 1fr); gap:6px; align-content:start;">
            </div>
          </div>
          <!-- Right: Palettes + quick preview -->
          <div style="flex:1; display:flex; flex-direction:column;">
            <div style="padding:8px 12px; font-size:12px; font-weight:600; border-bottom:1px solid #2a2a4a; color:#888; flex-shrink:0;">Palettes</div>
            <div id="pe-palette-section" style="padding:10px 12px; border-bottom:1px solid #2a2a4a; flex-shrink:0; overflow-y:auto;"></div>
            <!-- Full composite preview -->
            <div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; background:#0f0f1a; padding:12px;">
              <div style="font-size:11px; color:#666; margin-bottom:6px;">Composite Preview (layers stacked)</div>
              <canvas id="pe-composite-canvas" width="128" height="128" style="image-rendering:pixelated; border:1px solid #333; border-radius:4px; max-width:100%;"></canvas>
            </div>
          </div>
        </div>
      </div>
    `

    // Styles
    const style = document.createElement('style')
    style.textContent = `
      .pe-btn { padding:5px 12px; border-radius:5px; border:1px solid #333; background:#2a2a3e; color:#ccc; cursor:pointer; font-size:12px; }
      .pe-btn:hover { background:#3a3a4e; }
      .pe-btn-primary { background:#4a6cf7; border-color:#4a6cf7; color:#fff; }
      .pe-btn-primary:hover { background:#5b7df8; }
      .pe-btn:disabled { opacity:0.4; cursor:default; }
      .pe-btn-danger { background:#c0392b; border-color:#c0392b; color:#fff; }
      .pe-btn-danger:hover { background:#e74c3c; }
      .pe-layer-card { display:flex; flex-direction:column; align-items:center; gap:2px; padding:4px; border-radius:4px; background:#16162a; cursor:pointer; font-size:10px; color:#888; }
      .pe-layer-card:hover { background:#20204a; }
      .pe-layer-thumb { width:32px; height:32px; image-rendering:pixelated; border-radius:2px; border:1px solid #333; }
      .pe-layer-missing { width:32px; height:32px; display:flex; align-items:center; justify-content:center; background:#0f0f1a; border-radius:2px; border:1px solid #333; color:#555; font-size:16px; }
      .pe-color-swatch { width:18px; height:18px; border-radius:2px; border:1px solid #444; cursor:pointer; display:inline-block; flex-shrink:0; }
      .pe-color-swatch:hover { border-color:#888; }
      .pe-palette-row { display:flex; align-items:center; gap:3px; padding:2px 0; flex-wrap:wrap; }
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

    let html = ''
    for (const layer of layers) {
      const exists = packData.layers.some(l => l.id === layer.id && l.resolution === RESOLUTION && l.pngExists)
      const thumb = await getThumbUrl(layer.id)
      html += `<div class="pe-layer-card" data-layer="${layer.id}" title="z${layer.zIndex} ${layer.zone}${layer.optional ? ' optional' : ''}">
        ${thumb
          ? `<img class="pe-layer-thumb" src="${thumb}" alt="${layer.name}" onerror="this.style.display='none'">`
          : `<div class="pe-layer-missing">×</div>`}
        <div style="overflow:hidden;text-overflow:ellipsis;max-width:100%;">${layer.name}</div>
        <div style="display:flex;gap:4px;">
          <button class="pe-btn pe-btn-danger" style="padding:1px 6px;font-size:9px;" data-replace="${layer.id}" title="Replace PNG">Replace</button>
        </div>
      </div>`
    }
    grid.innerHTML = html

    // Bind replace buttons
    grid.querySelectorAll('[data-replace]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation()
        const layerId = (btn as HTMLElement).dataset.replace!
        try {
          const card = btn.closest('.pe-layer-card') as HTMLElement
          if (card) card.style.opacity = '0.5'

          const ok: boolean = await (window as any).electronAPI.replaceLayerPng(packId, layerId, RESOLUTION)
          if (ok) {
            setDirty()
            // Refresh thumbs
            layerThumbUrls.delete(layerId)
            const fresh: EditorPackData | null = await (window as any).electronAPI.getEditorPackData(packId)
            if (fresh) packData = fresh
            await populateLayers()
            renderComposite()
          } else {
            if (card) card.style.opacity = '1'
          }
        } catch (err) {
          console.error('[PackEditor] Replace failed:', err)
        }
      })
    })
  }

  function populatePalettes(): void {
    if (!packData) return
    const section = container.querySelector('#pe-palette-section')!
    let html = ''

    for (const pal of packData.palettes) {
      const swatches = pal.mappings.map(m => {
        const [r, g, b] = m.to
        const hex = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
        return `<span class="pe-color-swatch" style="background:${hex}" title="from rgb(${m.from.join(',')})"></span>`
      }).join('')

      html += `<div style="margin-bottom:6px;">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
          <span style="font-size:12px;font-weight:500;">${pal.name}</span>
          <button class="pe-btn" style="padding:1px 6px;font-size:9px;" data-edit-palette="${pal.id}">Edit</button>
        </div>
        <div class="pe-palette-row">${swatches}</div>
      </div>`
    }

    // Palette selector for thumbnail composite
    html += `<div style="margin-top:4px;"><label style="font-size:11px;color:#888;">Show: <select id="pe-palette-select" style="background:#2a2a3e;color:#ccc;border:1px solid #444;border-radius:3px;padding:2px 6px;">${packData.palettes.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}</select></label></div>`

    section.innerHTML = html

    section.querySelectorAll('[data-edit-palette]').forEach(btn => {
      btn.addEventListener('click', () => openPaletteEditor((btn as HTMLElement).dataset.editPalette!))
    })

    section.querySelector('#pe-palette-select')?.addEventListener('change', () => renderComposite())
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

        // Apply palette swap if a palette is selected
        if (palette && palette.mappings.length > 0) {
          // For a quick composite, we apply palette swap using a canvas
          const imgCanvas = new OffscreenCanvas(RESOLUTION, RESOLUTION)
          const imgCtx = imgCanvas.getContext('2d')!
          imgCtx.imageSmoothingEnabled = false
          imgCtx.drawImage(bitmap, 0, 0)

          const imageData = imgCtx.getImageData(0, 0, RESOLUTION, RESOLUTION)
          const pixels = imageData.data

          // Build palette map from → to
          const paletteMap = new Map<string, number[]>()
          for (const m of palette.mappings) {
            const key = `${m.from[0]},${m.from[1]},${m.from[2]}`
            paletteMap.set(key, m.to)
          }

          for (let i = 0; i < pixels.length; i += 4) {
            if (pixels[i + 3] === 0) continue // skip transparent
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
      } catch { /* skip missing layer */ }
    }

    // Scale up for display
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
    overlay.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:10000;display:flex;justify-content:center;align-items:center;`

    const rows = palette.mappings.map((m, i) => {
      const fromHex = '#' + m.from.map(v => v.toString(16).padStart(2, '0')).join('')
      const toHex = '#' + m.to.map(v => v.toString(16).padStart(2, '0')).join('')
      return `<div style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:11px;font-family:monospace;">
        <span style="width:50px;color:#888;">C${i}</span>
        <span style="width:60px;">${fromHex}</span>
        <span style="color:#555;">→</span>
        <input type="color" class="pe-color-input" value="${toHex}" data-index="${i}" style="width:28px;height:22px;border:none;cursor:pointer;background:transparent;padding:0;">
        <input type="text" class="pe-color-text" value="${toHex}" data-index="${i}" style="width:65px;background:#1a1a2e;border:1px solid #444;border-radius:3px;color:#ccc;padding:1px 4px;font-family:monospace;font-size:11px;">
      </div>`
    }).join('')

    overlay.innerHTML = `<div style="background:#1a1a2e;border-radius:10px;padding:16px;min-width:360px;max-width:440px;box-shadow:0 8px 32px rgba(0,0,0,0.5);">
      <h3 style="margin:0 0 10px;font-size:14px;font-weight:600;">Edit: ${palette.name}</h3>
      <div style="max-height:350px;overflow-y:auto;">${rows}</div>
      <div style="display:flex;gap:6px;justify-content:flex-end;margin-top:10px;border-top:1px solid #2a2a4a;padding-top:10px;">
        <button class="pe-btn" id="pe-pal-cancel">Cancel</button>
        <button class="pe-btn pe-btn-primary" id="pe-pal-save">Save</button>
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
          input.style.borderColor = '#444'
        } else { input.style.borderColor = '#c0392b' }
      })
    })

    overlay.querySelector('#pe-pal-cancel')!.addEventListener('click', () => overlay.remove())
    overlay.querySelector('#pe-pal-save')!.addEventListener('click', async () => {
      const newMappings: Array<{ from: number[]; to: number[] }> = []
      let valid = true
      overlay.querySelectorAll('.pe-color-input').forEach(input => {
        const i = parseInt((input as HTMLElement).dataset.index!)
        const h = (input as HTMLInputElement).value.slice(1)
        const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16)
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
        container.innerHTML = `<div style="display:flex;justify-content:center;align-items:center;height:100%;color:#c0392b;">Failed to load pack data</div>`
        return
      }
      packData = data
      const nameEl = container.querySelector('#pe-pack-name')
      if (nameEl) nameEl.textContent = data.manifest.name

      await populateLayers()
      populatePalettes()
      renderComposite()
    } catch (err) {
      container.innerHTML = `<div style="display:flex;justify-content:center;align-items:center;height:100%;color:#c0392b;">Error: ${err instanceof Error ? err.message : String(err)}</div>`
    }
  })()

  function update(): void {}
  function destroy(): void {
    layerThumbUrls.forEach(url => URL.revokeObjectURL(url))
    layerThumbUrls.clear()
    onClose()
    container.remove()
    const s = document.querySelector('style')
    if (s && s.textContent?.includes('.pe-btn')) (s as HTMLStyleElement).remove()
  }

  container.addEventListener('click', (e) => {
    if (e.target === container) destroy()
  })

  return { element: container, update, destroy }
}
