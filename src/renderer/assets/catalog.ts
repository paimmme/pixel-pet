import type { AnimalDef, ActionDef, InteractionZone } from '../engine/types'

export interface AccessoryInfo {
  id: string
  name: string
  zIndex: number
}

export const ACCESSORIES: AccessoryInfo[] = [
  { id: 'hat', name: 'Top Hat', zIndex: 10 },
  { id: 'glasses', name: 'Glasses', zIndex: 7 }
]

export interface PaletteInfo {
  id: string
  name: string
  animalId: string
}

export const PALETTES: PaletteInfo[] = [
  { id: 'raccoon', name: 'Default Raccoon', animalId: 'raccoon' },
  { id: 'raccoon_snow', name: 'Snow Raccoon', animalId: 'raccoon' },
  { id: 'cat', name: 'Tabby Cat', animalId: 'cat' },
  { id: 'cat_calico', name: 'Calico Cat', animalId: 'cat' },
  { id: 'fox', name: 'Red Fox', animalId: 'fox' },
  { id: 'fox_arctic', name: 'Arctic Fox', animalId: 'fox' },
]

export function getPalettesForAnimal(animalId: string): PaletteInfo[] {
  return PALETTES.filter(p => p.animalId === animalId)
}

export const ANIMALS: AnimalDef[] = [
  {
    id: 'raccoon',
    name: 'Raccoon',
    resolutions: [16, 32],
    layers: [
      { id: 'shadow', name: 'Shadow', zIndex: 0, anchor: { x: 0, y: 0 }, zone: 'body', optional: true },
      { id: 'tail', name: 'Tail', zIndex: 1, anchor: { x: 0, y: 0 }, zone: 'tail' },
      { id: 'body', name: 'Body', zIndex: 2, anchor: { x: 0, y: 0 }, zone: 'body' },
      { id: 'ears', name: 'Ears', zIndex: 3, anchor: { x: 0, y: 0 }, zone: 'head' },
      { id: 'front_arm', name: 'Front Arm', zIndex: 4, anchor: { x: 0, y: 0 }, zone: 'body' },
      { id: 'eyes', name: 'Eyes', zIndex: 5, anchor: { x: 0, y: 0 }, zone: 'head' },
      { id: 'mouth', name: 'Mouth', zIndex: 6, anchor: { x: 0, y: 0 }, zone: 'head' }
    ],
    defaultPalette: 'raccoon',
    hitArea: { x: 6, y: 8, width: 20, height: 22 },
    zones: [
      { id: 'head', anchor: { x: 16, y: 8 }, radius: 6 },
      { id: 'belly', anchor: { x: 16, y: 20 }, radius: 5 },
      { id: 'tail', anchor: { x: 4, y: 18 }, radius: 4 }
    ]
  },
  {
    id: 'cat',
    name: 'Cat',
    resolutions: [16, 32],
    layers: [
      { id: 'shadow', name: 'Shadow', zIndex: 0, anchor: { x: 0, y: 0 }, zone: 'body', optional: true },
      { id: 'tail', name: 'Tail', zIndex: 1, anchor: { x: 0, y: 0 }, zone: 'tail' },
      { id: 'body', name: 'Body', zIndex: 2, anchor: { x: 0, y: 0 }, zone: 'body' },
      { id: 'ears', name: 'Ears', zIndex: 3, anchor: { x: 0, y: 0 }, zone: 'head' },
      { id: 'front_arm', name: 'Front Arm', zIndex: 4, anchor: { x: 0, y: 0 }, zone: 'body' },
      { id: 'eyes', name: 'Eyes', zIndex: 5, anchor: { x: 0, y: 0 }, zone: 'head' },
      { id: 'mouth', name: 'Mouth', zIndex: 6, anchor: { x: 0, y: 0 }, zone: 'head' }
    ],
    defaultPalette: 'cat',
    hitArea: { x: 8, y: 10, width: 16, height: 18 },
    zones: [
      { id: 'head', anchor: { x: 16, y: 8 }, radius: 6 },
      { id: 'belly', anchor: { x: 16, y: 20 }, radius: 5 },
      { id: 'tail', anchor: { x: 4, y: 18 }, radius: 4 }
    ]
  },
  {
    id: 'fox',
    name: 'Fox',
    resolutions: [16, 32],
    layers: [
      { id: 'shadow', name: 'Shadow', zIndex: 0, anchor: { x: 0, y: 0 }, zone: 'body', optional: true },
      { id: 'tail', name: 'Tail', zIndex: 1, anchor: { x: 0, y: 0 }, zone: 'tail' },
      { id: 'body', name: 'Body', zIndex: 2, anchor: { x: 0, y: 0 }, zone: 'body' },
      { id: 'ears', name: 'Ears', zIndex: 3, anchor: { x: 0, y: 0 }, zone: 'head' },
      { id: 'front_arm', name: 'Front Arm', zIndex: 4, anchor: { x: 0, y: 0 }, zone: 'body' },
      { id: 'eyes', name: 'Eyes', zIndex: 5, anchor: { x: 0, y: 0 }, zone: 'head' },
      { id: 'mouth', name: 'Mouth', zIndex: 6, anchor: { x: 0, y: 0 }, zone: 'head' }
    ],
    defaultPalette: 'fox',
    hitArea: { x: 6, y: 8, width: 20, height: 20 },
    zones: [
      { id: 'head', anchor: { x: 16, y: 8 }, radius: 6 },
      { id: 'belly', anchor: { x: 16, y: 20 }, radius: 5 },
      { id: 'tail', anchor: { x: 4, y: 18 }, radius: 4 }
    ]
  }
]

export const ACTIONS: ActionDef[] = [
  {
    id: 'idle',
    name: '空闲',
    frameCount: 4,
    fps: 4,
    loop: true,
    directions: null,
    poseTemplate: 'poses_32.json'
  },
  {
    id: 'jump',
    name: '跳跃',
    frameCount: 6,
    fps: 8,
    loop: false,
    directions: null,
    poseTemplate: 'poses_32.json'
  },
  {
    id: 'wave',
    name: '挥手',
    frameCount: 4,
    fps: 4,
    loop: false,
    directions: null,
    poseTemplate: 'poses_32.json'
  },
  {
    id: 'walk',
    name: '行走',
    frameCount: 4,
    fps: 6,
    loop: true,
    directions: ['down', 'left', 'right', 'up'],
    poseTemplate: 'poses_32.json'
  }
]

export function getAnimal(id: string): AnimalDef | undefined {
  return ANIMALS.find(a => a.id === id)
}

export function getAction(id: string): ActionDef | undefined {
  return ACTIONS.find(a => a.id === id)
}
