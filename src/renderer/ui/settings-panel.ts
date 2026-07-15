export interface PackImportError {
  field: string
  message: string
}

export interface SettingsPanelOptions {
  animals: Array<{ id: string; name: string; source?: string }>
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
  importedCharacters?: Array<{ id: string; name: string; layerCount: number; qualityScore?: number }>
  importErrors?: PackImportError[]
  onAnimalChange: (animalId: string, packId?: string) => void
  onPaletteChange: (paletteId: string) => void
  onResolutionToggle: () => void
  onAutoLaunchChange?: (enabled: boolean) => void
  onAccessoryToggle?: (accessoryId: string) => void
  onImportPack?: () => Promise<void>
  onRemovePack?: (packId: string) => void
  onEditPack?: (packId: string) => void
  onOpenPacksDir?: () => Promise<void>
  // AI Generation
  onGenerateCharacter?: () => Promise<void>
  generationStatus?: string
  generationProgress?: number
  generationResult?: { packId: string; packName: string }
  generationError?: string
  // AI Action Generation
  onGenerateAction?: (prompt: string) => Promise<void>
  actionGenerationStatus?: string
  actionGenerationProgress?: number
  actionGenerationResult?: { packId: string; packName: string }
  actionGenerationError?: string
  // Action Packs
  actionPacks?: Array<{ id: string; name: string; frameCount: number; category: string; equipped: boolean }>
  onToggleActionEquip?: (packId: string, equipped: boolean) => void
  onPreviewAction?: (packId: string) => void
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

    // ── AI Generation section ──
    const genLabel = document.createElement('div')
    genLabel.textContent = 'AI Character'
    genLabel.style.cssText = 'margin-top: 8px; margin-bottom: 4px; color: #999; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;'
    panel.appendChild(genLabel)

    const genBtn = document.createElement('button')
    genBtn.textContent = currentOptions.generationStatus === 'running' ? '⏳ Generating...'
      : currentOptions.generationResult ? '✅ Generate Another'
      : '🎨 Generate from Image'
    genBtn.style.cssText = `
      width: 100%; padding: 6px; background: #2a2a4a; border: 1px solid #4a4a6a;
      border-radius: 4px; color: #88c; cursor: pointer; font-size: 12px;
      margin-bottom: 6px;
    `
    genBtn.disabled = currentOptions.generationStatus === 'running'
    genBtn.addEventListener('click', async () => {
      await currentOptions.onGenerateCharacter?.()
    })
    panel.appendChild(genBtn)

    // Generation progress bar
    if (currentOptions.generationProgress !== undefined && currentOptions.generationStatus === 'running') {
      const progressBar = document.createElement('div')
      progressBar.style.cssText = `
        width: 100%; height: 4px; background: #333; border-radius: 2px;
        margin-bottom: 6px; overflow: hidden;
      `
      const progressFill = document.createElement('div')
      progressFill.style.cssText = `
        width: ${currentOptions.generationProgress}%; height: 100%;
        background: #558; border-radius: 2px; transition: width 0.3s;
      `
      progressBar.appendChild(progressFill)
      panel.appendChild(progressBar)
    }

    // Generation result
    if (currentOptions.generationResult) {
      const resultBox = document.createElement('div')
      resultBox.style.cssText = `
        background: #1a2a1a; border: 1px solid #2a4a2a; border-radius: 4px;
        padding: 6px 8px; margin-bottom: 6px; font-size: 11px; color: #7c7;
      `
      resultBox.textContent = `✔ Saved: ${currentOptions.generationResult.packName}`
      panel.appendChild(resultBox)
    }

    // Generation error
    if (currentOptions.generationError) {
      const errorBox = document.createElement('div')
      errorBox.style.cssText = `
        background: #2a1a1a; border: 1px solid #5a2a2a; border-radius: 4px;
        padding: 6px 8px; margin-bottom: 6px; font-size: 11px; color: #c77;
      `
      errorBox.textContent = `✖ ${currentOptions.generationError}`
      panel.appendChild(errorBox)
    }

    // ── AI Action section ──
    const actionLabel = document.createElement('div')
    actionLabel.textContent = 'AI Action'
    actionLabel.style.cssText = 'margin-top: 8px; margin-bottom: 4px; color: #999; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;'
    panel.appendChild(actionLabel)

    const actionPrompt = document.createElement('input')
    actionPrompt.type = 'text'
    actionPrompt.placeholder = 'Describe an action... e.g. "coffee sip" or "happy dance"'
    actionPrompt.value = ''
    actionPrompt.style.cssText = `
      width: 100%; padding: 6px 8px; margin-bottom: 6px;
      background: #252525; border: 1px solid #444; border-radius: 4px;
      color: #eee; font-size: 12px; outline: none; box-sizing: border-box;
    `
    panel.appendChild(actionPrompt)

