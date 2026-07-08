import type { PaletteDef, PaletteMap } from './types'

export class PaletteSwapper {
  static compile(palette: PaletteDef): PaletteMap {
    const map: PaletteMap = new Map()
    for (const mapping of palette.mappings) {
      const key = mapping.from.join(',')
      map.set(key, mapping.to)
    }
    return map
  }
}
