import type { PixelResolution, Direction, InteractionZone, Point, Rect, LayerDef, ZoneDef, ActionPhaseType, ActionPhase } from '../../shared/app-types'

// Re-export for convenience so consumers use a single import path
export type { PixelResolution, Direction, InteractionZone, Point, Rect, LayerDef, ZoneDef, ActionPhaseType, ActionPhase }

export interface AnimalDef {
  id: string
  name: string
  resolutions: PixelResolution[]
  layers: LayerDef[]
  defaultPalette: string
  hitArea: Rect
  zones?: ZoneDef[]
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

export type ExpressionVariant = 'neutral' | 'blink0' | 'blink1' | 'happy' | 'surprised' | 'sleepy' | 'smile' | 'open' | 'pout'

export interface ExpressionState {
  eyes: 'neutral' | 'blink0' | 'blink1' | 'happy' | 'surprised' | 'sleepy'
  mouth: 'neutral' | 'smile' | 'open' | 'happy' | 'pout'
}

export interface ComposeConfig {
  animal: string
  action: string
  resolution: PixelResolution
  palette?: string
  direction?: Direction
  accessories?: string[]
  expression?: { eyes?: string; mouth?: string }
  packId?: string
  /** Set when the action comes from an action pack (AI-generated or imported) */
  packActionId?: string
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
  const accessories = config.accessories?.length
    ? [...config.accessories].sort().join(',')
    : 'none'
  const expression = config.expression
    ? `${config.expression.eyes ?? 'neutral'},${config.expression.mouth ?? 'neutral'}`
    : 'neutral,neutral'

  return [
    config.animal,
    config.action,
    config.resolution,
    config.palette ?? 'default',
    config.direction ?? 'none',
    config.packId ?? 'factory',
    config.packActionId ?? 'none',
    accessories,
    expression
  ].join(':')
}
