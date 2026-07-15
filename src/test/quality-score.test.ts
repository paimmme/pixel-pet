import { describe, it, expect } from 'vitest'
import { scoreCharacterPack } from '../main/quality-score'
import type { CharacterPack, CharacterPackManifest } from '../shared/pack-types'

function makeManifest(overrides: Partial<CharacterPackManifest> = {}): CharacterPackManifest {
  return {
    schemaVersion: 1,
    id: 'test',
    name: 'Test Character',
    type: 'character',
    resolutions: [32],
    defaultResolution: 32,
    defaultPalette: 'default',
    layers: [
      { id: 'body', name: 'Body', zIndex: 1, anchor: { x: 16, y: 16 }, zone: 'body' },
      { id: 'head', name: 'Head', zIndex: 2, anchor: { x: 16, y: 8 }, zone: 'head', optional: false },
      { id: 'accessory', name: 'Accessory', zIndex: 3, anchor: { x: 16, y: 16 }, zone: 'head', optional: true },
    ],
    hitArea: { x: 0, y: 0, width: 32, height: 32 },
    ...overrides,
  }
}

function makePack(
  manifestOverrides: Partial<CharacterPackManifest> = {},
  packOverrides: Partial<Omit<CharacterPack, 'manifest'>> = {}
): CharacterPack {
  return {
    manifest: makeManifest(manifestOverrides),
    rootPath: '/tmp/test',
    parts: {
      '32/body': '/tmp/test/parts/32/body.png',
      '32/head': '/tmp/test/parts/32/head.png',
    },
    expressionParts: {
      'expr_eyes_blink0': '/tmp/expr/blink0.png',
      'expr_eyes_blink1': '/tmp/expr/blink1.png',
      'expr_mouth_smile0': '/tmp/expr/smile0.png',
    },
    palettes: {
      default: '/tmp/palettes/default.json',
      dark: '/tmp/palettes/dark.json',
      pastel: '/tmp/palettes/pastel.json',
    },
    ...packOverrides,
  }
}

describe('scoreCharacterPack', () => {
  it('scores a complete pack highly', () => {
    const pack = makePack(
      {
        resolutions: [16, 32],
        layers: [
          { id: 'body', name: 'Body', zIndex: 1, anchor: { x: 16, y: 16 }, zone: 'body' },
          { id: 'head', name: 'Head', zIndex: 2, anchor: { x: 16, y: 8 }, zone: 'head' },
        ],
      },
      {
        parts: {
          '16/body': '/tmp/test/parts/16/body.png',
          '16/head': '/tmp/test/parts/16/head.png',
          '32/body': '/tmp/test/parts/32/body.png',
          '32/head': '/tmp/test/parts/32/head.png',
        },
      }
    )

    const score = scoreCharacterPack(pack)
    expect(score.overall).toBeGreaterThanOrEqual(60)
    expect(score.notes.length).toBeLessThanOrEqual(2)
  })

  it('penalises missing layers', () => {
    const pack = makePack({}, { parts: { '32/body': '/tmp/body.png' } })
    const score = scoreCharacterPack(pack)
    expect(score.details.layerCompleteness).toBeLessThan(20)
    expect(score.notes.some(n => n.includes('Missing'))).toBe(true)
  })

  it('penalises no expression parts', () => {
    const pack = makePack({}, { expressionParts: {} })
    const score = scoreCharacterPack(pack)
    expect(score.details.expressionVariety).toBeLessThanOrEqual(0)
  })

  it('penalises no palettes', () => {
    const pack = makePack({}, { palettes: {} })
    const score = scoreCharacterPack(pack)
    expect(score.details.paletteCount).toBe(0)
    expect(score.details.validColors).toBe(0)
  })

  it('scores resolution coverage correctly', () => {
    const single = makePack({ resolutions: [32] })
    expect(scoreCharacterPack(single).details.resolutionCoverage).toBe(10)

    const dual = makePack({ resolutions: [16, 32] })
    expect(scoreCharacterPack(dual).details.resolutionCoverage).toBe(20)
  })

  it('returns overall within 0-100 range', () => {
    const pack = makePack()
    const score = scoreCharacterPack(pack)
    expect(score.overall).toBeGreaterThanOrEqual(0)
    expect(score.overall).toBeLessThanOrEqual(100)
  })

  it('includes notes for partial packs', () => {
    const pack = makePack({}, { expressionParts: {}, palettes: { default: '/tmp/palettes/default.json' } })
    const score = scoreCharacterPack(pack)
    expect(score.notes.length).toBeGreaterThan(0)
  })
})
