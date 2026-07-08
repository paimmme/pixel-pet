/// <reference types="vite/client" />

import { createDisplaySurface } from './ui/pet-canvas'
import { setupPointerRouter } from './interaction/pointer-router'
import { setupDragHandler } from './interaction/drag-handler'
import { createInteractionController } from './interaction/interaction-controller'
import { createContextMenu } from './ui/context-menu'
import { createGestureDetector } from './interaction/gesture-detector'
import { createMovementController } from './engine/movement-controller'
import { SpriteCompositor } from './engine/sprite-compositor'
import { AnimationController } from './engine/animation-controller'
import { AssetLoader } from './assets/asset-loader'
import { composeAnimation } from './engine/compose-animation'
import { SelectionStore } from './state/selection-store'
import { PetStateMachine, PetState } from './state/pet-state-machine'
import { getAction, ANIMALS, getAnimal, getPalettesForAnimal, ACCESSORIES } from './assets/catalog'
import type { ElectronAPI } from '../shared/ipc-types'
import type { ComposeConfig } from './engine/types'
import { createSettingsPanel } from './ui/settings-panel'
import { createWalkController } from './state/walk-controller'

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

async function main(): Promise<void> {
  const canvas = document.getElementById('pet-canvas') as HTMLCanvasElement | null
  if (!canvas) {
    console.error('Pet canvas element not found')
    return
  }

  const api = window.electronAPI
  if (!api) {
    console.error('electronAPI not available — running outside Electron?')
    return
  }

  // --- Phase 0 services ---
  const pointer = setupPointerRouter(canvas, api)

  // --- Phase 1 engine ---
  const display = createDisplaySurface(canvas, 32, 3)
  const loader = new AssetLoader()
  const compositor = new SpriteCompositor(32)
  const animController = new AnimationController()
  const selectionStore = new SelectionStore()
  const stateMachine = new PetStateMachine()

  // Wire tray action menu → pending buffer
  api.onAction((actionId: string) => {
    if (actionId === 'idle' && stateMachine.state === PetState.Idle) return
    triggerAction(actionId)
  })

  // --- Phase 2 interaction ---
  const interaction = createInteractionController(canvas, stateMachine)
  const gestureDetector = createGestureDetector({
    canvas,
    stateMachine,
    cooldown: 600,
    threshold: 3,
    window: 400
  })

  // Context menu actions
  const ctxMenu = createContextMenu(canvas, {
    actions: [
      { actionId: 'idle', label: 'Idle 🐾' },
      { actionId: 'jump', label: 'Jump' },
      { actionId: 'wave', label: 'Wave' },
      { actionId: 'settings', label: 'Settings' },
      { actionId: 'separator', label: '' },
      { actionId: 'quit', label: 'Quit' }
    ],
    onAction: (actionId) => {
      if (actionId === 'quit') {
        api.quitApp()
        return
      }
      if (actionId === 'settings') {
        if (!settingsPanel) {
          const animal = getAnimal(selectionStore.animal)
          const availablePalettes = getPalettesForAnimal(selectionStore.animal)

          settingsPanel = createSettingsPanel({
            animals: ANIMALS.map(a => ({ id: a.id, name: a.name })),
            palettes: availablePalettes,
            accessories: ACCESSORIES.map(a => ({ id: a.id, name: a.name })),
            currentAnimal: selectionStore.animal,
            currentPalette: selectionStore.palette,
            currentAccessories: selectionStore.accessories,
            currentResolution: selectionStore.resolution,
            autoLaunch: autoLaunchEnabled,
            onAnimalChange: (animalId) => {
              selectionStore.setAnimal(animalId)
              // Auto-select default palette for new animal
              const newAnimal = getAnimal(animalId)
              if (newAnimal) {
                selectionStore.setPalette(newAnimal.defaultPalette)
              }
              // Clear asset cache so new animal's assets are loaded fresh
              loader.clearCache()
              // Re-trigger current action with new animal
              stateMachine.feedEvent({ type: 'change' })
              refreshSettingsPanel()
            },
            onPaletteChange: (paletteId) => {
              selectionStore.setPalette(paletteId)
              // Re-compose current animation with new palette
              stateMachine.feedEvent({ type: 'change' })
              refreshSettingsPanel()
            },
            onResolutionToggle: () => {
              const current = selectionStore.resolution
              selectionStore.setResolution(current === 32 ? 16 : 32)
              loader.clearCache()
              stateMachine.feedEvent({ type: 'change' })
              refreshSettingsPanel()
            },
            onAutoLaunchChange: (enabled) => {
              autoLaunchEnabled = enabled
              api.setAutoLaunch(enabled)
            },
            onAccessoryToggle: (accId) => {
              selectionStore.toggleAccessory(accId)
              // Re-compose current animation with updated accessories
              stateMachine.feedEvent({ type: 'change' })
            }
          })
        }
        settingsPanel.show()
        return
      }
      triggerAction(actionId)
    },
    theme: 'dark'
  })

  // --- Settings panel ---
  let settingsPanel: ReturnType<typeof createSettingsPanel> | null = null

  function refreshSettingsPanel(): void {
    if (settingsPanel) {
      settingsPanel.update({
        currentAnimal: selectionStore.animal,
        currentPalette: selectionStore.palette,
        currentResolution: selectionStore.resolution,
        currentAccessories: selectionStore.accessories,
        palettes: getPalettesForAnimal(selectionStore.animal)
      })
    }
  }

  // Wire context menu trigger
  interaction.onContextMenu = (x: number, y: number) => {
    ctxMenu.show(x, y)
  }

  // Drag handler (with drag state machine events)
  const drag = setupDragHandler({
    canvas,
    electronAPI: api,
    getIsHit: () => pointer.isHit,
    onDragStart: () => stateMachine.feedEvent({ type: 'drag-start' }),
    onDragEnd: () => stateMachine.feedEvent({ type: 'drag-end' })
  })

  // Movement (click-to-follow)
  const movement = createMovementController(api, () => {
    // Arrived at destination — play idle
    if (stateMachine.state === PetState.Idle) {
      playAction('idle')
    }
  })

  // Walk controller (auto-walk behavior)
  const walk = createWalkController(api, stateMachine, selectionStore, movement, () => {
    triggerAction('walk')
  })

  // Fetch diagnostics on load for the settings panel
  api.getDiagnostics().catch(() => {})

  // --- Animation loop ---
  animController.setDrawCallback((bitmap) => {
    display.drawFrame(bitmap, interaction.pupilOffset)
  })

  // --- Pending action buffer ---
  let pendingAction: string | null = null
  let autoLaunchEnabled = false

  function triggerAction(actionId: string): void {
    if (drag.isDragging) return
    pendingAction = actionId
    stateMachine.feedEvent({ type: 'action' })
  }

  // --- Compose and play an action ---
  async function playAction(actionId: string): Promise<void> {
    const config: ComposeConfig = {
      animal: selectionStore.animal,
      action: actionId,
      resolution: selectionStore.resolution,
      palette: selectionStore.palette,
      direction: selectionStore.direction,
      accessories: selectionStore.accessories.length > 0 ? selectionStore.accessories : undefined
    }

    const actionDef = getAction(actionId)
    if (!actionDef) {
      console.error(`Unknown action: ${actionId}`)
      return
    }

    try {
      const result = await composeAnimation(loader, compositor, config)
      animController.setFrames(result.frames, actionDef.fps, actionDef.loop)
      animController.start()
    } catch (err) {
      console.error('Failed to compose animation:', err)
    }
  }

  // --- Single click router ---
  let lastClickTime = 0

  canvas.addEventListener('click', (e) => {
    if (drag.isDragging) {
      // Drag in progress — ignore click
      return
    }

    if (pointer.isHit) {
      // Click on pet area
      const now = Date.now()
      const isDoubleClick = now - lastClickTime < 300
      lastClickTime = now

      if (isDoubleClick) {
        // Double-click: trigger reaction
        stateMachine.feedEvent({ type: 'react' })
      }
    } else {
      // Click on transparent area (desktop) — click-to-follow
      movement.moveTo(e.screenX, e.screenY)
    }
  })

  // --- Handle animation complete → notify state machine ---
  animController.onComplete(() => {
    stateMachine.feedEvent({ type: 'animation-complete' })
  })

  // --- Handle state machine state changes ---
  stateMachine.subscribe((_event, newState) => {
    switch (newState) {
      case PetState.Reacting:
        playAction('wave')
        break
      case PetState.Acting:
        // Play the pending action
        if (pendingAction) {
          playAction(pendingAction)
          pendingAction = null
        } else {
          playAction(selectionStore.action)
        }
        break
      case PetState.Idle:
        // If there's a pending action, play it; otherwise idle
        if (pendingAction) {
          const nextAction = pendingAction
          pendingAction = null
          playAction(nextAction)
        } else {
          playAction('idle')
        }
        break
      case PetState.Dragging:
        // Animation continues during drag — no change
        break
    }
  })

  // --- Handle selection changes ---
  selectionStore.subscribe((store) => {
    api.saveState({
      window: { x: 0, y: 0 },
      selection: {
        animal: store.animal,
        action: store.action,
        resolution: store.resolution,
        palette: store.palette
      }
    })
    if (animController.isPlaying() && store.action !== 'idle') {
      stateMachine.feedEvent({ type: 'change' })
    }
  })

  // --- Refresh settings panel when selection changes externally ---
  selectionStore.subscribe(() => {
    refreshSettingsPanel()
  })

  // --- Persistent game loop (click-to-follow + gesture detection) ---
  let lastFrameTime = performance.now()
  function gameLoop(now: DOMHighResTimeStamp): void {
    const dt = now - lastFrameTime
    lastFrameTime = now
    movement.tick(dt)
    gestureDetector.tick(now)
    walk.tick(dt)
    requestAnimationFrame(gameLoop)
  }

  // --- Start everything ---
  await playAction('idle')
  requestAnimationFrame(gameLoop)

  // --- Cleanup ---
  window.addEventListener('beforeunload', () => {
    animController.destroy()
    if (settingsPanel) settingsPanel.destroy()
    ctxMenu.destroy()
    gestureDetector.destroy()
    interaction.destroy()
    drag.destroy()
    walk.destroy()
    pointer.destroy()
  })
}

document.addEventListener('DOMContentLoaded', () => {
  main().catch(err => console.error('PixelPet main error:', err))
})
