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
import { createExpressionController } from './state/expression-controller'
import { createActivityController } from './state/activity-controller'
import { getAction, ANIMALS, getAnimal, getPalettesForAnimal, ACCESSORIES } from './assets/catalog'
import type { ElectronAPI } from '../shared/ipc-types'
import type { ComposeConfig } from './engine/types'
import { createSettingsPanel } from './ui/settings-panel'
import { createWalkController } from './state/walk-controller'
import { SkillSystem } from './state/skill-system'
import { ChoreographyController, CHOREOGRAPHY_PRESETS } from './state/choreography'

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

  // --- Expression controller ---
  const expression = createExpressionController()

  // --- Activity controller ---
  const activity = createActivityController({ expression })

  // --- Phase 7: Skill + Choreography ---
  const skills = new SkillSystem()
  const choreo = new ChoreographyController()

  // Wire tray action menu → pending buffer
  api.onAction((actionId: string) => {
    if (actionId === 'idle' && stateMachine.state === PetState.Idle) return
    triggerAction(actionId)
  })

  // Restore saved state on startup
  api.onRestoreState((savedState) => {
    if (savedState.selection) {
      selectionStore.fromSavedState({
        animal: savedState.selection.animal,
        action: savedState.selection.action,
        resolution: savedState.selection.resolution,
        palette: savedState.selection.palette,
        accessories: savedState.selection.accessories
      })
      // Trigger the restored action
      triggerAction(savedState.selection.action)
    }
    // Restore auto-launch state
    if (savedState.settings?.autoLaunch !== undefined) {
      autoLaunchEnabled = savedState.settings.autoLaunch
    }
    // Restore skill data
    if (savedState.skillData) {
      skills.restore(savedState.skillData)
    }
  })

  // Wire up activity detection
  const stopActivity = api.onActivityChanged((info) => {
    activity.updateActivity(info)
  })

  // --- Phase 2 interaction ---
  const interaction = createInteractionController(canvas, stateMachine)
  const gestureDetector = createGestureDetector({
    canvas,
    stateMachine,
    cooldown: 600,
    threshold: 3,
    window: 400,
    onProgress: (progress) => {
      // Gesture progress visual feedback (0.0 → 1.0)
      // The progress indicator is drawn separately — this hook
      // allows future haptic or audio feedback
    }
  })

  // Context menu actions
  const ctxMenu = createContextMenu(canvas, {
    actions: [
      { actionId: 'idle', label: 'Idle 🐾' },
      { actionId: 'jump', label: 'Jump' },
      { actionId: 'wave', label: 'Wave' },
      // Ballet actions
      { actionId: 'plié', label: 'Plie' },
      { actionId: 'relevé', label: 'Releve' },
      { actionId: 'pirouette', label: 'Pirouette' },
      { actionId: 'arabesque', label: 'Arabesque' },
      { actionId: 'bow', label: 'Bow' },
      // Choreography presets
      ...CHOREOGRAPHY_PRESETS.map(p => ({
        actionId: `preset:${p.id}`,
        label: `🎭 ${p.name}`
      })),
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
      // Handle preset triggers
      if (actionId.startsWith('preset:')) {
        const presetId = actionId.slice(7)
        choreo.playPreset(presetId, (id) => triggerAction(id))
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
    onDragStart: () => {
      pointer.onDragStart()
      stateMachine.feedEvent({ type: 'drag-start' })
    },
    onDragEnd: () => {
      pointer.onDragEnd()
      stateMachine.feedEvent({ type: 'drag-end' })
    }
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
  let playRequestId = 0
  let autoLaunchEnabled = false

  function triggerAction(actionId: string): void {
    if (drag.isDragging) return
    pendingAction = actionId
    stateMachine.feedEvent({ type: 'action' })
  }

  // --- Compose and play an action ---
  async function playAction(actionId: string): Promise<void> {
    const requestId = ++playRequestId
    const config: ComposeConfig = {
      animal: selectionStore.animal,
      action: actionId,
      resolution: selectionStore.resolution,
      palette: selectionStore.palette,
      direction: selectionStore.direction,
      accessories: selectionStore.accessories.length > 0 ? selectionStore.accessories : undefined,
      expression: {
        eyes: expression.current.eyes !== 'neutral' ? expression.current.eyes : undefined,
        mouth: expression.current.mouth !== 'neutral' ? expression.current.mouth : undefined
      }
    }

    const actionDef = getAction(actionId)
    if (!actionDef) {
      console.error(`Unknown action: ${actionId}`)
      return
    }

    try {
      const result = await composeAnimation(loader, compositor, config)
      // Only apply if this is still the latest request
      if (requestId !== playRequestId) return
      animController.setFrames(result.frames, actionDef.fps, actionDef.loop)
      animController.start()

      // Record practice for skill-building actions
      if (actionDef.phases && actionDef.phases.length > 0) {
        const gracePotential = actionDef.phases.reduce((sum, p) => sum + p.gracePotential, 0)
        skills.recordPractice(actionId, gracePotential)
      }
    } catch (err) {
      if (requestId === playRequestId) {
        console.error('Failed to compose animation:', err)
      }
    }
  }

  // --- Notice (blink) overlay ---
  let noticeTimer = 0
  const NOTICE_DURATION = 400

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
        expression.triggerSurprised()
      } else {
        // Single click: show notice (blink) overlay
        noticeTimer = NOTICE_DURATION
        // Subtle happy expression on click
        expression.triggerHappy()
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
        expression.triggerHappy()
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
        // If choreography is active, continue the sequence
        if (choreo.isPlaying) {
          choreo.onAnimationComplete((actionId) => triggerAction(actionId))
        } else if (pendingAction) {
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
      selection: {
        animal: store.animal,
        action: store.action,
        resolution: store.resolution,
        palette: store.palette,
        accessories: store.accessories.length > 0 ? store.accessories : undefined
      },
      skillData: skills.snapshot()
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
    expression.tick(dt)  // micro-expression timing (blinks, emotion decay)
    activity.tick(dt)
    skills.restTick(dt)
    gestureDetector.tick(now)

    // Notice overlay — draw exclamation mark while timer active
    if (noticeTimer > 0) {
      noticeTimer -= dt
      display.drawNotice()
    }

    walk.tick(dt)
    requestAnimationFrame(gameLoop)
  }

  // --- Start everything ---
  await playAction('idle')
  requestAnimationFrame(gameLoop)

  // --- Cleanup ---
  window.addEventListener('beforeunload', () => {
    api.saveState({ skillData: skills.snapshot() })
    animController.destroy()
    stopActivity()
    activity.destroy()
    expression.destroy()
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
