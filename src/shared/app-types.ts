export type PixelResolution = 16 | 32

export type RGB = [number, number, number]

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

/** Cardinal direction for directional poses */
export type Direction = 'down' | 'left' | 'right' | 'up'

/** Zone type for interaction-aware hit testing */
export type InteractionZone = 'body' | 'head' | 'belly' | 'tail' | 'none'

/** Layer definition — one drawable part of a character */
export interface LayerDef {
  id: string
  name: string
  zIndex: number
  anchor: Point
  zone: InteractionZone
  optional?: boolean
}

/** Hit-test zone centered at anchor with radius */
export interface ZoneDef {
  id: InteractionZone
  anchor: Point
  radius: number
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

export interface Selection {
  animal: string
  action: string
  resolution: PixelResolution
  palette: string
  accessories?: string[]
  /** Pack ID when the source is a file-backed pack, undefined for factory */
  packId?: string
}

export interface SkillData {
  dailyPracticeRecord: Record<string, number>
  lastPracticeDate: string
  skillLevels: Record<string, number>
  fatigue: number
}

export interface SavedState {
  window: {
    x: number
    y: number
  }
  selection?: Selection
  settings?: {
    autoLaunch?: boolean
  }
  skillData?: SkillData
}
