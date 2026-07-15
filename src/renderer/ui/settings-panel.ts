/**
 * PixelPet Settings Panel — iOS-style bottom sheet.
 * Uses the shared design-system.ts helpers for all elements.
 */

import {
  injectDesignSystem,
  FONT_STACK,
  MONO_STACK,
  createSection,
  createCard,
  createButton,
  createToggle,
  createSelect,
  createBadge,
  createProgressBar,
  createRow,
  createCodeBlock,
  createSeparator,
  animateSheetIn,
  animateSheetOut,
  getTheme,
  setTheme,
  toggleTheme,
} from './design-system'
import { t, getLocale, setLocale } from '../assets/locale'

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
  injectDesignSystem()

  let panelEl: HTMLDivElement | null = null
  let currentOptions = { ...options }
  // Keep references so update() can patch without full rebuild
  let toggleRefs = new Map<string, ReturnType<typeof createToggle>>()
  let progressBarRef: HTMLDivElement | null = null
  let actionProgressBarRef: HTMLDivElement | null = null

  // ── Build the overlay + sheet ──

  function buildPanel(): HTMLDivElement {
    toggleRefs.clear()
    progressBarRef = null
    actionProgressBarRef = null

    const overlay = document.createElement('div')
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: var(--ds-backdrop);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 9998;
      display: flex; align-items: flex-end; justify-content: center;
    `
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) hide()
    })

    // ── Sheet ──
    const sheet = document.createElement('div')
    sheet.className = 'ds-sheet'
    sheet.style.cssText = `
      background: var(--ds-panel-bg);
      border-radius: 14px 14px 0 0;
      width: 100%; max-width: 420px;
      max-height: 75vh;
      overflow-y: auto;
      padding: 24px;
      font-family: ${FONT_STACK};
      color: var(--ds-text-primary);
      font-size: 13px;
      user-select: none;
      box-shadow: 0 -4px 30px var(--ds-shadow-color);
      transform: translateY(100%);
      transition: none;
    `
    sheet.classList.add('ds-scroll')

    // ── Drag handle ──
    const handle = document.createElement('div')
    handle.style.cssText = `
      width: 36px; height: 4px; border-radius: 2px;
      background: var(--ds-tertiary-fill); margin: 0 auto 20px;
    `
    sheet.appendChild(handle)

    // ── Title row ──
    const titleRow = document.createElement('div')
    titleRow.style.cssText = 'display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;'

    const title = document.createElement('div')
    title.textContent = t('settings.title')
    title.style.cssText = 'font-size: 15px; font-weight: 600;'

    const closeBtn = document.createElement('button')
    closeBtn.textContent = '✕'
    closeBtn.style.cssText = `
      border: none; background: var(--ds-secondary-fill); color: var(--ds-text-secondary);
      width: 28px; height: 28px; border-radius: 14px;
      cursor: pointer; font-size: 13px; display: flex;
      align-items: center; justify-content: center;
      transition: background 0.15s;
    `
    closeBtn.addEventListener('mouseenter', () => { closeBtn.style.background = 'var(--ds-tertiary-fill)' })
    closeBtn.addEventListener('mouseleave', () => { closeBtn.style.background = 'var(--ds-secondary-fill)' })
    closeBtn.addEventListener('click', hide)
    titleRow.appendChild(title)
    titleRow.appendChild(closeBtn)
    sheet.appendChild(titleRow)

    // ═══════════════════════════════════════
    // SECTION: Character
    // ═══════════════════════════════════════
    const charSection = createSection(t('settings.character'))
    const charCard = createCard()

    const animalRow = document.createElement('div')
    animalRow.style.cssText = 'margin-bottom: 10px;'
    const animalLabel = document.createElement('div')
    animalLabel.textContent = t('settings.animal')
    animalLabel.style.cssText = 'font-size: 11px; color: var(--ds-text-secondary); margin-bottom: 4px;'
    animalRow.appendChild(animalLabel)
    const animalSelect = createSelect(
      currentOptions.animals,
      currentOptions.currentAnimal,
      (id) => currentOptions.onAnimalChange(id),
    )
    animalRow.appendChild(animalSelect)
    charCard.appendChild(animalRow)

    const paletteRow = document.createElement('div')
    paletteRow.style.cssText = 'margin-bottom: 0;'
    const paletteLabel = document.createElement('div')
    paletteLabel.textContent = t('settings.palette')
    paletteLabel.style.cssText = 'font-size: 11px; color: var(--ds-text-secondary); margin-bottom: 4px;'
    paletteRow.appendChild(paletteLabel)
    const paletteSelect = createSelect(
      currentOptions.palettes,
      currentOptions.currentPalette,
      (id) => currentOptions.onPaletteChange(id),
    )
    paletteRow.appendChild(paletteSelect)
    charCard.appendChild(paletteRow)

    // Resolution row inside character card
    const resRow = document.createElement('div')
    resRow.style.cssText = 'display: flex; align-items: center; gap: 12px; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--ds-separator);'
    const resLabel = document.createElement('span')
    resLabel.textContent = t('settings.resolution')
    resLabel.style.cssText = 'flex: 1; font-size: 13px;'
    resRow.appendChild(resLabel)
    const resDisplay = document.createElement('span')
    resDisplay.textContent = `${currentOptions.currentResolution}×${currentOptions.currentResolution}`
    resDisplay.style.cssText = 'font-size: 11px; color: var(--ds-text-secondary); font-family: ' + MONO_STACK + ';'
    resRow.appendChild(resDisplay)
    const resToggleBtn = createButton(t('settings.toggle'), 'secondary', () => currentOptions.onResolutionToggle())
    resToggleBtn.style.cssText = resToggleBtn.style.cssText + ';padding: 4px 12px; font-size: 11px;'
    resRow.appendChild(resToggleBtn)
    charCard.appendChild(resRow)

    charSection.container.appendChild(charCard)
    sheet.appendChild(charSection.container)

    // ═══════════════════════════════════════
    // SECTION: Appearance
    // ═══════════════════════════════════════
    const appearSection = createSection(t('settings.appearance'))
    const appearCard = createCard()

    // Accessory toggles
    currentOptions.accessories.forEach(acc => {
      const toggle = createToggle(
        currentOptions.currentAccessories.includes(acc.id),
        () => currentOptions.onAccessoryToggle?.(acc.id),
      )
      toggleRefs.set(`acc:${acc.id}`, toggle)
      appearCard.appendChild(createRow(acc.name, toggle.element))
    })

    // Separator between accessories and auto-start
    if (currentOptions.accessories.length > 0) {
      const sep = createSeparator()
      sep.style.margin = '4px 0 8px'
      appearCard.appendChild(sep)
    }

    // Auto-start toggle
    const autoToggle = createToggle(
      currentOptions.autoLaunch ?? false,
      (checked) => currentOptions.onAutoLaunchChange?.(checked),
    )
    toggleRefs.set('autoLaunch', autoToggle)
    appearCard.appendChild(createRow(t('settings.autostart'), autoToggle.element))

    // Theme toggle
    const themeToggle = createToggle(
      getTheme() === 'light',
      () => { toggleTheme() },
    )
    appearCard.appendChild(createRow(t('settings.lightmode'), themeToggle.element))

    // Language toggle
    const langToggle = createToggle(
      getLocale() === 'en',
      (checked) => {
        setLocale(checked ? 'en' : 'zh')
        // Rebuild the whole panel on language switch
        buildPanel()
      },
    )
    appearCard.appendChild(createRow(t('settings.language'), langToggle.element))

    appearSection.container.appendChild(appearCard)
    sheet.appendChild(appearSection.container)

    // ═══════════════════════════════════════
    // SECTION: AI Character Generation
    // ═══════════════════════════════════════
    if (currentOptions.onGenerateCharacter) {
      const genSection = createSection(t('settings.aicharacter'))
      const genCard = createCard()

      const genBtn = createButton(
        currentOptions.generationStatus === 'running' ? '⏳ ' + t('settings.generating')
          : currentOptions.generationResult ? t('settings.generate')
          : t('settings.generate'),
        'secondary',
        async () => { await currentOptions.onGenerateCharacter?.() },
      )
      genBtn.style.width = '100%'
      genBtn.disabled = currentOptions.generationStatus === 'running'
      genCard.appendChild(genBtn)

      // Generation hint
      const hint = document.createElement('div')
      hint.textContent = 'Drop an image to generate a matching character'
      hint.style.cssText = 'font-size: 11px; color: var(--ds-text-tertiary); margin-top: 6px;'
      genCard.appendChild(hint)

      // Progress bar
      if (currentOptions.generationProgress !== undefined && currentOptions.generationStatus === 'running') {
        const pBar = createProgressBar(currentOptions.generationProgress)
        progressBarRef = pBar
        pBar.style.marginTop = '8px'
        genCard.appendChild(pBar)
      }

      // Result badge
      if (currentOptions.generationResult) {
        genCard.appendChild(createBadge(`Saved: ${currentOptions.generationResult.packName}`, '#30d158'))
      }

      // Error badge
      if (currentOptions.generationError) {
        genCard.appendChild(createBadge(currentOptions.generationError, '#ff453a'))
      }

      genSection.container.appendChild(genCard)
      sheet.appendChild(genSection.container)
    }

    // ═══════════════════════════════════════
    // SECTION: AI Action Generation
    // ═══════════════════════════════════════
    if (currentOptions.onGenerateAction) {
      const actionSection = createSection(t('settings.aiaction'))
      const actionCard = createCard()

      const promptInput = document.createElement('input')
      promptInput.type = 'text'
      promptInput.placeholder = 'Describe an action... e.g. "coffee sip"'
      promptInput.value = ''
      promptInput.style.cssText = `
        width: 100%; padding: 8px 12px; margin-bottom: 8px;
        background: var(--ds-panel-bg); border: 1px solid var(--ds-separator);
        border-radius: 8px; color: var(--ds-text-primary);
        font-family: ${FONT_STACK}; font-size: 13px;
        outline: none; transition: border-color 0.15s;
        box-sizing: border-box;
      `
      promptInput.addEventListener('focus', () => { promptInput.style.borderColor = '#007aff' })
      promptInput.addEventListener('blur', () => { promptInput.style.borderColor = 'var(--ds-separator)' })
      actionCard.appendChild(promptInput)

      const genActionBtn = createButton(
        currentOptions.actionGenerationStatus === 'running' ? '⏳ Generating...'
          : currentOptions.actionGenerationResult ? 'Generate Another'
          : 'Generate Action',
        'secondary',
        async () => {
          const text = promptInput.value.trim()
          if (!text) {
            promptInput.style.borderColor = '#ff453a'
            setTimeout(() => { promptInput.style.borderColor = 'var(--ds-separator)' }, 1500)
            return
          }
          await currentOptions.onGenerateAction?.(text)
        },
      )
      genActionBtn.style.width = '100%'
      genActionBtn.disabled = currentOptions.actionGenerationStatus === 'running'
      actionCard.appendChild(genActionBtn)

      // Hint
      const actionHint = document.createElement('div')
      actionHint.textContent = 'Describe a short animation or gesture'
      actionHint.style.cssText = 'font-size: 11px; color: var(--ds-text-tertiary); margin-top: 6px;'
      actionCard.appendChild(actionHint)

      // Progress bar
      if (currentOptions.actionGenerationProgress !== undefined && currentOptions.actionGenerationStatus === 'running') {
        const apBar = createProgressBar(currentOptions.actionGenerationProgress)
        actionProgressBarRef = apBar
        apBar.style.marginTop = '8px'
        actionCard.appendChild(apBar)
      }

      // Result
      if (currentOptions.actionGenerationResult) {
        actionCard.appendChild(createBadge(`Saved: ${currentOptions.actionGenerationResult.packName}`, '#30d158'))
        const hintBox = document.createElement('div')
        hintBox.textContent = 'Right-click the pet to find your action in the menu.'
        hintBox.style.cssText = 'font-size: 10px; color: var(--ds-text-tertiary); margin-top: 4px;'
        actionCard.appendChild(hintBox)
      }

      // Error
      if (currentOptions.actionGenerationError) {
        actionCard.appendChild(createBadge(currentOptions.actionGenerationError, '#ff453a'))
      }

      actionSection.container.appendChild(actionCard)
      sheet.appendChild(actionSection.container)
    }

    // ═══════════════════════════════════════
    // SECTION: Packs
    // ═══════════════════════════════════════
    const packSection = createSection(t('settings.packs'))
    const packCard = createCard()

    // Buttons row
    const packBtnRow = document.createElement('div')
    packBtnRow.style.cssText = 'display: flex; gap: 8px; margin-bottom: 8px;'

    const importBtn = createButton('+ ' + t('settings.importpack'), 'secondary', async () => {
      await currentOptions.onImportPack?.()
    })
    importBtn.style.flex = '1'
    packBtnRow.appendChild(importBtn)

    const openFolderBtn = createButton('Open Folder', 'ghost', async () => {
      await currentOptions.onOpenPacksDir?.()
    })
    openFolderBtn.style.flex = '1'
    packBtnRow.appendChild(openFolderBtn)

    packCard.appendChild(packBtnRow)

    // Imported packs list
    if (currentOptions.importedCharacters && currentOptions.importedCharacters.length > 0) {
      for (const pack of currentOptions.importedCharacters) {
        const row = document.createElement('div')
        row.style.cssText = `
          display: flex; align-items: center; gap: 8px;
          padding: 6px 0; border-bottom: 1px solid var(--ds-separator);
          cursor: pointer; min-height: 36px;
        `
        row.addEventListener('click', (e) => {
          if ((e.target as HTMLElement).closest('button')) return
          currentOptions.onAnimalChange(pack.id, pack.id)
        })

        const isActive = pack.id === currentOptions.currentAnimal
        const nameSpan = document.createElement('span')
        nameSpan.textContent = pack.name
        nameSpan.style.cssText = `flex: 1; font-size: 13px; color: ${isActive ? 'var(--ds-text-primary)' : 'var(--ds-text-secondary)'}; font-weight: ${isActive ? '600' : '400'};`
        row.appendChild(nameSpan)

        const layersSpan = document.createElement('span')
        layersSpan.textContent = `${pack.layerCount} layers`
        layersSpan.style.cssText = 'font-size: 11px; color: var(--ds-text-tertiary); font-family: ' + MONO_STACK + ';'
        row.appendChild(layersSpan)

        // Quality score
        if (pack.qualityScore !== undefined) {
          row.appendChild(createBadge(`★${pack.qualityScore}`, pack.qualityScore >= 70 ? '#30d158' : pack.qualityScore >= 40 ? '#ff9f0a' : '#ff453a'))
        }

        const editBtn = createButton('Edit', 'ghost', (e) => {
          e.stopPropagation()
          currentOptions.onEditPack?.(pack.id)
        })
        editBtn.style.cssText = editBtn.style.cssText + ';padding: 2px 8px; font-size: 11px;'
        row.appendChild(editBtn)

        const removeBtn = createButton('✕', 'ghost', (e) => {
          e.stopPropagation()
          currentOptions.onRemovePack?.(pack.id)
        })
        removeBtn.style.cssText = removeBtn.style.cssText + ';padding: 2px 6px; font-size: 11px; color: #ff453a;'
        removeBtn.addEventListener('mouseenter', () => { removeBtn.style.background = '#3a3a3c'; removeBtn.style.color = '#ff6259' })
        removeBtn.addEventListener('mouseleave', () => { removeBtn.style.background = 'transparent'; removeBtn.style.color = '#ff453a' })
        row.appendChild(removeBtn)

        packCard.appendChild(row)
      }
    }

    // Import errors
    if (currentOptions.importErrors && currentOptions.importErrors.length > 0) {
      const errBadge = createBadge('Import errors', '#ff453a')
      errBadge.style.marginBottom = '6px'
      packCard.appendChild(errBadge)
      for (const err of currentOptions.importErrors) {
        const errLine = document.createElement('div')
        errLine.textContent = `${err.field}: ${err.message}`
        errLine.style.cssText = `font-size: 11px; color: #ff453a; margin-bottom: 2px; font-family: ${MONO_STACK};`
        packCard.appendChild(errLine)
      }
    }

    packSection.container.appendChild(packCard)
    sheet.appendChild(packSection.container)

    // ═══════════════════════════════════════
    // SECTION: Actions
    // ═══════════════════════════════════════
    const actionSection = createSection(t('settings.actions'))
    const actionCard = createCard()

    if (currentOptions.actionPacks && currentOptions.actionPacks.length > 0) {
      for (const ap of currentOptions.actionPacks) {
        const row = document.createElement('div')
        row.style.cssText = `
          display: flex; align-items: center; gap: 8px;
          padding: 6px 0; border-bottom: 1px solid var(--ds-separator);
          min-height: 36px;
        `

        const nameSpan = document.createElement('span')
        nameSpan.textContent = ap.name
        nameSpan.style.cssText = 'flex: 1; font-size: 13px; color: var(--ds-text-primary);'
        row.appendChild(nameSpan)

        const metaSpan = document.createElement('span')
        metaSpan.textContent = `${ap.frameCount}f · ${ap.category}`
        metaSpan.style.cssText = 'font-size: 11px; color: var(--ds-text-tertiary);'
        row.appendChild(metaSpan)

        const previewBtn = createButton('▶', 'ghost', (e) => {
          e.stopPropagation()
          currentOptions.onPreviewAction?.(ap.id)
        })
        previewBtn.style.cssText = previewBtn.style.cssText + ';padding: 2px 8px; font-size: 11px; color: #30d158;'
        previewBtn.title = 'Preview action'
        row.appendChild(previewBtn)

        const equipToggle = createToggle(ap.equipped, (checked) => {
          currentOptions.onToggleActionEquip?.(ap.id, checked)
        })
        toggleRefs.set(`equip:${ap.id}`, equipToggle)
        row.appendChild(equipToggle.element)

        const equipLabel = document.createElement('span')
        equipLabel.textContent = 'Menu'
        equipLabel.style.cssText = 'font-size: 11px; color: var(--ds-text-tertiary);'
        row.appendChild(equipLabel)

        actionCard.appendChild(row)
      }
    } else {
      const empty = document.createElement('div')
      empty.textContent = 'No action packs imported'
      empty.style.cssText = 'font-size: 13px; color: var(--ds-text-tertiary); padding: 4px 0;'
      actionCard.appendChild(empty)
    }

    actionSection.container.appendChild(actionCard)
    sheet.appendChild(actionSection.container)

    // ═══════════════════════════════════════
    // SECTION: Diagnostics
    // ═══════════════════════════════════════
    const diag = currentOptions.diagnostics
    if (diag) {
      const diagSection = createSection(t('settings.diagnostics'))
      const uptime = Math.floor(diag.uptimeMs / 1000)
      const uptimeStr = `${Math.floor(uptime / 60)}m ${uptime % 60}s`
      const lines = [
        `Version: ${diag.version}`,
        `Platform: ${diag.platform}`,
        `Electron: ${diag.electronVersion}`,
        `Uptime: ${uptimeStr}`,
      ]
      diagSection.container.appendChild(createCodeBlock(lines))
      sheet.appendChild(diagSection.container)
    }

    overlay.appendChild(sheet)
    return overlay
  }

  // ── show / hide / destroy / update ──

  function show(): void {
    hide()
    panelEl = buildPanel()
    document.body.appendChild(panelEl)
    animateSheetIn(panelEl)
  }

  async function hide(): Promise<void> {
    if (panelEl) {
      await animateSheetOut(panelEl)
      panelEl.remove()
      panelEl = null
    }
  }

  function destroy(): void {
    if (panelEl) {
      panelEl.remove()
      panelEl = null
    }
  }

  function update(newOpts: Partial<SettingsPanelOptions>): void {
    Object.assign(currentOptions, newOpts)
    // Update toggle refs without full rebuild for fast responsive feel
    if (panelEl) {
      // If progress or result changed, full rebuild is simplest
      if (
        newOpts.generationProgress !== undefined ||
        newOpts.generationStatus !== undefined ||
        newOpts.generationResult !== undefined ||
        newOpts.generationError !== undefined ||
        newOpts.actionGenerationProgress !== undefined ||
        newOpts.actionGenerationStatus !== undefined ||
        newOpts.actionGenerationResult !== undefined ||
        newOpts.actionGenerationError !== undefined ||
        newOpts.importErrors !== undefined ||
        newOpts.importedCharacters !== undefined ||
        newOpts.actionPacks !== undefined ||
        newOpts.animals !== undefined ||
        newOpts.palettes !== undefined
      ) {
        show()
        return
      }

      // Quick patches for toggles and selects
      if (newOpts.currentAccessories !== undefined) {
        currentOptions.accessories.forEach(acc => {
          const ref = toggleRefs.get(`acc:${acc.id}`)
          if (ref) ref.setChecked(newOpts.currentAccessories!.includes(acc.id))
        })
      }
      if (newOpts.autoLaunch !== undefined) {
        const ref = toggleRefs.get('autoLaunch')
        if (ref) ref.setChecked(newOpts.autoLaunch)
      }
      if (newOpts.currentPalette !== undefined) {
        const select = panelEl.querySelector('select') as HTMLSelectElement | null
        // We rebuild if palette list changes, so just sync selection
      }
    }
  }

  return { show, hide, destroy, update }
}
