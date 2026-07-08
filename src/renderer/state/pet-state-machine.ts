import { PetState } from '../engine/types'
import type { ActionDef } from '../engine/types'

export { PetState }

export type FsmEvent =
  | { type: 'action' | 'change' }
  | { type: 'react' | 'pet' | 'hover' }
  | { type: 'drag-start' | 'drag-end' }
  | { type: 'animation-complete' | 'action-complete' }

export type FsmStateChangeCallback = (event: FsmEvent, newState: PetState) => void

export class PetStateMachine {
  private _state: PetState = PetState.Idle
  private previousState: PetState = PetState.Idle
  private subscribers: Set<FsmStateChangeCallback> = new Set()

  get state(): PetState {
    return this._state
  }

  feedEvent(event: FsmEvent): PetState {
    switch (this._state) {
      case PetState.Idle:
        switch (event.type) {
          case 'action':
          case 'change':
            this.transition(PetState.Acting)
            break
          case 'react':
          case 'pet':
          case 'hover':
            this.transition(PetState.Reacting)
            break
          case 'drag-start':
            this.transition(PetState.Dragging)
            break
        }
        break

      case PetState.Acting:
        switch (event.type) {
          case 'animation-complete':
          case 'action-complete':
            this.transition(PetState.Idle)
            break
          case 'react':
          case 'pet':
          case 'hover':
            this.previousState = PetState.Acting
            this.transition(PetState.Reacting)
            break
          case 'drag-start':
            this.previousState = PetState.Acting
            this.transition(PetState.Dragging)
            break
        }
        break

      case PetState.Reacting:
        switch (event.type) {
          case 'animation-complete':
          case 'action-complete':
            // Return to previous state (saved)
            this.transition(this.previousState)
            break
          case 'react':
          case 'pet':
          case 'hover':
            // Already reacting — notify subscribers to restart reaction
            this.subscribers.forEach((cb) => cb(event, PetState.Reacting))
            break
          case 'action':
          case 'change':
            this.previousState = PetState.Idle
            this.transition(PetState.Acting)
            break
          case 'drag-start':
            this.transition(PetState.Dragging)
            break
        }
        break

      case PetState.Dragging:
        switch (event.type) {
          case 'drag-end':
            this.transition(
              this.previousState === PetState.Dragging
                ? PetState.Idle
                : this.previousState
            )
            break
          case 'action':
          case 'change':
            this.previousState = PetState.Acting
            // Stay in dragging until drag-end
            break
        }
        break
    }

    return this._state
  }

  subscribe(cb: FsmStateChangeCallback): () => void {
    this.subscribers.add(cb)
    return () => this.subscribers.delete(cb)
  }

  private transition(newState: PetState): void {
    if (newState === this._state) return
    this._state = newState
    this.subscribers.forEach((cb) =>
      cb(
        { type: newState === PetState.Dragging ? 'drag-start' : 'change' },
        newState
      )
    )
  }
}
