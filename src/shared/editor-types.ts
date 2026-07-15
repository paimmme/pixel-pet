import type { CharacterPackManifest } from './pack-types'
import type { RGB } from './app-types'

/** Color mapping entry in a palette */
export interface PaletteMapping {
  from: RGB
  to: RGB
}

/** Full palette data including all color mappings */
export interface EditorPaletteData {
  id: string
  name: string
  mappings: PaletteMapping[]
}

/** Layer entry shown in the editor */
export interface EditorLayerInfo {
  id: string
  name: string
  zIndex: number
  optional: boolean
  resolution: number
  pngExists: boolean
  anchor: { x: number; y: number }
  zone: string
}

/** Full data to bootstrap the pack editor */
export interface EditorPackData {
  manifest: CharacterPackManifest
  palettes: EditorPaletteData[]
  layers: EditorLayerInfo[]
  rootPath: string
}
