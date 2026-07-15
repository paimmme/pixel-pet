import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { rmSync, existsSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { randomUUID } from 'crypto'

// Mock electron before importing module under test
const mockUserData = join(tmpdir(), `pp-test-${randomUUID().slice(0, 8)}`)
vi.mock('electron', () => ({
  app: {
    getPath: () => mockUserData,
  },
}))

const { loadState, saveState, patchState } = await import('../main/settings')

describe('settings (state persistence)', () => {
  beforeEach(() => {
    if (existsSync(mockUserData)) {
      rmSync(mockUserData, { recursive: true, force: true })
    }
  })

  describe('patchState', () => {
    it('preserves skillData when not overridden', () => {
      saveState({
        window: { x: 100, y: 200 },
        skillData: {
          dailyPracticeRecord: { petting: 5 },
          lastPracticeDate: '2026-07-14',
          skillLevels: { petting: 1 },
          fatigue: 0,
        },
      } as any)

      patchState({ window: { x: 300, y: 400 } } as any)

      const loaded = loadState()
      expect(loaded.skillData?.dailyPracticeRecord?.petting).toBe(5)
      expect(loaded.skillData?.fatigue).toBe(0)
    })

    it('overwrites skillData when explicitly provided', () => {
      saveState({
        window: { x: 100, y: 200 },
        skillData: {
          dailyPracticeRecord: { petting: 5 },
          lastPracticeDate: '2026-07-14',
          skillLevels: { petting: 1 },
          fatigue: 0,
        },
      } as any)

      patchState({
        skillData: {
          dailyPracticeRecord: { dance: 1 },
          lastPracticeDate: '2026-07-14',
          skillLevels: { dance: 1 },
          fatigue: 10,
        },
      } as any)

      const loaded = loadState()
      expect(loaded.skillData?.dailyPracticeRecord?.petting).toBeUndefined()
      expect(loaded.skillData?.dailyPracticeRecord?.dance).toBe(1)
    })

    it('preserves selection when only window changes', () => {
      saveState({
        window: { x: 0, y: 0 },
        selection: { animal: 'cat', action: 'idle', resolution: 16, palette: 'default' },
      } as any)

      patchState({ window: { x: 500, y: 500 } } as any)

      expect(loadState().selection?.animal).toBe('cat')
    })

    it('uses defaults when no state file exists', () => {
      patchState({} as any)
      const loaded = loadState()
      expect(loaded.window).toEqual({ x: -1, y: -1 })
    })
  })
})
