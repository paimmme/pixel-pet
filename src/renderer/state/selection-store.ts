import type { Direction, PixelResolution } from '../engine/types'

export type SelectionChangeCallback = (store: SelectionStore) => void

export interface SelectionSnapshot {
  animal: string
  action: string
  resolution: PixelResolution
  palette: string
  direction?: Direction
  accessories?: string[]
}

export class SelectionStore {
  private _animal = 'raccoon'
  private _action = 'idle'
  private _resolution: PixelResolution = 32
  private _palette = 'raccoon'
  private _direction: Direction | undefined = undefined
  private _accessories: string[] = []
  private subscribers: Set<SelectionChangeCallback> = new Set()

  get animal(): string {
    return this._animal
  }

  get action(): string {
    return this._action
  }

  get resolution(): PixelResolution {
    return this._resolution
  }

  get palette(): string {
    return this._palette
  }

  get direction(): Direction | undefined {
    return this._direction
  }

  get accessories(): string[] {
    return this._accessories
  }

  setAccessories(ids: string[]): void {
    if (JSON.stringify(ids) === JSON.stringify(this._accessories)) return
    this._accessories = ids
    this.notify()
  }

  toggleAccessory(id: string): void {
    const idx = this._accessories.indexOf(id)
    if (idx >= 0) {
      this._accessories = this._accessories.filter(a => a !== id)
    } else {
      this._accessories = [...this._accessories, id]
    }
    this.notify()
  }

  setAnimal(id: string): void {
    if (id === this._animal) return
    this._animal = id
    this.notify()
  }

  setAction(id: string): void {
    if (id === this._action) return
    this._action = id
    this.notify()
  }

  setResolution(res: PixelResolution): void {
    if (res === this._resolution) return
    this._resolution = res
    this.notify()
  }

  setPalette(id: string): void {
    if (id === this._palette) return
    this._palette = id
    this.notify()
  }

  setDirection(dir: Direction | undefined): void {
    if (dir === this._direction) return
    this._direction = dir
    this.notify()
  }

  snapshot(): SelectionSnapshot {
    return {
      animal: this._animal,
      action: this._action,
      resolution: this._resolution,
      palette: this._palette,
      direction: this._direction,
      accessories: [...this._accessories]
    }
  }

  fromSavedState(data: Partial<SelectionSnapshot>): void {
    if (data.animal !== undefined) this._animal = data.animal
    if (data.action !== undefined) this._action = data.action
    if (data.resolution !== undefined) this._resolution = data.resolution
    if (data.palette !== undefined) this._palette = data.palette
    if (data.direction !== undefined) this._direction = data.direction
    if (data.accessories !== undefined) this._accessories = data.accessories
    // Don't notify subscribers here — the caller will trigger the first animation
  }

  subscribe(cb: SelectionChangeCallback): () => void {
    this.subscribers.add(cb)
    return () => this.subscribers.delete(cb)
  }

  private notify(): void {
    for (const cb of this.subscribers) {
      cb(this)
    }
  }
}
