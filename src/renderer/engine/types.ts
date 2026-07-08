export type PixelResolution = 16 | 32

export type Direction = 'down' | 'left' | 'right' | 'up'

export interface Point {
  x: number
  y: number
}

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
  optional?: boolean
}

export interface AnimalDef {
  id: string
  name: string
  resolutions: PixelResolution[]
  layers: LayerDef[]
  defaultPalette: string
  hitArea: Rect
}

export interface ActionDef {
  id: string
  name: string
  frameCount: number
  fps: number
  loop: boolean
  directions: Direction[] | null
  poseTemplate: string
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
