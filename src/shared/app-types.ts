export type PixelResolution = 16 | 32

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

export interface Selection {
  animal: string
  action: string
  resolution: PixelResolution
  palette: string
  accessories?: string[]
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
