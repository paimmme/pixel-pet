import type { ActionDef } from '../engine/types'
import type { ActivityType } from '../../shared/activity-types'
import type { ActivityController } from './activity-controller'
import type { SkillSystem } from './skill-system'
import { ACTIONS, getAction } from '../assets/catalog'

export interface BehaviorSchedulerOptions {
  activity: ActivityController
  skills: SkillSystem
  triggerAction: (actionId: string) => void
}

export interface BehaviorScheduler {
  tick(dt: number): void
  /** Notify when an action starts (resets idle timer) */
  onActionStarted(): void
  /** Notify when an action finishes (starts cooldown) */
  onActionCompleted(actionId: string): void
  /** Notify when user activity changes (resets context timer) */
  onActivityChanged(oldType: ActivityType, newType: ActivityType): void
  setEnabled(enabled: boolean): void
  destroy(): void
}

// ─── Constants (exposed for testing) ───

export const CATEGORY_COOLDOWNS: Record<string, number> = {
  rest: 4000,
  basic: 8000,
  ballet: 15000,
  interaction: 12000,
  reaction: 10000,
  custom: 12000,
}
export const DEFAULT_COOLDOWN = 10000

/** Minimum idle time before scheduler tries any action (ms) */
export const MIN_IDLE_BEFORE_SCHEDULE = 2500

/** Time in one activity before context trigger fires (ms) */
export const ACTIVITY_TRIGGER_DELAY = 45000

/** Activity → context-appropriate actions */
export const ACTIVITY_CONTEXT_ACTIONS: Record<string, string[]> = {
  coding: ['sit'],
  media: ['sit'],
  idle: ['jump', 'dance'],
  gaming: ['jump', 'dance'],
}

/** Categories eligible for auto-scheduling */
export const AUTO_SCHEDULE_CATEGORIES = new Set(['rest', 'basic', 'ballet', 'custom'])

/** Actions never picked by scheduler */
export const NEVER_SCHEDULE = new Set(['idle', 'walk', 'wave'])

// ─── Helpers ───

export function cooldownFor(action: ActionDef): number {
  return CATEGORY_COOLDOWNS[action.category!] ?? DEFAULT_COOLDOWN
}

export function isAutoSchedulable(def: ActionDef): boolean {
  if (NEVER_SCHEDULE.has(def.id)) return false
  if (def.loop) return false
  if (!AUTO_SCHEDULE_CATEGORIES.has(def.category!)) return false
  return true
}

// ─── Factory ───

export function createBehaviorScheduler(options: BehaviorSchedulerOptions): BehaviorScheduler {
  const { activity, skills, triggerAction } = options

  // Cooldowns: actionId → expiry timestamp (performance.now())
  const cooldowns = new Map<string, number>()
  let idleTimer = 0
  let activityContextTimer = 0
  let lastActivityType = activity.currentActivity
  let enabled = true
  let destroyed = false

  // ─── Cooldown helpers ───

  function updateCooldowns(now: number): void {
    for (const [id, expiry] of cooldowns) {
      if (now >= expiry) cooldowns.delete(id)
    }
  }

  function isOnCooldown(id: string, now: number): boolean {
    const expiry = cooldowns.get(id)
    return expiry !== undefined && now < expiry
  }

  // ─── Action scoring and selection ───

  function scoreAction(def: ActionDef, fatigue: number, currentActivity: ActivityType): number {
    let s = 50 // base

    // Fatigue penalty for high-stamina actions
    const stamina = def.staminaCost ?? 0
    if (fatigue > 60) {
      s -= stamina * 3
      if (def.category === 'rest') s += 25
    } else if (fatigue < 20) {
      // Energetic — prefer active actions
      if (stamina >= 10) s += 15
    }

    // Activity context boost
    const contextActions = ACTIVITY_CONTEXT_ACTIONS[currentActivity]
    if (contextActions && contextActions.includes(def.id)) s += 20

    // Curiosity — any action not recently played
    if (!cooldowns.has(def.id)) s += 10

    // Random jitter
    s += Math.random() * 25

    return s
  }

  function pickAction(now: number): string | null {
    const fatigue = skills.getFatigue()
    const currentActivity = activity.currentActivity

    const candidates = ACTIONS.filter(a => isAutoSchedulable(a) && !isOnCooldown(a.id, now))
    if (candidates.length === 0) return null

    const scored = candidates.map(a => ({ id: a.id, score: scoreAction(a, fatigue, currentActivity) }))
    scored.sort((a, b) => b.score - a.score)

    // Weighted random from top 3
    const top = scored.slice(0, 3)
    return top[Math.floor(Math.random() * top.length)].id
  }

  // ─── Context trigger ───

  function checkContextTrigger(now: number): boolean {
    if (activityContextTimer < ACTIVITY_TRIGGER_DELAY) return false

    const contextActions = ACTIVITY_CONTEXT_ACTIONS[lastActivityType]
    if (!contextActions || contextActions.length === 0) return false

    const available = contextActions.filter(id => !isOnCooldown(id, now))
    if (available.length === 0) return false

    const chosen = available[Math.floor(Math.random() * available.length)]
    triggerAction(chosen)
    idleTimer = 0
    activityContextTimer = 0
    return true
  }

  // ─── Public API ───

  function tick(dt: number): void {
    if (destroyed || !enabled) return

    const now = performance.now()
    updateCooldowns(now)

    // Accumulate idle timer
    idleTimer += dt
    activityContextTimer += dt

    // Don't schedule if not idle long enough
    if (idleTimer < MIN_IDLE_BEFORE_SCHEDULE) return

    // Priority 1: context trigger (stable activity → appropriate action)
    if (checkContextTrigger(now)) return

    // Priority 2: idle variation (random chance per frame)
    // ~0.5% per frame at 60fps => ~1 action every 3.3s after min idle
    // At 60fps, dt~16 → chance = 16/2000 = 0.008, ~once per 125 frames ≈ 2s
    const chance = Math.min(1, dt / 2000)
    if (Math.random() < chance) {
      const picked = pickAction(now)
      if (picked) {
        triggerAction(picked)
        idleTimer = 0
      }
    }
  }

  function onActionStarted(): void {
    idleTimer = 0
  }

  function onActionCompleted(actionId: string): void {
    const def = getAction(actionId)
    if (def) {
      cooldowns.set(actionId, performance.now() + cooldownFor(def))
    }
  }

  function onActivityChanged(_oldType: ActivityType, _newType: ActivityType): void {
    lastActivityType = _newType
    activityContextTimer = 0
  }

  function setEnabled(value: boolean): void {
    enabled = value
  }

  function destroy(): void {
    destroyed = true
    cooldowns.clear()
  }

  return {
    tick,
    onActionStarted,
    onActionCompleted,
    onActivityChanged,
    setEnabled,
    destroy,
  }
}
