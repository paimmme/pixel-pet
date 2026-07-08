import type { SkillData } from '../../shared/app-types'

export class SkillSystem {
  private _dailyPracticeRecord: Record<string, number> = {}
  private _lastPracticeDate: string = ''
  private _skillLevels: Record<string, number> = {}
  private _fatigue: number = 0
  private _statsChangeCallbacks: Array<() => void> = []

  /** Record one practice session of a specific action. Returns XP gained. */
  recordPractice(actionId: string, gracePotential: number): number {
    this.checkDailyReset()
    this._dailyPracticeRecord[actionId] = (this._dailyPracticeRecord[actionId] || 0) + 1
    // XP formula: base gracePotential, diminishing returns per daily practice
    const count = this._dailyPracticeRecord[actionId]
    const multiplier = Math.max(0.2, 1 - (count - 1) * 0.15)
    const xpGained = Math.round(gracePotential * multiplier)
    this._skillLevels[actionId] = Math.min(100, (this._skillLevels[actionId] || 0) + xpGained)
    // Fatigue increases with practice
    this._fatigue = Math.min(100, this._fatigue + 2)
    this.notify()
    return xpGained
  }

  /** Call each frame to let fatigue recover */
  restTick(dt: number): void {
    // Fatigue decreases slowly when not practicing (1% per 10 seconds)
    if (this._fatigue > 0) {
      this._fatigue = Math.max(0, this._fatigue - (dt / 10000))
    }
  }

  /** Get skill level 0-100 */
  getSkillLevel(actionId: string): number {
    return this._skillLevels[actionId] || 0
  }

  /** Get fatigue 0-100 */
  getFatigue(): number {
    return this._fatigue
  }

  /** Get today's practice count for an action */
  getPracticeCount(actionId: string): number {
    this.checkDailyReset()
    return this._dailyPracticeRecord[actionId] || 0
  }

  /** Daily practice multiplier (1.0 for first practice, diminishing) */
  getPracticeMultiplier(actionId: string): number {
    const count = this.getPracticeCount(actionId)
    return Math.max(0.2, 1 - (count - 1) * 0.15)
  }

  /** Check if day has changed and reset daily records */
  private checkDailyReset(): void {
    const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
    if (today !== this._lastPracticeDate) {
      this._dailyPracticeRecord = {}
      this._lastPracticeDate = today
    }
  }

  /** Subscribe to stat changes */
  subscribe(cb: () => void): () => void {
    this._statsChangeCallbacks.push(cb)
    return () => {
      const idx = this._statsChangeCallbacks.indexOf(cb)
      if (idx >= 0) this._statsChangeCallbacks.splice(idx, 1)
    }
  }

  private notify(): void {
    for (const cb of this._statsChangeCallbacks) cb()
  }

  /** Serialize for persistence */
  snapshot(): SkillData {
    return {
      dailyPracticeRecord: { ...this._dailyPracticeRecord },
      lastPracticeDate: this._lastPracticeDate || new Date().toISOString().slice(0, 10),
      skillLevels: { ...this._skillLevels },
      fatigue: this._fatigue
    }
  }

  /** Restore from saved data */
  restore(data: SkillData): void {
    this._dailyPracticeRecord = { ...data.dailyPracticeRecord }
    this._lastPracticeDate = data.lastPracticeDate
    this._skillLevels = { ...data.skillLevels }
    this._fatigue = data.fatigue
    this.checkDailyReset()
  }
}
