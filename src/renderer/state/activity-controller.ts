import type { ActivityType, ActivityInfo } from '../../shared/activity-types'
import type { ExpressionController } from './expression-controller'

export interface ActivityControllerOptions {
  expression: ExpressionController
  onWalkFrequencyChange?: (frequency: 'normal' | 'reduced' | 'increased') => void
}

export interface ActivityController {
  /** Current user activity type */
  readonly currentActivity: ActivityType
  /** How much to adjust walk interval multiplier (0.0-1.0 = slower walk, >1.0 = faster) */
  readonly walkSpeedMultiplier: number
  /** Process an activity update from main process */
  updateActivity(info: ActivityInfo): void
  /** Tick for gradual behaviors */
  tick(dt: number): void
  destroy(): void
}

export function createActivityController(options: ActivityControllerOptions): ActivityController {
  let currentActivity: ActivityType = 'other'
  let activitySince = Date.now()
  let sleepyTimer = 0

  // Walk speed multiplier per activity
  const getWalkSpeedMultiplier = (): number => {
    switch (currentActivity) {
      case 'coding': return 0.15    // very slow, don't distract
      case 'browsing': return 0.5    // half speed, occasional movement
      case 'gaming': return 1.5      // excited, more active
      case 'media': return 0.1       // watching → stay still
      case 'chatting': return 0.6    // moderate
      case 'idle': return 1.2        // screensaver mode → wander
      case 'other': return 0.5
    }
  }

  const getActivityName = (type: ActivityType): string => {
    const names: Record<ActivityType, string> = {
      coding: '编程中',
      browsing: '浏览网页',
      gaming: '打游戏',
      media: '看视频',
      chatting: '聊天中',
      idle: '空闲',
      other: '工作中'
    }
    return names[type] || '工作中'
  }

  function updateActivity(info: ActivityInfo): void {
    const prev = currentActivity
    currentActivity = info.type
    activitySince = Date.now()
    sleepyTimer = 0

    // Trigger expression changes based on activity
    if (currentActivity !== prev) {
      switch (currentActivity) {
        case 'coding':
          options.expression.triggerSleepy()
          break
        case 'browsing':
          options.expression.triggerHappy()
          break
        case 'gaming':
          options.expression.triggerHappy()
          break
        case 'chatting':
          options.expression.triggerHappy()
          break
        case 'media':
          options.expression.triggerSleepy()
          break
        case 'idle':
          options.expression.triggerSleepy()
          break
        default:
          // Let current expression decay naturally
          break
      }
    }
  }

  function tick(dt: number): void {
    // After prolonged coding/media (>60s), pet gets sleepier
    if (currentActivity === 'coding' || currentActivity === 'media') {
      sleepyTimer += dt
      if (sleepyTimer > 60000 && sleepyTimer - dt <= 60000) {
        options.expression.triggerSleepy()
      }
    }
  }

  function destroy(): void {
    // Nothing to clean up
  }

  return {
    get currentActivity(): ActivityType { return currentActivity },
    get walkSpeedMultiplier(): number { return getWalkSpeedMultiplier() },
    updateActivity,
    tick,
    destroy
  }
}
