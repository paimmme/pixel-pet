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
import { PackAssetSource } from './assets/pack-asset-source'
import { composeAnimation } from './engine/compose-animation'
import { SelectionStore } from './state/selection-store'
import { PetStateMachine, PetState } from './state/pet-state-machine'
import { createExpressionController } from './state/expression-controller'
import { createActivityController } from './state/activity-controller'
import { getAction, ANIMALS, getAnimal, getPalettesForAnimal, ACCESSORIES, mergeAnimals, registerActionPack, customActions, type PackCharacterInfo } from './assets/catalog'
import { createPackEditor, type PackEditor } from './ui/pack-editor'
import type { ElectronAPI } from '../shared/ipc-types'
import type { ComposeConfig } from './engine/types'
import { createSettingsPanel } from './ui/settings-panel'
import { createWalkController } from './state/walk-controller'
import { SkillSystem } from './state/skill-system'
import { ChoreographyController, CHOREOGRAPHY_PRESETS } from './state/choreography'
import { createBehaviorScheduler } from './state/behavior-scheduler'

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
  const packSource = new PackAssetSource(api)
  const loader = new AssetLoader(packSource)
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

  // --- Phase 5: Behavior scheduler ---
  const behavior = createBehaviorScheduler({
    activity,
    skills,
    triggerAction: (actionId) => {
      // Scheduler calls triggerAction directly — drag guard is in main triggerAction
      pendingAction = actionId
      stateMachine.feedEvent({ type: 'action' })
    }
  })

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
        accessories: savedState.selection.accessories,
        packId: savedState.selection.packId,
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
  const stopActivity = api.onActivityChanged((info: any) => {
    const prev = activity.currentActivity
    activity.updateActivity(info)
    behavior.onActivityChanged(prev as any, info.type as any)
  })

  let equippedActionIds = new Set<string>()
  let actionPacksList: Array<{ id: string; name: string; frameCount: number; category: string; equipped: boolean }> = []

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

  let packChars: PackCharacterInfo[] = []
  let importErrors: Array<{ field: string; message: string }> = []
  let editorPanel: PackEditor | null = null
  let generationStatus = ''
  let generationProgress = 0
  let generationResult: { packId: string; packName: string } | undefined
  let generationError = ''
  let actionGenStatus = ''
  let actionGenProgress = 0
  let actionGenResult: { packId: string; packName: string } | undefined
  let actionGenError = ''

          // Fetch pack data async after panel creation
          api.listCharacterPacks().then(list => {
            packChars = list.map(p => ({
              id: p.id, name: p.name, resolutions: p.resolutions,
              defaultPalette: p.defaultPalette, layerCount: p.layerCount,
              qualityScore: p.qualityScore,
            }))
            const updatedMerged = mergeAnimals(ANIMALS, packChars)
            if (settingsPanel) {
              settingsPanel.update({
                animals: updatedMerged,
                importedCharacters: packChars.map(p => ({ id: p.id, name: p.name, layerCount: p.layerCount, qualityScore: p.qualityScore })),
              })
            }
          }).catch(() => {})

          // Fetch action packs
          api.listActionPacks().then(list => {
            actionPacksList = list.map(p => ({
              id: p.id, name: p.name, frameCount: p.frameCount, category: p.category ?? 'custom',
              equipped: equippedActionIds.has(p.id),
            }))
            if (settingsPanel) {
              settingsPanel.update({ actionPacks: actionPacksList })
            }
          }).catch(() => {})

          settingsPanel = createSettingsPanel({
            animals: ANIMALS.map(a => ({ id: a.id, name: a.name })),
            importedCharacters: [],
            palettes: availablePalettes,
            accessories: ACCESSORIES.map(a => ({ id: a.id, name: a.name })),
            currentAnimal: selectionStore.animal,
            currentPalette: selectionStore.palette,
            currentAccessories: selectionStore.accessories,
            currentResolution: selectionStore.resolution,
            autoLaunch: autoLaunchEnabled,
            onImportPack: () => {
              return api.openPackDialog()
                .then(dialogResult => {
                  if (!dialogResult) return
                  return api.importPack(dialogResult.path)
                })
                .then(result => {
                  if (!result) return
                  if (result.success && result.packId) {
                    return api.listCharacterPacks().then(updateList => {
                      const updatedChars = updateList.map(p => ({
                        id: p.id, name: p.name, resolutions: p.resolutions,
                        defaultPalette: p.defaultPalette, layerCount: p.layerCount,
                        qualityScore: p.qualityScore,
                      }))
                      packChars = updatedChars
                      importErrors = []
                      const updatedMerged = mergeAnimals(ANIMALS, updatedChars)
                      settingsPanel!.update({
                        animals: updatedMerged,
                        importedCharacters: updatedChars.map(p => ({ id: p.id, name: p.name, layerCount: p.layerCount, qualityScore: p.qualityScore })),
                        importErrors: undefined,
                      })
                    })
                  } else {
                    importErrors = (result.errors ?? []).map(e => ({ field: e.field, message: e.message }))
                    settingsPanel!.update({
                      importErrors: importErrors.length > 0 ? importErrors : [{ field: 'import', message: 'Import failed' }],
                    })
                  }
                })
            },
            generationStatus,
            generationProgress,
            generationResult,
            generationError,
            actionGenerationStatus: actionGenStatus,
            actionGenerationProgress: actionGenProgress,
            actionGenerationResult: actionGenResult,
            actionGenerationError: actionGenError,
            onGenerateCharacter: () => {
              return api.openImageDialog()
                .then(imageResult => {
                  if (!imageResult) return
                  generationStatus = 'running'
                  generationProgress = 0
                  generationError = ''
                  generationResult = undefined
                  settingsPanel!.update({
                    generationStatus,
                    generationProgress,
                    generationResult: undefined,
                    generationError: undefined,
                  })

                  return api.createGenerationJob({
                    imageData: imageResult.data,
                    imageMimeType: imageResult.mimeType,
                    resolution: 32,
                  }).then(jobId => {
                    return api.startGeneration(jobId).then(() => {
                      // Poll for completion
                      return new Promise<void>((resolve, reject) => {
                        const poll = () => {
                          api.getGenerationJob(jobId).then(job => {
                            if (!job) { reject(new Error('Job not found')); return }
                            generationProgress = job.progress
                            generationStatus = job.status
                            settingsPanel!.update({ generationProgress, generationStatus })

                            if (job.status === 'completed') {
                              // Save the generated pack
                              api.saveGeneratedPack(jobId).then(saveResult => {
                                if (saveResult.success && saveResult.packId) {
                                  generationResult = { packId: saveResult.packId, packName: job.result?.packName ?? 'Generated Character' }
                                  generationStatus = 'completed'
                                  // Refresh pack list
                                  api.listCharacterPacks().then(updateList => {
                                    const updatedChars = updateList.map(p => ({
                                      id: p.id, name: p.name, resolutions: p.resolutions,
                                      defaultPalette: p.defaultPalette, layerCount: p.layerCount,
                                      qualityScore: p.qualityScore,
                                    }))
                                    packChars = updatedChars
                                    const updatedMerged = mergeAnimals(ANIMALS, updatedChars)
                                    settingsPanel!.update({
                                      animals: updatedMerged,
                                      importedCharacters: updatedChars.map(p => ({ id: p.id, name: p.name, layerCount: p.layerCount, qualityScore: p.qualityScore })),
                                      generationResult,
                                      generationStatus,
                                      generationProgress: 100,
                                    })
                                  })
                                } else {
                                  generationError = saveResult.errors?.map(e => e.message).join('; ') ?? 'Save failed'
                                  settingsPanel!.update({ generationError, generationStatus: 'failed' })
                                }
                                resolve()
                              })
                            } else if (job.status === 'failed') {
                              generationError = job.error ?? 'Generation failed'
                              generationStatus = 'failed'
                              settingsPanel!.update({ generationError, generationStatus: 'failed' })
                              resolve()
                            } else {
                              // Still running — poll again
                              setTimeout(poll, 500)
                            }
                          }).catch(reject)
                        }
                        poll()
                      })
                    })
                  })
                })
            },
            // ── Action generation handler ──
            onGenerateAction: (prompt: string) => {
              actionGenStatus = 'running'
              actionGenProgress = 0
              actionGenError = ''
              actionGenResult = undefined
              settingsPanel!.update({
                actionGenerationStatus: actionGenStatus,
                actionGenerationProgress: actionGenProgress,
                actionGenerationResult: undefined,
                actionGenerationError: undefined,
              })

              // Build action input with current character as reference
              const actionInput = {
                prompt,
                characterId: selectionStore.animal,
                characterPackId: selectionStore.packId,
                resolution: selectionStore.resolution,
              }

              return api.createActionJob(actionInput)
                .then(jobId => {
                  return api.startGeneration(jobId).then(() => {
                    return new Promise<void>((resolve, reject) => {
                      const poll = () => {
                        api.getGenerationJob(jobId).then(job => {
                          if (!job) { reject(new Error('Job not found')); return }
                          actionGenProgress = job.progress
                          actionGenStatus = job.status
                          settingsPanel!.update({ actionGenerationProgress: actionGenProgress, actionGenerationStatus: actionGenStatus })

                          if (job.status === 'completed') {
                            // Save the generated action pack
                            api.saveGeneratedPack(jobId).then(saveResult => {
                              if (saveResult.success && saveResult.packId) {
                                actionGenResult = { packId: saveResult.packId, packName: job.result?.packName ?? prompt }
                                actionGenStatus = 'completed'
                                // Register the action in the dynamic catalog
                                api.getActionPackManifest(saveResult.packId).then(manifest => {
                                  if (manifest) {
                                    registerActionPack(manifest.id, {
                                      id: manifest.id,
                                      name: manifest.name,
                                      frameCount: manifest.frameCount,
                                      fps: manifest.fps,
                                      loop: manifest.loop,
                                      directions: manifest.directions,
                                      poseTemplate: `pack:${manifest.id}`,
                                      staminaCost: 0,
                                      category: (manifest.category as any) ?? 'custom',
                                      phases: manifest.phases,
                                    })
                                  }
                                })
                                settingsPanel!.update({
                                  actionGenerationResult: actionGenResult,
                                  actionGenerationStatus: actionGenStatus,
                                  actionGenerationProgress: 100,
                                })
                                // Refresh action pack list in settings
                                api.listActionPacks().then(list => {
                                  actionPacksList = list.map(p => ({
                                    id: p.id, name: p.name, frameCount: p.frameCount, category: p.category ?? 'custom',
                                    equipped: equippedActionIds.has(p.id),
                                  }))
                                  if (settingsPanel) {
                                    settingsPanel.update({ actionPacks: actionPacksList })
                                  }
                                }).catch(() => {})
                              } else {
                                actionGenError = saveResult.errors?.map(e => e.message).join('; ') ?? 'Save failed'
                                settingsPanel!.update({ actionGenerationError: actionGenError, actionGenerationStatus: 'failed' })
                              }
                              resolve()
                            })
                          } else if (job.status === 'failed') {
                            actionGenError = job.error ?? 'Generation failed'
                            actionGenStatus = 'failed'
                            settingsPanel!.update({ actionGenerationError: actionGenError, actionGenerationStatus: 'failed' })
                            resolve()
                          } else {
                            setTimeout(poll, 500)
                          }
                        }).catch(reject)
                      }
                      poll()
                    })
                  })
                })
                .catch(err => {
                  actionGenError = err instanceof Error ? err.message : String(err)
                  actionGenStatus = 'failed'
                  settingsPanel!.update({ actionGenerationError: actionGenError, actionGenerationStatus: 'failed' })
                })
            },
            onRemovePack: (packId: string) => {
              api.removePack(packId).then(() => {
                packChars = packChars.filter(p => p.id !== packId)
                const updatedMerged = mergeAnimals(ANIMALS, packChars)
                settingsPanel!.update({
                  animals: updatedMerged,
                  importedCharacters: packChars.map(p => ({ id: p.id, name: p.name, layerCount: p.layerCount, qualityScore: p.qualityScore })),
                })
              })
            },
            onEditPack: (packId: string) => {
              const editor = createPackEditor({
                packId,
                onClose: () => { editorPanel = null },
            onSave: () => {
              loader.clearCache()
              // Re-trigger animation to pick up fresh assets
              stateMachine.feedEvent({ type: 'change' })
            },
              })
              editorPanel = editor
              document.body.appendChild(editor.element)
            },
            onOpenPacksDir: () => api.openPacksDir(),
            onAnimalChange: (animalId, packId) => {
              selectionStore.setAnimal(animalId, { packId })
              // Auto-select default palette for new animal
              if (!packId) {
                const newAnimal = getAnimal(animalId)
                if (newAnimal) {
                  selectionStore.setPalette(newAnimal.defaultPalette)
                }
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
            },
            actionPacks: actionPacksList,
            onToggleActionEquip: (packId, equipped) => {
              if (equipped) {
                equippedActionIds.add(packId)
              } else {
                equippedActionIds.delete(packId)
              }
              actionPacksList = actionPacksList.map(p => ({
                ...p, equipped: equippedActionIds.has(p.id),
              }))
              settingsPanel?.update({ actionPacks: actionPacksList })
            },
            onPreviewAction: (packId) => {
              registerActionPack(packId, {
                id: packId, name: actionPacksList.find(p => p.id === packId)?.name ?? packId,
                frameCount: actionPacksList.find(p => p.id === packId)?.frameCount ?? 1,
                fps: 8, loop: false, directions: [0, 1, 2, 3] as any,
                poseTemplate: `pack:${packId}`,
                staminaCost: 0, category: 'custom', phases: [],
              })
              triggerAction(packId)
            },
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
      // Handle custom action pack actions
      if (actionId.startsWith('pack-action:')) {
        const packRef = actionId.slice(12)
        // packRef is the pack ID — we'll compose using the action name from manifest
        triggerAction(packRef)
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

  // Wire context menu trigger — fetch equipped action packs
  interaction.onContextMenu = async (x: number, y: number) => {
    let customActions: Array<{ actionId: string; label: string }> = []
    try {
      const actionPacks = await api.listActionPacks()
      if (actionPacks.length > 0) {
        customActions = actionPacks
          .filter(p => equippedActionIds.has(p.id))
          .map(p => ({
            actionId: `pack-action:${p.id}`,
            label: `🎬 ${p.name}`,
          }))
      }
    } catch (_) { /* ignore fetch errors */ }
    ctxMenu.show(x, y, customActions)
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
    behavior.onActionStarted()
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
    behavior.onActionStarted()
    stateMachine.feedEvent({ type: 'action' })
  }

  // --- Compose and play an action ---
  async function playAction(actionId: string): Promise<void> {
    const requestId = ++playRequestId

    let actionDef = getAction(actionId)
    // Lazy-load: if not found in catalog, try fetching from action pack via IPC
    if (!actionDef) {
      try {
        const manifest = await api.getActionPackManifest(actionId)
        if (manifest) {
          registerActionPack(manifest.id, {
            id: manifest.id,
            name: manifest.name,
            frameCount: manifest.frameCount,
            fps: manifest.fps,
            loop: manifest.loop,
            directions: manifest.directions,
            poseTemplate: `pack:${manifest.id}`,
            staminaCost: 0,
            category: (manifest.category as any) ?? 'custom',
            phases: manifest.phases,
          })
          actionDef = getAction(actionId)
        }
      } catch { /* ignore IPC errors */ }
    }
    if (!actionDef) {
      console.error(`Unknown action: ${actionId}`)
      return
    }

    const isCustomAction = customActions.has(actionDef.id)
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
      },
      packId: selectionStore.packId,
      packActionId: isCustomAction ? actionId : undefined,
    }

    try {
      const result = await composeAnimation(loader, compositor, config)
      // Only apply if this is still the latest request
      if (requestId !== playRequestId) return
      lastPlayedActionId = actionId
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
        // Reset state machine to Idle so the pet doesn't get stuck in Acting
        stateMachine.feedEvent({ type: 'animation-complete' })
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

  // --- Handle animation complete → notify state machine + scheduler ---
  let lastPlayedActionId = 'idle'
  animController.onComplete(() => {
    stateMachine.feedEvent({ type: 'animation-complete' })
    behavior.onActionCompleted(lastPlayedActionId)
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
        accessories: store.accessories.length > 0 ? store.accessories : undefined,
        packId: store.packId,
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
    behavior.tick(dt)
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
    behavior.destroy()
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
