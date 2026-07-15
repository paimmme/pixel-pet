import { describe, it, expect } from 'vitest'
import { ANIMALS, ACTIONS, getAction, getAnimal, getPalettesForAnimal, ACCESSORIES } from '../renderer/assets/catalog'
import { ANIMAL_FACTORIES } from '../renderer/assets/test-factory'

const REQUIRED_LAYERS = ['shadow', 'tail', 'body', 'ears', 'front_arm', 'eyes', 'mouth']

// Helper: check if OffscreenCanvas is available (Node.js 22+ or browser env)
function hasCanvas(): boolean {
  try {
    return typeof OffscreenCanvas !== 'undefined'
  } catch {
    return false
  }
}

describe('Catalog integrity', () => {
  it('has all 11 animals', () => {
    expect(ANIMALS).toHaveLength(11)
    const ids = ANIMALS.map(a => a.id).sort()
    expect(ids).toEqual([
      'bear', 'cat', 'fox', 'frog', 'koala', 'mouse', 'owl', 'panda', 'penguin', 'rabbit', 'raccoon',
    ])
  })

  it('each animal has name, resolutions, defaultPalette, layers, hitArea, zones', () => {
    for (const a of ANIMALS) {
      expect(a.name).toBeTruthy()
      expect(a.resolutions).toContain(16)
      expect(a.resolutions).toContain(32)
      expect(a.defaultPalette).toBeTruthy()
      expect(a.layers.length).toBeGreaterThanOrEqual(7)
      expect(a.hitArea).toBeDefined()
      expect(a.hitArea.width).toBeGreaterThan(0)
      expect(a.zones).toBeDefined()
    }
  })

  it('each animal has all required layer IDs', () => {
    for (const a of ANIMALS) {
      const layerIds = a.layers.map(l => l.id)
      for (const required of REQUIRED_LAYERS) {
        expect(layerIds).toContain(required)
      }
    }
  })

  it('each animal has defaultPalette that exists in getPalettesForAnimal', () => {
    for (const a of ANIMALS) {
      const palettes = getPalettesForAnimal(a.id)
      expect(palettes.length).toBeGreaterThanOrEqual(1)
      const paletteIds = palettes.map(p => p.id)
      expect(paletteIds).toContain(a.defaultPalette)
    }
  })

  it('factory palette IDs match catalog palette IDs', () => {
    for (const a of ANIMALS) {
      const catalogPalIds = getPalettesForAnimal(a.id).map(p => p.id).sort()
      // Only verify structure if canvas is available (factory can be loaded)
      if (hasCanvas()) {
        const assets = ANIMAL_FACTORIES[a.id](32)
        const factoryPalIds = assets.palettes.map(p => p.id).sort()
        expect(factoryPalIds).toEqual(catalogPalIds)
      }
    }
  })
})

describe('Actions catalog', () => {
  it('has all core actions', () => {
    const ids = ACTIONS.map(a => a.id).sort()
    expect(ids).toContain('idle')
    expect(ids).toContain('walk')
    expect(ids).toContain('jump')
    expect(ids).toContain('wave')
    expect(ids).toContain('sleep')
    expect(ids).toContain('sit')
    expect(ids).toContain('eat')
    expect(ids).toContain('dance')
  })

  it('each action has name, fps, frameCount, staminaCost', () => {
    for (const a of ACTIONS) {
      expect(a.name).toBeTruthy()
      expect(a.fps).toBeGreaterThan(0)
      expect(a.frameCount).toBeGreaterThan(0)
      expect(a.staminaCost).toBeGreaterThanOrEqual(0)
    }
  })

  it('getAction returns valid action', () => {
    const idle = getAction('idle')
    expect(idle).toBeDefined()
    expect(idle!.name).toBeTruthy()
  })

  it('getAction returns undefined for unknown action', () => {
    expect(getAction('nonexistent')).toBeUndefined()
  })
})

describe('Accessories catalog', () => {
  it('has at least 2 accessories', () => {
    expect(ACCESSORIES.length).toBeGreaterThanOrEqual(2)
  })

  it('each accessory has id and name', () => {
    for (const a of ACCESSORIES) {
      expect(a.id).toBeTruthy()
      expect(a.name).toBeTruthy()
    }
  })
})

if (hasCanvas()) {
  describe('Factory palette integration (canvas available)', () => {
    it('factory palettes have the expected structure', () => {
      const assets = ANIMAL_FACTORIES['raccoon'](16)
      for (const palette of assets.palettes) {
        expect(palette.id).toBeTruthy()
        expect(palette.mappings.length).toBeGreaterThan(0)
      }
    })

    it('each factory palette has valid color mappings', () => {
      for (const a of ANIMALS) {
        const assets = ANIMAL_FACTORIES[a.id](16)
        for (const palette of assets.palettes) {
          for (const m of palette.mappings) {
            expect(m.from.length).toBe(3)
            expect(m.to.length).toBe(3)
            m.from.forEach(v => expect(typeof v).toBe('number'))
            m.to.forEach(v => expect(typeof v).toBe('number'))
          }
        }
      }
    })
  })

  describe('Factory integrity (canvas available)', () => {
    it('each animal factory produces parts for all layers at both resolutions', () => {
      for (const a of ANIMALS) {
        for (const res of a.resolutions) {
          const factory = ANIMAL_FACTORIES[a.id]
          expect(factory).toBeDefined()
          const assets = factory(res as 16 | 32)
          expect(assets.parts.size).toBeGreaterThanOrEqual(7)

          for (const layer of a.layers) {
            expect(assets.parts.has(layer.id)).toBe(true)
          }
        }
      }
    })

    it('each animal factory has poses for all action IDs', () => {
      const actionIds = ACTIONS.map(a => a.id)
      for (const a of ANIMALS) {
        const assets = ANIMAL_FACTORIES[a.id](32)
        for (const actionId of actionIds) {
          expect(assets.poses.has(actionId)).toBe(true)
        }
      }
    })
  })
}
