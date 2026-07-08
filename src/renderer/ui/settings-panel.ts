export interface SettingsPanelOptions {
  animals: Array<{ id: string; name: string }>
  palettes: Array<{ id: string; name: string }>
  accessories: Array<{ id: string; name: string }>
  currentAnimal: string
  currentPalette: string
  currentAccessories: string[]
  currentResolution: number
  autoLaunch?: boolean
  diagnostics?: {
    version: string
    platform: string
    electronVersion: string
    uptimeMs: number
  }
  onAnimalChange: (animalId: string) => void
  onPaletteChange: (paletteId: string) => void
  onResolutionToggle: () => void
  onAutoLaunchChange?: (enabled: boolean) => void
  onAccessoryToggle?: (accessoryId: string) => void
}

export interface SettingsPanel {
  show: () => void
  hide: () => void
  destroy: () => void
  update: (options: Partial<SettingsPanelOptions>) => void
}

export function createSettingsPanel(options: SettingsPanelOptions): SettingsPanel {
  let panelEl: HTMLDivElement | null = null
  let currentOptions = { ...options }

  function updatePaletteOptions(select: HTMLSelectElement, palettes: Array<{ id: string; name: string }>, currentId: string): void {
    select.innerHTML = ''
    palettes.forEach(p => {
      const opt = document.createElement('option')
      opt.value = p.id
      opt.textContent = p.name
      if (p.id === currentId) opt.selected = true
      select.appendChild(opt)
    })
  }

  function buildPanel(): HTMLDivElement {
    const overlay = document.createElement('div')
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.3); z-index: 9998;
    `
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) hide()
    })

    const panel = document.createElement('div')
    panel.style.cssText = `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      background: #1a1a1a; border: 1px solid #333; border-radius: 10px;
      padding: 20px; min-width: 240px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.5);
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #eee; font-size: 13px;
      user-select: none;
    `

    // Title
    const title = document.createElement('div')
    title.textContent = '\u2699 PixelPet Settings'
    title.style.cssText = 'font-size: 15px; font-weight: 600; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid #333;'
    panel.appendChild(title)

    // Animal selector
    const animalLabel = document.createElement('div')
    animalLabel.textContent = 'Animal'
    animalLabel.style.cssText = 'margin-bottom: 4px; color: #999; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;'
    panel.appendChild(animalLabel)

    const animalSelect = document.createElement('select')
    animalSelect.style.cssText = `
      width: 100%; padding: 6px 8px; margin-bottom: 12px;
      background: #252525; border: 1px solid #444; border-radius: 4px;
      color: #eee; font-size: 13px; outline: none;
    `
    currentOptions.animals.forEach(a => {
      const opt = document.createElement('option')
      opt.value = a.id
      opt.textContent = a.name
      if (a.id === currentOptions.currentAnimal) opt.selected = true
      animalSelect.appendChild(opt)
    })
    animalSelect.addEventListener('change', () => {
      currentOptions.onAnimalChange(animalSelect.value)
    })
    panel.appendChild(animalSelect)

    // Palette selector
    const paletteLabel = document.createElement('div')
    paletteLabel.textContent = 'Palette'
    paletteLabel.style.cssText = 'margin-bottom: 4px; color: #999; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;'
    panel.appendChild(paletteLabel)

    const paletteSelect = document.createElement('select')
    paletteSelect.style.cssText = `
      width: 100%; padding: 6px 8px; margin-bottom: 12px;
      background: #252525; border: 1px solid #444; border-radius: 4px;
      color: #eee; font-size: 13px; outline: none;
    `
    updatePaletteOptions(paletteSelect, currentOptions.palettes, currentOptions.currentPalette)
    paletteSelect.addEventListener('change', () => {
      currentOptions.onPaletteChange(paletteSelect.value)
    })
    panel.appendChild(paletteSelect)

    // Resolution
    const resLabel = document.createElement('div')
    resLabel.textContent = 'Resolution'
    resLabel.style.cssText = 'margin-bottom: 4px; color: #999; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;'
    panel.appendChild(resLabel)

    const resRow = document.createElement('div')
    resRow.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-bottom: 16px;'

    const resDisplay = document.createElement('span')
    resDisplay.textContent = `${currentOptions.currentResolution}\u00d7${currentOptions.currentResolution}`
    resDisplay.style.cssText = 'flex: 1;'
    resRow.appendChild(resDisplay)

    const resBtn = document.createElement('button')
    resBtn.textContent = 'Toggle'
    resBtn.style.cssText = `
      padding: 4px 10px; background: #333; border: 1px solid #555;
      border-radius: 4px; color: #eee; cursor: pointer; font-size: 12px;
    `
    resBtn.addEventListener('click', () => currentOptions.onResolutionToggle())
    resRow.appendChild(resBtn)
    panel.appendChild(resRow)

    // Accessories section
    const accLabel = document.createElement('div')
    accLabel.textContent = 'Accessories'
    accLabel.style.cssText = 'margin-top: 8px; margin-bottom: 4px; color: #999; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;'
    panel.appendChild(accLabel)

    currentOptions.accessories.forEach(acc => {
      const row = document.createElement('label')
      row.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-bottom: 4px; cursor: pointer; font-size: 13px;'

      const checkbox = document.createElement('input')
      checkbox.type = 'checkbox'
      checkbox.checked = currentOptions.currentAccessories.includes(acc.id)
      checkbox.addEventListener('change', () => {
        currentOptions.onAccessoryToggle?.(acc.id)
      })

      const text = document.createTextNode(acc.name)
      row.appendChild(checkbox)
      row.appendChild(text)
      panel.appendChild(row)
    })

    // Auto-start toggle
    const autoStartLabel = document.createElement('div')
    autoStartLabel.textContent = 'Startup'
    autoStartLabel.style.cssText = 'margin-top: 8px; margin-bottom: 4px; color: #999; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;'
    panel.appendChild(autoStartLabel)

    const autoRow = document.createElement('label')
    autoRow.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-bottom: 4px; cursor: pointer; font-size: 13px;'

    const autoCheck = document.createElement('input')
    autoCheck.type = 'checkbox'
    autoCheck.checked = currentOptions.autoLaunch ?? false
    autoCheck.addEventListener('change', () => {
      currentOptions.onAutoLaunchChange?.(autoCheck.checked)
    })

    const autoText = document.createTextNode('Auto-start on login')
    autoRow.appendChild(autoCheck)
    autoRow.appendChild(autoText)
    panel.appendChild(autoRow)

    // Separator line
    const sep = document.createElement('div')
    sep.style.cssText = 'height: 1px; background: #333; margin: 8px 0;'
    panel.appendChild(sep)

    // Diagnostics section
    const diagLabel = document.createElement('div')
    diagLabel.textContent = 'Diagnostics'
    diagLabel.style.cssText = 'margin-bottom: 4px; color: #999; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;'
    panel.appendChild(diagLabel)

    const diag = currentOptions.diagnostics
    if (diag) {
      const uptime = Math.floor(diag.uptimeMs / 1000)
      const uptimeStr = `${Math.floor(uptime / 60)}m ${uptime % 60}s`
      const lines = [
        `Version: ${diag.version}`,
        `Platform: ${diag.platform}`,
        `Electron: ${diag.electronVersion}`,
        `Uptime: ${uptimeStr}`
      ]
      lines.forEach(line => {
        const el = document.createElement('div')
        el.textContent = line
        el.style.cssText = 'font-size: 11px; color: #888; margin-bottom: 2px;'
        panel.appendChild(el)
      })
    }

    // Close button
    const closeBtn = document.createElement('button')
    closeBtn.textContent = 'Close'
    closeBtn.style.cssText = `
      width: 100%; padding: 8px; background: #333; border: 1px solid #555;
      border-radius: 6px; color: #eee; cursor: pointer; font-size: 13px;
    `
    closeBtn.addEventListener('click', hide)
    panel.appendChild(closeBtn)

    overlay.appendChild(panel)
    return overlay
  }

  function show(): void {
    hide()
    panelEl = buildPanel()
    document.body.appendChild(panelEl)
  }

  function hide(): void {
    if (panelEl) {
      panelEl.remove()
      panelEl = null
    }
  }

  function destroy(): void {
    hide()
  }

  function update(newOpts: Partial<SettingsPanelOptions>): void {
    Object.assign(currentOptions, newOpts)
    // If panel is visible, rebuild it
    if (panelEl) {
      show() // rebuild
    }
  }

  return { show, hide, destroy, update }
}
