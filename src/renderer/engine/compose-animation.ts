import type { ComposeConfig, AnimalDef, ActionDef, PoseTemplate, PoseFrame, PaletteMap, ComposedLayer, LayerDef, InteractionZone } from './types'
import { createComposeCacheKey } from './types'
import { getAnimal, getAction, registerActionPack, ACCESSORIES } from '../assets/catalog'
import { SpriteCompositor } from './sprite-compositor'
import { AssetLoader } from '../assets/asset-loader'
import { PaletteSwapper } from './palette-swapper'
import { AssetCache } from '../assets/asset-cache'

export interface ComposeResult {
  frames: ImageBitmap[]
  cacheKey: string
  fromCache: boolean
}

/** Fetch an action pack manifest and pose data, create a synthetic ActionDef, and return both. */
async function resolveActionPack(
  packActionId: string,
  resolution: number
): Promise<{ def: ActionDef; poseTemplate: PoseTemplate } | undefined> {
  const api = (window as any).electronAPI
  if (!api?.getActionPackManifest) return undefined
  try {
    const manifest = await api.getActionPackManifest(packActionId)
    if (!manifest) return undefined

    // Read pose file from pack
    const poseBytes: Uint8Array | null = await api.readPackAsset(packActionId, `poses/${resolution}.json`)
    if (!poseBytes) return undefined

    const poseText = new TextDecoder().decode(poseBytes)
    const poseTemplate: PoseTemplate = JSON.parse(poseText)

    const def: ActionDef = {
      id: manifest.id,
      name: manifest.name,
      frameCount: manifest.frameCount,
      fps: manifest.fps,
      loop: manifest.loop,
      directions: manifest.directions,
      poseTemplate: `pack:${manifest.id}`,
      staminaCost: 0,
      category: manifest.category as ActionDef['category'],
      phases: manifest.phases,
    }

    // Register in dynamic catalog
    registerActionPack(manifest.id, def)

    return { def, poseTemplate }
  } catch {
    return undefined
  }
}

/** Resolve an AnimalDef from factory catalog or pack manifest via IPC. */
async function resolveAnimalDef(animalId: string, packId?: string): Promise<AnimalDef | undefined> {
  // Factory lookup first
  const factory = getAnimal(animalId)
  if (factory) return factory

  // Pack manifest fallback
  if (packId && typeof (window as any).electronAPI?.getCharacterPackManifest === 'function') {
    try {
      const api = (window as any).electronAPI
      const manifest = await api.getCharacterPackManifest(packId)
      if (manifest) {
        return {
          id: manifest.id,
          name: manifest.name,
          resolutions: manifest.resolutions,
          layers: manifest.layers.map((l: any): LayerDef => ({
            id: l.id,
            name: l.name,
            zIndex: l.zIndex,
            anchor: l.anchor,
            zone: (l.zone as InteractionZone) ?? 'body',
            optional: l.optional,
          })),
          defaultPalette: manifest.defaultPalette,
          hitArea: manifest.hitArea,
          zones: manifest.zones ?? [],
        }
      }
    } catch {
      // IPC not available or manifest not found
    }
  }
  return undefined
}