    const genActionBtn = document.createElement('button')
    genActionBtn.textContent = currentOptions.actionGenerationStatus === 'running' ? '⏳ Generating...'
      : currentOptions.actionGenerationResult ? '✅ Generate Another'
      : 'Generate Action'
    genActionBtn.style.cssText = `
      width: 100%; padding: 6px; background: #2a4a4a; border: 1px solid #3a6a6a;
      border-radius: 4px; color: #7cc; cursor: pointer; font-size: 12px;
      margin-bottom: 6px;
    `
    genActionBtn.disabled = currentOptions.actionGenerationStatus === 'running'
    genActionBtn.addEventListener('click', async () => {
      const prompt = actionPrompt.value.trim()
      if (!prompt) {
        actionPrompt.style.borderColor = '#c44'
        setTimeout(() => { actionPrompt.style.borderColor = '#444' }, 1500)
        return
      }
      await currentOptions.onGenerateAction?.(prompt)
    })
    panel.appendChild(genActionBtn)

    // Action generation progress bar
    if (currentOptions.actionGenerationProgress !== undefined && currentOptions.actionGenerationStatus === 'running') {
      const actionProgressBar = document.createElement('div')
      actionProgressBar.style.cssText = `
        width: 100%; height: 4px; background: #333; border-radius: 2px;
        margin-bottom: 6px; overflow: hidden;
      `
      const actionProgressFill = document.createElement('div')
      actionProgressFill.style.cssText = `
        width: ${currentOptions.actionGenerationProgress}%; height: 100%;
        background: #488; border-radius: 2px; transition: width 0.3s;
      `
      actionProgressBar.appendChild(actionProgressFill)
      panel.appendChild(actionProgressBar)
    }

    // Action generation result with save indication
    if (currentOptions.actionGenerationResult) {
      const actionResultBox = document.createElement('div')
      actionResultBox.style.cssText = `
        background: #1a2a2a; border: 1px solid #2a4a4a; border-radius: 4px;
        padding: 6px 8px; margin-bottom: 6px; font-size: 11px; color: #7cc;
      `
      actionResultBox.textContent = `✔ Saved: ${currentOptions.actionGenerationResult.packName}`
      panel.appendChild(actionResultBox)

      // Hint: right-click to find in context menu
      const hintBox = document.createElement('div')
      hintBox.style.cssText = 'font-size: 10px; color: #666; margin-bottom: 6px;'
      hintBox.textContent = 'Right-click the pet to find your action in the menu.'
      panel.appendChild(hintBox)
    }

    // Action generation error
    if (currentOptions.actionGenerationError) {
      const actionErrorBox = document.createElement('div')
      actionErrorBox.style.cssText = `
        background: #2a1a1a; border: 1px solid #5a2a2a; border-radius: 4px;
        padding: 6px 8px; margin-bottom: 6px; font-size: 11px; color: #c77;
      `
      actionErrorBox.textContent = `✖ ${currentOptions.actionGenerationError}`
      panel.appendChild(actionErrorBox)
    }

    // ── Packs section ──
    const packLabel = document.createElement('div')
    packLabel.textContent = 'Packs'
    packLabel.style.cssText = 'margin-top: 8px; margin-bottom: 4px; color: #999; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;'
    panel.appendChild(packLabel)

    // Import button
    const importBtn = document.createElement('button')
    importBtn.textContent = '+ Import Pack'
    importBtn.style.cssText = `
      width: 100%; padding: 6px; background: #2a4a2a; border: 1px solid #3a6a3a;
      border-radius: 4px; color: #7c7; cursor: pointer; font-size: 12px;
      margin-bottom: 6px;
    `
    importBtn.addEventListener('click', async () => {
      await currentOptions.onImportPack?.()
    })
    panel.appendChild(importBtn)

    // Open packs folder button
    const openFolderBtn = document.createElement('button')
    openFolderBtn.textContent = 'Open Packs Folder'
    openFolderBtn.style.cssText = `
      width: 100%; padding: 6px; background: #2a304a; border: 1px solid #3a4a6a;
      border-radius: 4px; color: #88c; cursor: pointer; font-size: 12px;
      margin-bottom: 6px;
    `
    openFolderBtn.addEventListener('click', async () => {
      await currentOptions.onOpenPacksDir?.()
    })
    panel.appendChild(openFolderBtn)

