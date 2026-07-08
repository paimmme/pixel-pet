import type { ExpressionState } from '../engine/types'

export interface ExpressionController {
  /** Get current expression state for composition */
  readonly current: ExpressionState
  /** Called each frame — handles blink timer */
  tick(dt: number): void
  /** Trigger a happy expression (e.g., after petting) — fades after 3s */
  triggerHappy(): void
  /** Trigger surprised expression — fades after 2s */
  triggerSurprised(): void
  /** Trigger sleepy expression when idle too long */
  triggerSleepy(): void
  /** Reset to neutral immediately */
  reset(): void
  /** Cleanup */
  destroy(): void
}

export function createExpressionController(): ExpressionController {
  // State
  let currentEyes: ExpressionState['eyes'] = 'neutral'
  let currentMouth: ExpressionState['mouth'] = 'neutral'
  let blinkTimer = randomBlinkInterval()
  let blinkPhase: 'open' | 'closing' | 'closed' | 'opening' = 'open'
  let blinkFrameTimer = 0
  let emotionTimer = 0      // countdown for triggered emotions
  let emotionType: 'happy' | 'surprised' | 'sleepy' | null = null

  function randomBlinkInterval(): number {
    return 2000 + Math.random() * 3000  // 2-5 seconds
  }

  function tick(dt: number): void {
    // 1. Handle blink cycle
    blinkTimer -= dt
    if (blinkTimer <= 0 && blinkPhase === 'open') {
      blinkPhase = 'closing'
      blinkFrameTimer = 150  // take 150ms for full blink
    }

    if (blinkPhase !== 'open') {
      blinkFrameTimer -= dt
      if (blinkPhase === 'closing') {
        // First close halfway, then fully
        if (blinkFrameTimer < 75) {
          currentEyes = 'blink1'  // fully closed
        } else {
          currentEyes = 'blink0'  // half closed
        }
        if (blinkFrameTimer <= 0) {
          blinkPhase = 'opening'
          blinkFrameTimer = 100
        }
      } else if (blinkPhase === 'opening') {
        if (blinkFrameTimer < 50) {
          currentEyes = 'neutral'
        } else {
          currentEyes = 'blink0'
        }
        if (blinkFrameTimer <= 0) {
          blinkPhase = 'open'
          blinkTimer = randomBlinkInterval()
          currentEyes = emotionType ? determineEmotionEyes() : 'neutral'
        }
      }
    }

    // 2. Handle emotion decay
    if (emotionTimer > 0) {
      emotionTimer -= dt
      if (emotionTimer <= 0) {
        emotionType = null
        currentEyes = 'neutral'
        currentMouth = 'neutral'
      }
    }
  }

  function determineEmotionEyes(): ExpressionState['eyes'] {
    if (emotionType === 'happy') return 'happy'
    if (emotionType === 'surprised') return 'surprised'
    if (emotionType === 'sleepy') return 'sleepy'
    return 'neutral'
  }

  function determineEmotionMouth(): ExpressionState['mouth'] {
    if (emotionType === 'happy') return 'happy'
    if (emotionType === 'surprised') return 'open'
    if (emotionType === 'sleepy') return 'smile'
    return 'neutral'
  }

  function triggerHappy(): void {
    emotionType = 'happy'
    emotionTimer = 3000  // 3 second happy expression
    currentEyes = 'happy'
    currentMouth = 'happy'
  }

  function triggerSurprised(): void {
    emotionType = 'surprised'
    emotionTimer = 2000  // 2 seconds
    currentEyes = 'surprised'
    currentMouth = 'open'
  }

  function triggerSleepy(): void {
    emotionType = 'sleepy'
    emotionTimer = 5000  // 5 seconds before re-checking
    currentEyes = 'sleepy'
    currentMouth = 'smile'
  }

  function reset(): void {
    emotionType = null
    emotionTimer = 0
    currentEyes = 'neutral'
    currentMouth = 'neutral'
    blinkPhase = 'open'
    blinkTimer = randomBlinkInterval()
  }

  function destroy(): void {
    // Nothing to clean up (no DOM/event listeners)
  }

  return {
    get current(): ExpressionState { return { eyes: currentEyes, mouth: currentMouth } },
    tick,
    triggerHappy,
    triggerSurprised,
    triggerSleepy,
    reset,
    destroy
  }
}