export async function composeAnimation(
  loader: AssetLoader,
  compositor: SpriteCompositor,
  config: ComposeConfig
): Promise<ComposeResult> {
  const cache = loader.getFrameCache()

  // Check cache first
  const cached = cache.get(config)
  if (cached) {
    return { frames: cached, cacheKey: createComposeCacheKey(config), fromCache: true }
  }

  const animal = await resolveAnimalDef(config.animal, config.packId)
  if (!animal) throw new Error(`Animal not found: ${config.animal}`)

  // Resolve action — check catalog first, then action pack
  let action = getAction(config.action)
  let packPoseTemplate: PoseTemplate | undefined

  if (!action && config.packActionId) {
    const resolved = await resolveActionPack(config.packActionId, config.resolution)
    if (resolved) {
      action = resolved.def
      packPoseTemplate = resolved.poseTemplate
    }
  }
  if (!action) throw new Error(`Action not found: ${config.action}`)

  let poseTemplate: PoseTemplate
  if (packPoseTemplate) {
    poseTemplate = packPoseTemplate
  } else {
    poseTemplate = await loader.loadPoseTemplate(action.id, config.resolution, config.packId ?? animal.id)
  }
  const poseFrames = selectPoseFrames(poseTemplate, config.direction)

  assertPoseFrames(action, poseFrames)

  const parts = await loader.loadAnimalParts(animal.id, config.resolution, animal.layers, config.packId)

  const overrideCache = await loader.loadOverridesForPose(
    animal.id,
    action.id,
    config.resolution,
    poseFrames,
    config.packId
  )

  const paletteDef = await loader.loadPalette(config.palette ?? animal.defaultPalette, config.packId ?? animal.id)
  const paletteMap = PaletteSwapper.compile(paletteDef)

  const frames: ImageBitmap[] = []

  for (let frameIndex = 0; frameIndex < poseFrames.length; frameIndex++) {
    const pose = poseFrames[frameIndex]

    const layers: ComposedLayer[] = animal.layers.map((layerDef) => {
      const transform = pose.parts[layerDef.id] ?? {}
      let overrideBitmap = resolveOverrideBitmap(overrideCache, action.id, transform.override)

      // Expression overrides take priority over action overrides for eyes/mouth
      if ((layerDef.id === 'eyes' || layerDef.id === 'mouth') && config.expression) {
        const exprVariant = layerDef.id === 'eyes'
          ? config.expression.eyes
          : config.expression.mouth
        if (exprVariant) {
          const exprBitmap = parts.get(`expr_${layerDef.id}_${exprVariant}`)
          if (exprBitmap) overrideBitmap = exprBitmap
        }
      }

      return {
        id: layerDef.id,
        bitmap: overrideBitmap ?? parts.get(layerDef.id)!,
        anchor: layerDef.anchor,
        zIndex: transform.zIndex ?? layerDef.zIndex,
        dx: transform.dx ?? 0,
        dy: transform.dy ?? 0,
        rotation: transform.rotation ?? 0,
        visible: transform.visible ?? true
      }
    })

    // Append accessory layers
    if (config.accessories) {
      for (const accId of config.accessories) {
        const accInfo = ACCESSORIES.find(a => a.id === accId)
        if (!accInfo) continue
        const accBitmap = await loader.loadAccessory(accId, config.resolution)
        if (accBitmap) {
          layers.push({
            id: `accessory_${accId}`,
            bitmap: accBitmap,
            anchor: { x: 0, y: 0 },
            zIndex: accInfo.zIndex,
            dx: 0, dy: 0, rotation: 0, visible: true
          })
        }
      }
    }

    const frame = await compositor.compose(layers, paletteMap)
    frames.push(frame)
  }

  // Cache the composed frames
  cache.set(config, frames)

  return { frames, cacheKey: createComposeCacheKey(config), fromCache: false }
}

function selectPoseFrames(
  poseTemplate: PoseTemplate,
  direction?: string
): PoseFrame[] {
  if (direction && poseTemplate.directions) {
    const dirFrames = poseTemplate.directions[direction as keyof typeof poseTemplate.directions]
    if (dirFrames) return dirFrames
  }
  return poseTemplate.frames ?? []
}

function assertPoseFrames(action: ActionDef, frames: PoseFrame[]): void {
  if (frames.length === 0) {
    throw new Error(`No pose frames found for action: ${action.id}`)
  }
}

function resolveOverrideBitmap(
  overrideCache: Map<string, Map<number, ImageBitmap>>,
  actionId: string,
  overrideRef?: { layer: string; frame: number }
): ImageBitmap | undefined {
  if (!overrideRef) return undefined

  const key = `${actionId}_${overrideRef.layer}`
  const sheet = overrideCache.get(key)
  if (sheet) {
    return sheet.get(overrideRef.frame)
  }
  return undefined
}
