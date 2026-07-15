import { describe, it, expect } from 'vitest'
import { PaletteSwapper } from '../renderer/engine/palette-swapper'
import type { PaletteDef } from '../renderer/engine/types'

describe('PaletteSwapper.compile', () => {
  it('returns an empty map for empty mappings', () => {
    const def: PaletteDef = { id: 'empty', name: 'Empty', mappings: [] }
    const map = PaletteSwapper.compile(def)
    expect(map.size).toBe(0)
  })

  it('maps each "from" to "to"', () => {
    const def: PaletteDef = {
      id: 'test',
      name: 'Test',
      mappings: [
        { from: [100, 100, 100], to: [200, 200, 200] },
        { from: [50, 0, 0], to: [255, 0, 0] },
      ],
    }
    const map = PaletteSwapper.compile(def)
    expect(map.size).toBe(2)
    expect(map.get('100,100,100')).toEqual([200, 200, 200])
    expect(map.get('50,0,0')).toEqual([255, 0, 0])
  })

  it('later mappings override earlier ones with same key', () => {
    const def: PaletteDef = {
      id: 'override',
      name: 'Override Test',
      mappings: [
        { from: [100, 100, 100], to: [0, 0, 0] },
        { from: [100, 100, 100], to: [255, 255, 255] },
      ],
    }
    const map = PaletteSwapper.compile(def)
    expect(map.get('100,100,100')).toEqual([255, 255, 255])
  })

  it('handles single-channel RGB (e.g. grayscale)', () => {
    const def: PaletteDef = {
      id: 'gray',
      name: 'Grayscale',
      mappings: [
        { from: [128, 128, 128], to: [64, 64, 64] },
      ],
    }
    const map = PaletteSwapper.compile(def)
    expect(map.get('128,128,128')).toEqual([64, 64, 64])
  })
})
