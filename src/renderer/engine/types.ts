export type PixelResolution = 16 | 32

export type Direction = 'down' | 'left' | 'right' | 'up'

export interface Point {
  x: number
  y: number
}

/** Zone type for interaction-aware hit testing */
export type InteractionZone = 'body' | 'head' | 'belly' | 'tail' | 'none'

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface LayerDef {
  id: string
  name: string
  zIndex: number
  anchor: Point
  zone: InteractionZone
  optional?: boolean
}

export interface ZoneDef {
  id: InteractionZone
  /** Anchor point for zone center */
  anchor: Point
  /** Radius for hit-test approach */
  radius: number
}

export interface AnimalDef {
  id: string
  name: string
  resolutions: PixelResolution[]
  layers: LayerDef[]
  defaultPalette: string
  hitArea: Rect
  zones?: ZoneDef[]
}

/** Phase type within an action */
export type ActionPhaseType = 'prepare' | 'execute' | 'hold' | 'recover'

/** Metadata for one phase of an action */
export interface ActionPhase {
  name: string
  phaseType: ActionPhaseType
  startFrame: number
  endFrame: number
  staminaCostPerTick: number
  gracePotential: number
}

export interface ActionDef {
  id: string
  name: string
  frameCount: number
  fps: number
  loop: boolean
  directions: Direction[] | null
  poseTemplate: string
  /** Optional action phases for skill-based depth */
  phases?: ActionPhase[]
  /** Base stamina cost to perform once (0-100) */
  staminaCost?: number
  /** Skill category for grouping related actions */
  category?: string
}

export interface OverrideRef {
  layer: string
  frame: number
}

export interface PartTransform {
  dx?: number
  dy?: number
  rotation?: number
  visible?: boolean
  zIndex?: number
  override?: OverrideRef
}

export interface PoseFrame {
  index: number
  parts: Record<string, PartTransform>
}

export interface PoseTemplate {
  action: string
  resolution: PixelResolution
  frames?: PoseFrame[]
  directions?: Partial<Record<Direction, PoseFrame[]>>
}

export type RGB = [number, number, number]

export type PaletteMap = Map<string, RGB>

export interface PaletteMapping {
  from: RGB
  to: RGB
}

export interface PaletteDef {
  id: string
  name: string
  mappings: PaletteMapping[]
}

export interface ComposeConfig {
  animal: string
  action: string
  resolution: PixelResolution
  palette?: string
  direction?: Direction
  accessories?: string[]
}

export interface ComposedLayer {
  id: string
  bitmap: ImageBitmap
  anchor: Point
  zIndex: number
  dx: number
  dy: number
  rotation: number
  visible: boolean
}

export enum PetState {
  Idle = 'idle',
  Acting = 'acting',
  Reacting = 'reacting',
  Dragging = 'dragging'
}

export function createComposeCacheKey(config: ComposeConfig): string {
  return [
    config.animal,
    config.action,
    config.resolution,
    config.palette ?? 'default',
    config.direction ?? 'none'
  ].join(':')
}
