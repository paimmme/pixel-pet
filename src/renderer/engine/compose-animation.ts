import type { ComposeConfig, AnimalDef, ActionDef, PoseTemplate, PoseFrame, PaletteMap, ComposedLayer } from './types'
import { createComposeCacheKey } from './types'
import { getAnimal, getAction, ACCESSORIES } from '../assets/catalog'
import { SpriteCompositor } from './sprite-compositor'
import { AssetLoader } from '../assets/asset-loader'
import { PaletteSwapper } from './palette-swapper'
import { AssetCache } from '../assets/asset-cache'

export interface ComposeResult {
  frames: ImageBitmap[]
  cacheKey: string
  fromCache: boolean
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

  const animal = getAnimal(config.animal)
  if (!animal) throw new Error(`Animal not found: ${config.animal}`)

  const action = getAction(config.action)
  if (!action) throw new Error(`Action not found: ${config.action}`)

  const poseTemplate = await loader.loadPoseTemplate(action.id, config.resolution)
  const poseFrames = selectPoseFrames(poseTemplate, config.direction)

  assertPoseFrames(action, poseFrames)

  const parts = await loader.loadAnimalParts(animal.id, config.resolution, animal.layers)

  const overrideCache = await loader.loadOverridesForPose(
    animal.id,
    action.id,
    config.resolution,
    poseFrames
  )

  const paletteDef = await loader.loadPalette(config.palette ?? animal.defaultPalette, animal.id)
  const paletteMap = PaletteSwapper.compile(paletteDef)

  const frames: ImageBitmap[] = []

  for (let frameIndex = 0; frameIndex < poseFrames.length; frameIndex++) {
    const pose = poseFrames[frameIndex]

    const layers: ComposedLayer[] = animal.layers.map((layerDef) => {
      const transform = pose.parts[layerDef.id] ?? {}
      const overrideBitmap = resolveOverrideBitmap(overrideCache, action.id, transform.override)

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