    // Imported packs list
    if (currentOptions.importedCharacters && currentOptions.importedCharacters.length > 0) {
      for (const pack of currentOptions.importedCharacters) {
        const row = document.createElement('div')
        row.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-bottom: 3px; font-size: 12px;'

        row.style.cursor = 'pointer'
        row.addEventListener('click', (e) => {
          if (e.target === removeBtn) return
          currentOptions.onAnimalChange(pack.id, pack.id)
        })

        const nameSpan = document.createElement('span')
        const isActive = pack.id === currentOptions.currentAnimal
        nameSpan.textContent = `${pack.name}`
        nameSpan.style.cssText = `flex: 1; color: ${isActive ? '#fff' : '#ccc'}; font-weight: ${isActive ? '600' : '400'};`
        row.appendChild(nameSpan)

        const layersSpan = document.createElement('span')
        layersSpan.textContent = `${pack.layerCount} layers`
        layersSpan.style.cssText = 'font-size: 10px; color: #666;'
        row.appendChild(layersSpan)

        // Quality score badge for generated packs
        if (pack.qualityScore !== undefined) {
          const scoreBadge = document.createElement('span')
          const scoreVal = pack.qualityScore
          scoreBadge.textContent = `★${scoreVal}`
          const scoreColor = scoreVal >= 70 ? '#5a5' : scoreVal >= 40 ? '#aa5' : '#a55'
          scoreBadge.style.cssText = `font-size: 10px; color: ${scoreColor}; font-weight: 600; padding: 0 3px;`
          row.appendChild(scoreBadge)
        }

        const editBtn = document.createElement('button')
        editBtn.textContent = 'Edit'
        editBtn.style.cssText = `
          background: #3a3a5e; border: 1px solid #555; border-radius: 3px;
          color: #ccc; cursor: pointer; font-size: 10px; padding: 1px 6px;
        `
        editBtn.addEventListener('click', (e) => {
          e.stopPropagation()
          currentOptions.onEditPack?.(pack.id)
        })
        row.appendChild(editBtn)

        const removeBtn = document.createElement('button')
        removeBtn.textContent = '✕'
        removeBtn.style.cssText = `
          background: none; border: none; color: #855; cursor: pointer;
          font-size: 12px; padding: 0 2px;
        `
        removeBtn.addEventListener('click', (e) => {
          e.stopPropagation()
          currentOptions.onRemovePack?.(pack.id)
        })
        row.appendChild(removeBtn)

        panel.appendChild(row)
      }
    }

    // Import errors display
    if (currentOptions.importErrors && currentOptions.importErrors.length > 0) {
      const errorBox = document.createElement('div')
      errorBox.style.cssText = `
        background: #2a1a1a; border: 1px solid #5a2a2a; border-radius: 4px;
        padding: 6px 8px; margin-bottom: 6px; font-size: 11px; color: #c77;
      `
      const errorTitle = document.createElement('div')
      errorTitle.textContent = 'Import errors:'
      errorTitle.style.cssText = 'font-weight: 600; margin-bottom: 3px;'
      errorBox.appendChild(errorTitle)

      for (const err of currentOptions.importErrors) {
        const errLine = document.createElement('div')
        errLine.textContent = `  ${err.field}: ${err.message}`
        errLine.style.cssText = 'margin-bottom: 1px;'
        errorBox.appendChild(errLine)
      }
      panel.appendChild(errorBox)
    }

    const packSep = document.createElement('div')
    packSep.style.cssText = 'height: 1px; background: #333; margin: 8px 0;'
    panel.appendChild(packSep)

    // ── Actions section ──
    const actionPackLabel = document.createElement('div')
    actionPackLabel.textContent = 'Actions'
    actionPackLabel.style.cssText = 'margin-top: 8px; margin-bottom: 4px; color: #999; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;'
    panel.appendChild(actionPackLabel)

    if (currentOptions.actionPacks && currentOptions.actionPacks.length > 0) {
      for (const ap of currentOptions.actionPacks) {
        const row = document.createElement('div')
        row.style.cssText = 'display: flex; align-items: center; gap: 6px; margin-bottom: 3px; font-size: 12px;'

        const nameSpan = document.createElement('span')
        nameSpan.textContent = `${ap.name}`
        nameSpan.style.cssText = 'flex: 1; color: #ccc;'
        row.appendChild(nameSpan)

        const metaSpan = document.createElement('span')
        metaSpan.textContent = `${ap.frameCount}f · ${ap.category}`
        metaSpan.style.cssText = 'font-size: 10px; color: #666;'
        row.appendChild(metaSpan)

        // Preview button
        const previewBtn = document.createElement('button')
        previewBtn.textContent = '▶'
        previewBtn.title = 'Preview action'
        previewBtn.style.cssText = `
          background: none; border: 1px solid #555; border-radius: 3px;
          color: #5a5; cursor: pointer; font-size: 10px; padding: 1px 4px;
        `
        previewBtn.addEventListener('click', (e) => {
          e.stopPropagation()
          currentOptions.onPreviewAction?.(ap.id)
        })
        row.appendChild(previewBtn)

        // Equip toggle
        const equipCheck = document.createElement('input')
        equipCheck.type = 'checkbox'
        equipCheck.checked = ap.equipped
        equipCheck.title = 'Show in context menu'
        equipCheck.addEventListener('change', () => {
          currentOptions.onToggleActionEquip?.(ap.id, equipCheck.checked)
        })
        row.appendChild(equipCheck)

        const equipLabel = document.createElement('span')
        equipLabel.textContent = 'Menu'
        equipLabel.style.cssText = 'font-size: 10px; color: #666;'
        row.appendChild(equipLabel)

        panel.appendChild(row)
      }
    } else {
      const empty = document.createElement('div')
      empty.textContent = 'No action packs imported'
      empty.style.cssText = 'font-size: 11px; color: #555; padding: 4px 0;'
      panel.appendChild(empty)
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
