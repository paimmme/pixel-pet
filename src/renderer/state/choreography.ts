export interface ChoreographyStep {
  actionId: string
  repeats?: number
}

export interface ChoreographyPreset {
  id: string
  name: string
  steps: ChoreographyStep[]
}

/** Built-in choreography presets */
export const CHOREOGRAPHY_PRESETS: ChoreographyPreset[] = [
  {
    id: 'morning-practice',
    name: '晨练',
    steps: [
      { actionId: 'plié', repeats: 2 },
      { actionId: 'relevé' },
      { actionId: 'pirouette', repeats: 2 },
      { actionId: 'arabesque' },
      { actionId: 'bow' }
    ]
  },
  {
    id: 'ballet-performance',
    name: '芭蕾表演',
    steps: [
      { actionId: 'bow' },
      { actionId: 'plié' },
      { actionId: 'relevé' },
      { actionId: 'pirouette', repeats: 3 },
      { actionId: 'arabesque' },
      { actionId: 'bow' }
    ]
  },
  {
    id: 'full-practice',
    name: '全面练习',
    steps: [
      { actionId: 'plié', repeats: 3 },
      { actionId: 'relevé', repeats: 2 },
      { actionId: 'pirouette', repeats: 2 },
      { actionId: 'arabesque', repeats: 2 },
      { actionId: 'bow' },
      { actionId: 'jump', repeats: 2 },
      { actionId: 'dance', repeats: 3 }
    ]
  }
]

/**
 * Plays a sequence of actions one at a time.
 * Call `onAnimationComplete()` when each action finishes.
 */
export class ChoreographyController {
  private _currentPreset: ChoreographyPreset | null = null
  private _stepIndex = 0
  private _repeatCount = 0
  private _active = false

  /** Start playing a preset. Returns false if already playing. */
  playPreset(presetId: string, triggerAction: (actionId: string) => void): boolean {
    if (this._active && this._currentPreset) return false
    const preset = CHOREOGRAPHY_PRESETS.find(p => p.id === presetId)
    if (!preset) return false

    this._currentPreset = preset
    this._stepIndex = 0
    this._repeatCount = 1
    this._active = true
    this.playCurrentStep(triggerAction)
    return true
  }

  private playCurrentStep(triggerAction: (actionId: string) => void): void {
    if (!this._currentPreset || this._stepIndex >= this._currentPreset.steps.length) {
      this._active = false
      return
    }
    const step = this._currentPreset.steps[this._stepIndex]
    triggerAction(step.actionId)
  }

  /**
   * Call this when the current action's animation completes.
   * Handles repeats and advancing to the next step.
   */
  onAnimationComplete(triggerAction: (actionId: string) => void): void {
    if (!this._active || !this._currentPreset) return

    const step = this._currentPreset.steps[this._stepIndex]
    const maxRepeats = step.repeats ?? 1

    if (this._repeatCount < maxRepeats) {
      // Repeat the same action
      this._repeatCount++
      this.playCurrentStep(triggerAction)
    } else {
      // Move to the next step
      this._stepIndex++
      this._repeatCount = 1
      if (this._stepIndex < this._currentPreset.steps.length) {
        this.playCurrentStep(triggerAction)
      } else {
        // Preset complete
        this._active = false
      }
    }
  }

  /** Stop the current preset */
  stop(): void {
    this._active = false
    this._currentPreset = null
    this._stepIndex = 0
  }

  get isPlaying(): boolean { return this._active }
  get currentPreset(): string | null { return this._currentPreset?.id ?? null }
  get currentStepAction(): string | null {
    if (!this._active || !this._currentPreset) return null
    const step = this._currentPreset.steps[this._stepIndex]
    return step?.actionId ?? null
  }
}
