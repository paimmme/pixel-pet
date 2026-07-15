import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { rmSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { randomUUID } from 'crypto'
import {
  validateCharacterManifest,
  validateActionManifest,
  validatePackFiles,
} from '../main/pack-validators'
import type { ValidationError } from '../shared/pack-types'
import type { CharacterPackManifest, ActionPackManifest } from '../shared/pack-types'

type Obj = Record<string, unknown>
function asChar(x: Obj): CharacterPackManifest { return x as unknown as CharacterPackManifest }
function asAct(x: Obj): ActionPackManifest { return x as unknown as ActionPackManifest }

// ─── helpers ───
function validCharManifest(): Record<string, unknown> {
  return {
    schemaVersion: 1,
    id: 'test_char',
    name: 'Test Character',
    type: 'character',
    resolutions: [32],
    defaultResolution: 32,
    defaultPalette: 'default',
    layers: [
      { id: 'body', name: 'Body', zIndex: 0 },
      { id: 'eyes', name: 'Eyes', zIndex: 1 },
    ],
    hitArea: { x: 0, y: 0, width: 32, height: 32 },
  }
}

function validActManifest(): Record<string, unknown> {
  return {
    schemaVersion: 1,
    id: 'test_action',
    name: 'Test Action',
    type: 'action',
    category: 'custom',
    frameCount: 4,
    fps: 8,
    loop: false,
    directions: null,
    requiredLayers: ['body', 'eyes'],
  }
}

function getErrors(fn: () => ReturnType<typeof validateCharacterManifest>): ValidationError[] {
  const r = fn()
  if (r.valid) return []
  return r.errors
}
function getActErrors(fn: () => ReturnType<typeof validateActionManifest>): ValidationError[] {
  const r = fn()
  if (r.valid) return []
  return r.errors
}

// ─── Character manifest ───

describe('validateCharacterManifest', () => {
  it('accepts valid manifest', () => {
    const r = validateCharacterManifest(validCharManifest())
    expect(r.valid).toBe(true)
  })

  it('rejects null', () => {
    const r = validateCharacterManifest(null)
    expect(r.valid).toBe(false)
  })

  it('rejects non-object', () => {
    expect(validateCharacterManifest('str').valid).toBe(false)
  })

  it('rejects wrong schemaVersion', () => {
    const e = getErrors(() => validateCharacterManifest({ ...validCharManifest(), schemaVersion: 2 }))
    expect(e.some(x => x.field === 'schemaVersion')).toBe(true)
  })

  it('rejects empty id', () => {
    const e = getErrors(() => validateCharacterManifest({ ...validCharManifest(), id: '' }))
    expect(e.some(x => x.field === 'id')).toBe(true)
  })

  it('rejects wrong type', () => {
    const e = getErrors(() => validateCharacterManifest({ ...validCharManifest(), type: 'action' }))
    expect(e.some(x => x.field === 'type')).toBe(true)
  })

  it('rejects empty resolutions', () => {
    const e = getErrors(() => validateCharacterManifest({ ...validCharManifest(), resolutions: [] }))
    expect(e.some(x => x.field === 'resolutions')).toBe(true)
  })

  it('rejects invalid resolution value', () => {
    const e = getErrors(() => validateCharacterManifest({ ...validCharManifest(), resolutions: [7] }))
    expect(e.some(x => x.field.startsWith('resolutions'))).toBe(true)
  })

  it('rejects empty layers', () => {
    const e = getErrors(() => validateCharacterManifest({ ...validCharManifest(), layers: [] }))
    expect(e.some(x => x.field === 'layers')).toBe(true)
  })

  it('rejects layer without id', () => {
    const e = getErrors(() => validateCharacterManifest({
      ...validCharManifest(),
      layers: [{ zIndex: 0 }],
    }))
    expect(e.some(x => x.field.includes('layers['))).toBe(true)
  })

  it('rejects missing defaultResolution', () => {
    const e = getErrors(() => validateCharacterManifest({ ...validCharManifest(), defaultResolution: 'x' }))
    expect(e.some(x => x.field === 'defaultResolution')).toBe(true)
  })

  it('rejects empty defaultPalette', () => {
    const e = getErrors(() => validateCharacterManifest({ ...validCharManifest(), defaultPalette: '' }))
    expect(e.some(x => x.field === 'defaultPalette')).toBe(true)
  })

  it('rejects missing hitArea', () => {
    const e = getErrors(() => validateCharacterManifest({ ...validCharManifest(), hitArea: null }))
    expect(e.some(x => x.field === 'hitArea')).toBe(true)
  })
})

// ─── Action manifest ───

describe('validateActionManifest', () => {
  it('accepts valid manifest', () => {
    expect(validateActionManifest(validActManifest()).valid).toBe(true)
  })

  it('rejects null', () => {
    expect(validateActionManifest(null).valid).toBe(false)
  })

  it('rejects wrong schemaVersion', () => {
    const e = getActErrors(() => validateActionManifest({ ...validActManifest(), schemaVersion: 2 }))
    expect(e.some(x => x.field === 'schemaVersion')).toBe(true)
  })

  it('rejects empty id', () => {
    const e = getActErrors(() => validateActionManifest({ ...validActManifest(), id: '' }))
    expect(e.some(x => x.field === 'id')).toBe(true)
  })

  it('rejects missing frameCount', () => {
    const e = getActErrors(() => validateActionManifest({ ...validActManifest(), frameCount: 0 }))
    expect(e.some(x => x.field === 'frameCount')).toBe(true)
  })

  it('rejects zero fps', () => {
    const e = getActErrors(() => validateActionManifest({ ...validActManifest(), fps: 0 }))
    expect(e.some(x => x.field === 'fps')).toBe(true)
  })

  it('rejects wrong type', () => {
    const e = getActErrors(() => validateActionManifest({ ...validActManifest(), type: 'character' }))
    expect(e.some(x => x.field === 'type')).toBe(true)
  })
})

// ─── On-disk file validation ───

describe('validatePackFiles', () => {
  let tmpDir: string

  beforeAll(() => {
    tmpDir = join(tmpdir(), `pp-test-${randomUUID().slice(0, 8)}`)
  })

  afterAll(() => {
    rmSync(tmpDir, { recursive: true, force: true })
  })

  function withManifest(data: Record<string, unknown>): void {
    writeFileSync(join(tmpDir, 'manifest.json'), JSON.stringify(data))
  }

  it('rejects missing pack directory', () => {
    const errs = validatePackFiles('/no/such/path', asChar(validCharManifest()))
    expect(errs.some(e => e.field === 'rootPath')).toBe(true)
  })

  it('rejects missing manifest.json', () => {
    rmSync(tmpDir, { recursive: true, force: true })
    mkdirSync(tmpDir, { recursive: true })
    const errs = validatePackFiles(tmpDir, asChar(validCharManifest()))
    expect(errs.some(e => e.field === 'manifest.json')).toBe(true)
  })

  it('rejects missing resolution directory', () => {
    rmSync(tmpDir, { recursive: true, force: true })
    mkdirSync(tmpDir, { recursive: true })
    withManifest(validCharManifest())
    const errs = validatePackFiles(tmpDir, asChar(validCharManifest()))
    expect(errs.some(e => e.field === 'parts/32')).toBe(true)
  })

  it('rejects missing required layer PNG', () => {
    rmSync(tmpDir, { recursive: true, force: true })
    mkdirSync(tmpDir, { recursive: true })
    withManifest(validCharManifest())
    mkdirSync(join(tmpDir, 'parts', '32'), { recursive: true })
    writeFileSync(join(tmpDir, 'parts', '32', 'body.png'), Buffer.alloc(10))
    const errs = validatePackFiles(tmpDir, asChar(validCharManifest()))
    expect(errs.some(e => e.field === 'eyes')).toBe(true)
  })

  it('passes when all files exist', () => {
    rmSync(tmpDir, { recursive: true, force: true })
    mkdirSync(tmpDir, { recursive: true })
    withManifest(validCharManifest())
    mkdirSync(join(tmpDir, 'parts', '32'), { recursive: true })
    writeFileSync(join(tmpDir, 'parts', '32', 'body.png'), Buffer.alloc(10))
    writeFileSync(join(tmpDir, 'parts', '32', 'eyes.png'), Buffer.alloc(10))
    expect(validatePackFiles(tmpDir, asChar(validCharManifest()))).toHaveLength(0)
  })

  it('skips optional layers', () => {
    const m = validCharManifest() as { layers: Array<Record<string, unknown>> }
    m.layers.push({ id: 'shadow', name: 'Shadow', zIndex: 2, optional: true })
    rmSync(tmpDir, { recursive: true, force: true })
    mkdirSync(tmpDir, { recursive: true })
    withManifest(m as unknown as Record<string, unknown>)
    mkdirSync(join(tmpDir, 'parts', '32'), { recursive: true })
    writeFileSync(join(tmpDir, 'parts', '32', 'body.png'), Buffer.alloc(10))
    writeFileSync(join(tmpDir, 'parts', '32', 'eyes.png'), Buffer.alloc(10))
    expect(validatePackFiles(tmpDir, asChar(m as unknown as Obj))).toHaveLength(0)
  })
})
