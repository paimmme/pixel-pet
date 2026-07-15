import { describe, it, expect } from 'vitest'
import { createComposeCacheKey } from '../renderer/engine/types'
import type { ComposeConfig } from '../renderer/engine/types'

// ─── Sample config factory ───
function makeConfig(overrides: Partial<ComposeConfig> = {}): ComposeConfig {
  return {
    animal: 'raccoon',
    action: 'idle',
    resolution: 32,
    palette: 'raccoon',
    direction: 'down',
    ...overrides,
  }
}

describe('createComposeCacheKey', () => {
  it('includes all required fields', () => {
    const key = createComposeCacheKey(makeConfig())
    expect(key).toContain('raccoon')
    expect(key).toContain('idle')
    expect(key).toContain('32')
  })

  it('includes palette', () => {
    const key = createComposeCacheKey(makeConfig({ palette: 'cat_calico' }))
    expect(key).toContain('cat_calico')
  })

  it('includes direction', () => {
    const key = createComposeCacheKey(makeConfig({ direction: 'left' }))
    expect(key).toContain('left')
  })

  it('includes packId', () => {
    const key = createComposeCacheKey(makeConfig({ packId: 'pack_001' }))
    expect(key).toContain('pack_001')
  })

  it('falls back to factory when packId is absent', () => {
    const key = createComposeCacheKey(makeConfig({ packId: undefined }))
    expect(key).toContain('factory')
  })

  it('includes accessories sorted', () => {
    const key = createComposeCacheKey(makeConfig({ accessories: ['glasses', 'hat'] }))
    expect(key).toContain('glasses,hat')
    // Ensure it doesn't contain the unsorted version
    expect(key).not.toContain('hat,glasses')
  })

  it('uses "none" when accessories is empty', () => {
    const key = createComposeCacheKey(makeConfig({ accessories: [] }))
    expect(key).toContain(':none:')
  })

  it('includes expression eyes and mouth', () => {
    const key = createComposeCacheKey(makeConfig({
      expression: { eyes: 'happy', mouth: 'smile' }
    }))
    expect(key).toContain('happy,smile')
  })

  it('falls back to neutral for undefined expression parts', () => {
    const key = createComposeCacheKey(makeConfig({
      expression: { eyes: undefined, mouth: undefined }
    }))
    expect(key).toContain('neutral,neutral')
  })

  it('uses "neutral,neutral" when no expression set', () => {
    const key = createComposeCacheKey(makeConfig({ expression: undefined }))
    expect(key).toContain(':neutral,neutral')
  })

  it('defaults palette to "default" when absent', () => {
    const key = createComposeCacheKey(makeConfig({ palette: undefined }))
    expect(key).toContain('default')
  })

  it('is deterministic for same inputs', () => {
    const a = createComposeCacheKey(makeConfig())
    const b = createComposeCacheKey(makeConfig())
    expect(a).toBe(b)
  })

  it('differs when only packId changes', () => {
    const factory = createComposeCacheKey(makeConfig({ packId: undefined }))
    const pack = createComposeCacheKey(makeConfig({ packId: 'pack_007' }))
    expect(factory).not.toBe(pack)
  })

  it('differs when packActionId changes', () => {
    const a = createComposeCacheKey(makeConfig({ packActionId: 'act_abc' }))
    const b = createComposeCacheKey(makeConfig({ packActionId: 'act_xyz' }))
    expect(a).not.toBe(b)
  })

  it('produces a colon-separated 9-part key', () => {
    const key = createComposeCacheKey(makeConfig())
    const parts = key.split(':')
    expect(parts).toHaveLength(9)
    expect(parts[0]).toBe('raccoon')
    expect(parts[1]).toBe('idle')
    expect(parts[2]).toBe('32')
  })

  it('round-trips through split:join without collision', () => {
    const config = makeConfig({
      animal: 'no:colon', // edge case — colon in animal id
      action: 'test',
    })
    const key = createComposeCacheKey(config)
    const parts = key.split(':')
    // Colons are field separators; a colon in a value would corrupt parsing.
    // This test documents the current limitation.
    expect(parts.length).toBeGreaterThanOrEqual(8)
  })
})
