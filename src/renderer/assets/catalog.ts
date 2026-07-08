import type { AnimalDef, ActionDef, ActionPhase, InteractionZone } from '../engine/types'

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
  { id: 'rabbit', name: 'Brown Rabbit', animalId: 'rabbit' },
  { id: 'rabbit_white', name: 'White Rabbit', animalId: 'rabbit' },
  { id: 'rabbit_spot', name: 'Spotted Rabbit', animalId: 'rabbit' },
  { id: 'panda', name: 'Giant Panda', animalId: 'panda' },
  { id: 'panda_red', name: 'Red Panda', animalId: 'panda' },
  { id: 'frog', name: 'Green Frog', animalId: 'frog' },
  { id: 'frog_blue', name: 'Blue Poison Dart', animalId: 'frog' },
  { id: 'penguin', name: 'Emperor Penguin', animalId: 'penguin' },
  { id: 'penguin_king', name: 'King Penguin', animalId: 'penguin' },
  { id: 'mouse', name: 'Gray Mouse', animalId: 'mouse' },
  { id: 'mouse_white', name: 'White Mouse', animalId: 'mouse' },
  { id: 'bear', name: 'Brown Bear', animalId: 'bear' },
  { id: 'bear_polar', name: 'Polar Bear', animalId: 'bear' },
  { id: 'koala', name: 'Koala', animalId: 'koala' },
  { id: 'koala_golden', name: 'Golden Koala', animalId: 'koala' },
  { id: 'owl', name: 'Barn Owl', animalId: 'owl' },
  { id: 'owl_snow', name: 'Snowy Owl', animalId: 'owl' },
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
  },
  {
    id: 'rabbit',
    name: 'Rabbit',
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
    defaultPalette: 'rabbit',
    hitArea: { x: 7, y: 4, width: 18, height: 26 },
    zones: [
      { id: 'head', anchor: { x: 16, y: 6 }, radius: 6 },
      { id: 'belly', anchor: { x: 16, y: 20 }, radius: 5 },
      { id: 'tail', anchor: { x: 4, y: 18 }, radius: 4 }
    ]
  },
  {
    id: 'panda',
    name: 'Panda',
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
    defaultPalette: 'panda',
    hitArea: { x: 7, y: 8, width: 18, height: 22 },
    zones: [
      { id: 'head', anchor: { x: 16, y: 8 }, radius: 7 },
      { id: 'belly', anchor: { x: 16, y: 20 }, radius: 5 },
      { id: 'tail', anchor: { x: 4, y: 22 }, radius: 3 }
    ]
  },
  {
    id: 'frog',
    name: 'Frog',
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
    defaultPalette: 'frog',
    hitArea: { x: 4, y: 12, width: 24, height: 18 },
    zones: [
      { id: 'head', anchor: { x: 16, y: 14 }, radius: 6 },
      { id: 'belly', anchor: { x: 16, y: 24 }, radius: 5 },
      { id: 'tail', anchor: { x: 6, y: 26 }, radius: 4 }
    ]
  },
  {
    id: 'penguin',
    name: 'Penguin',
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
    defaultPalette: 'penguin',
    hitArea: { x: 8, y: 14, width: 16, height: 16 },
    zones: [
      { id: 'head', anchor: { x: 16, y: 16 }, radius: 5 },
      { id: 'belly', anchor: { x: 16, y: 24 }, radius: 4 },
      { id: 'tail', anchor: { x: 14, y: 28 }, radius: 3 }
    ]
  },
  {
    id: 'mouse',
    name: 'Mouse',
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
    defaultPalette: 'mouse',
    hitArea: { x: 9, y: 10, width: 14, height: 18 },
    zones: [
      { id: 'head', anchor: { x: 16, y: 12 }, radius: 5 },
      { id: 'belly', anchor: { x: 16, y: 22 }, radius: 4 },
      { id: 'tail', anchor: { x: 8, y: 20 }, radius: 3 }
    ]
  },
  {
    id: 'bear',
    name: 'Bear',
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
    defaultPalette: 'bear',
    hitArea: { x: 5, y: 8, width: 22, height: 22 },
    zones: [
      { id: 'head', anchor: { x: 16, y: 8 }, radius: 7 },
      { id: 'belly', anchor: { x: 16, y: 22 }, radius: 6 },
      { id: 'tail', anchor: { x: 4, y: 24 }, radius: 4 }
    ]
  },
  {
    id: 'koala',
    name: 'Koala',
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
    defaultPalette: 'koala',
    hitArea: { x: 7, y: 8, width: 18, height: 22 },
    zones: [
      { id: 'head', anchor: { x: 16, y: 8 }, radius: 6 },
      { id: 'belly', anchor: { x: 16, y: 20 }, radius: 5 },
      { id: 'tail', anchor: { x: 8, y: 12 }, radius: 4 }
    ]
  },
  {
    id: 'owl',
    name: 'Owl',
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
    defaultPalette: 'owl',
    hitArea: { x: 7, y: 8, width: 18, height: 22 },
    zones: [
      { id: 'head', anchor: { x: 16, y: 8 }, radius: 6 },
      { id: 'belly', anchor: { x: 16, y: 20 }, radius: 5 },
      { id: 'tail', anchor: { x: 6, y: 18 }, radius: 4 }
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
    poseTemplate: 'poses_32.json',
    staminaCost: 0,
    category: 'rest',
    phases: [
      { name: 'Inhale', phaseType: 'prepare', startFrame: 0, endFrame: 1, staminaCostPerTick: 0, gracePotential: 0 },
      { name: 'Exhale', phaseType: 'recover', startFrame: 2, endFrame: 3, staminaCostPerTick: 0, gracePotential: 0 }
    ]
  },
  {
    id: 'jump',
    name: '跳跃',
    frameCount: 6,
    fps: 8,
    loop: false,
    directions: null,
    poseTemplate: 'poses_32.json',
    staminaCost: 15,
    category: 'basic',
    phases: [
      { name: 'Squat', phaseType: 'prepare', startFrame: 0, endFrame: 1, staminaCostPerTick: 3, gracePotential: 2 },
      { name: 'Launch', phaseType: 'execute', startFrame: 2, endFrame: 2, staminaCostPerTick: 5, gracePotential: 3 },
      { name: 'Air', phaseType: 'hold', startFrame: 3, endFrame: 4, staminaCostPerTick: 3, gracePotential: 2 },
      { name: 'Land', phaseType: 'recover', startFrame: 5, endFrame: 5, staminaCostPerTick: 2, gracePotential: 1 }
    ]
  },
  {
    id: 'wave',
    name: '挥手',
    frameCount: 4,
    fps: 4,
    loop: false,
    directions: null,
    poseTemplate: 'poses_32.json',
    staminaCost: 5,
    category: 'interaction',
    phases: [
      { name: 'Raise', phaseType: 'prepare', startFrame: 0, endFrame: 0, staminaCostPerTick: 1, gracePotential: 1 },
      { name: 'Wave', phaseType: 'execute', startFrame: 1, endFrame: 1, staminaCostPerTick: 2, gracePotential: 2 },
      { name: 'Wave', phaseType: 'hold', startFrame: 2, endFrame: 2, staminaCostPerTick: 2, gracePotential: 2 },
      { name: 'Lower', phaseType: 'recover', startFrame: 3, endFrame: 3, staminaCostPerTick: 1, gracePotential: 1 }
    ]
  },
  {
    id: 'walk',
    name: '行走',
    frameCount: 4,
    fps: 6,
    loop: true,
    directions: ['down', 'left', 'right', 'up'],
    poseTemplate: 'poses_32.json',
    staminaCost: 8,
    category: 'basic',
    phases: [
      { name: 'Step', phaseType: 'execute', startFrame: 0, endFrame: 0, staminaCostPerTick: 2, gracePotential: 1 },
      { name: 'Step', phaseType: 'execute', startFrame: 1, endFrame: 1, staminaCostPerTick: 2, gracePotential: 1 },
      { name: 'Step', phaseType: 'execute', startFrame: 2, endFrame: 2, staminaCostPerTick: 2, gracePotential: 1 },
      { name: 'Step', phaseType: 'execute', startFrame: 3, endFrame: 3, staminaCostPerTick: 2, gracePotential: 1 }
    ]
  },
  {
    id: 'sleep',
    name: '睡觉',
    frameCount: 6,
    fps: 3,
    loop: true,
    directions: null,
    poseTemplate: 'poses_32.json',
    staminaCost: 0,
    category: 'rest',
    phases: [
      { name: 'Breathe In', phaseType: 'prepare', startFrame: 0, endFrame: 2, staminaCostPerTick: 0, gracePotential: 0 },
      { name: 'Breathe Out', phaseType: 'recover', startFrame: 3, endFrame: 5, staminaCostPerTick: 0, gracePotential: 0 }
    ]
  },
  {
    id: 'sit',
    name: '坐下',
    frameCount: 4,
    fps: 4,
    loop: true,
    directions: null,
    poseTemplate: 'poses_32.json',
    staminaCost: 0,
    category: 'rest',
    phases: [
      { name: 'Settle', phaseType: 'prepare', startFrame: 0, endFrame: 0, staminaCostPerTick: 0, gracePotential: 0 },
      { name: 'Rest', phaseType: 'hold', startFrame: 1, endFrame: 2, staminaCostPerTick: 0, gracePotential: 0 },
      { name: 'Shift', phaseType: 'execute', startFrame: 3, endFrame: 3, staminaCostPerTick: 0, gracePotential: 0 }
    ]
  },
  {
    id: 'eat',
    name: '吃饭',
    frameCount: 6,
    fps: 5,
    loop: false,
    directions: null,
    poseTemplate: 'poses_32.json',
    staminaCost: 5,
    category: 'interaction',
    phases: [
      { name: 'Reach', phaseType: 'prepare', startFrame: 0, endFrame: 0, staminaCostPerTick: 1, gracePotential: 1 },
      { name: 'Bite', phaseType: 'execute', startFrame: 1, endFrame: 1, staminaCostPerTick: 2, gracePotential: 2 },
      { name: 'Chew', phaseType: 'hold', startFrame: 2, endFrame: 3, staminaCostPerTick: 2, gracePotential: 1 },
      { name: 'Swallow', phaseType: 'execute', startFrame: 4, endFrame: 4, staminaCostPerTick: 1, gracePotential: 1 },
      { name: 'Wipe', phaseType: 'recover', startFrame: 5, endFrame: 5, staminaCostPerTick: 1, gracePotential: 1 }
    ]
  },
  {
    id: 'dance',
    name: '跳舞',
    frameCount: 8,
    fps: 8,
    loop: true,
    directions: null,
    poseTemplate: 'poses_32.json',
    staminaCost: 20,
    category: 'interaction',
    phases: [
      { name: 'Sway L', phaseType: 'execute', startFrame: 0, endFrame: 1, staminaCostPerTick: 3, gracePotential: 2 },
      { name: 'Sway R', phaseType: 'execute', startFrame: 2, endFrame: 3, staminaCostPerTick: 3, gracePotential: 2 },
      { name: 'Spin', phaseType: 'execute', startFrame: 4, endFrame: 5, staminaCostPerTick: 5, gracePotential: 3 },
      { name: 'Sway', phaseType: 'hold', startFrame: 6, endFrame: 7, staminaCostPerTick: 2, gracePotential: 1 }
    ]
  },
  {
    id: 'surprise',
    name: '惊讶',
    frameCount: 3,
    fps: 6,
    loop: false,
    directions: null,
    poseTemplate: 'poses_32.json',
    staminaCost: 8,
    category: 'reaction',
    phases: [
      { name: 'Startle', phaseType: 'execute', startFrame: 0, endFrame: 0, staminaCostPerTick: 4, gracePotential: 2 },
      { name: 'Wide', phaseType: 'hold', startFrame: 1, endFrame: 1, staminaCostPerTick: 3, gracePotential: 2 },
      { name: 'Recover', phaseType: 'recover', startFrame: 2, endFrame: 2, staminaCostPerTick: 1, gracePotential: 1 }
    ]
  },
  {
    id: 'dodge',
    name: '躲闪',
    frameCount: 4,
    fps: 8,
    loop: false,
    directions: null,
    poseTemplate: 'poses_32.json',
    staminaCost: 12,
    category: 'reaction',
    phases: [
      { name: 'React', phaseType: 'prepare', startFrame: 0, endFrame: 0, staminaCostPerTick: 3, gracePotential: 1 },
      { name: 'Dodge', phaseType: 'execute', startFrame: 1, endFrame: 1, staminaCostPerTick: 5, gracePotential: 3 },
      { name: 'Dodge', phaseType: 'execute', startFrame: 2, endFrame: 2, staminaCostPerTick: 5, gracePotential: 2 },
      { name: 'Recover', phaseType: 'recover', startFrame: 3, endFrame: 3, staminaCostPerTick: 2, gracePotential: 1 }
    ]
  },
  {
    id: 'plié',
    name: 'Plie',
    frameCount: 6,
    fps: 4,
    loop: false,
    directions: null,
    poseTemplate: 'poses_32.json',
    staminaCost: 10,
    category: 'ballet',
    phases: [
      { name: 'Lower', phaseType: 'prepare', startFrame: 0, endFrame: 1, staminaCostPerTick: 2, gracePotential: 1 },
      { name: 'Hold', phaseType: 'hold', startFrame: 2, endFrame: 3, staminaCostPerTick: 3, gracePotential: 2 },
      { name: 'Rise', phaseType: 'recover', startFrame: 4, endFrame: 5, staminaCostPerTick: 2, gracePotential: 1 }
    ]
  },
  {
    id: 'relevé',
    name: 'Releve',
    frameCount: 6,
    fps: 4,
    loop: false,
    directions: null,
    poseTemplate: 'poses_32.json',
    staminaCost: 15,
    category: 'ballet',
    phases: [
      { name: 'Prepare', phaseType: 'prepare', startFrame: 0, endFrame: 1, staminaCostPerTick: 2, gracePotential: 1 },
      { name: 'Rise', phaseType: 'execute', startFrame: 2, endFrame: 3, staminaCostPerTick: 4, gracePotential: 2 },
      { name: 'Hold', phaseType: 'hold', startFrame: 4, endFrame: 4, staminaCostPerTick: 3, gracePotential: 2 },
      { name: 'Lower', phaseType: 'recover', startFrame: 5, endFrame: 5, staminaCostPerTick: 1, gracePotential: 1 }
    ]
  },
  {
    id: 'pirouette',
    name: 'Pirouette',
    frameCount: 8,
    fps: 6,
    loop: false,
    directions: null,
    poseTemplate: 'poses_32.json',
    staminaCost: 25,
    category: 'ballet',
    phases: [
      { name: 'Prepare', phaseType: 'prepare', startFrame: 0, endFrame: 0, staminaCostPerTick: 3, gracePotential: 2 },
      { name: 'Turn', phaseType: 'execute', startFrame: 1, endFrame: 4, staminaCostPerTick: 5, gracePotential: 3 },
      { name: 'Spot', phaseType: 'hold', startFrame: 5, endFrame: 6, staminaCostPerTick: 4, gracePotential: 2 },
      { name: 'Finish', phaseType: 'recover', startFrame: 7, endFrame: 7, staminaCostPerTick: 2, gracePotential: 1 }
    ]
  },
  {
    id: 'arabesque',
    name: 'Arabesque',
    frameCount: 6,
    fps: 3,
    loop: false,
    directions: null,
    poseTemplate: 'poses_32.json',
    staminaCost: 20,
    category: 'ballet',
    phases: [
      { name: 'Start', phaseType: 'prepare', startFrame: 0, endFrame: 1, staminaCostPerTick: 2, gracePotential: 1 },
      { name: 'Extend', phaseType: 'execute', startFrame: 2, endFrame: 3, staminaCostPerTick: 5, gracePotential: 3 },
      { name: 'Hold', phaseType: 'hold', startFrame: 4, endFrame: 4, staminaCostPerTick: 4, gracePotential: 2 },
      { name: 'Close', phaseType: 'recover', startFrame: 5, endFrame: 5, staminaCostPerTick: 1, gracePotential: 1 }
    ]
  },
  {
    id: 'bow',
    name: 'Bow',
    frameCount: 4,
    fps: 3,
    loop: false,
    directions: null,
    poseTemplate: 'poses_32.json',
    staminaCost: 5,
    category: 'ballet',
    phases: [
      { name: 'Bend', phaseType: 'execute', startFrame: 0, endFrame: 1, staminaCostPerTick: 2, gracePotential: 2 },
      { name: 'Hold', phaseType: 'hold', startFrame: 2, endFrame: 2, staminaCostPerTick: 3, gracePotential: 2 },
      { name: 'Rise', phaseType: 'recover', startFrame: 3, endFrame: 3, staminaCostPerTick: 1, gracePotential: 1 }
    ]
  }
]

export function getAnimal(id: string): AnimalDef | undefined {
  return ANIMALS.find(a => a.id === id)
}

export function getAction(id: string): ActionDef | undefined {
  return ACTIONS.find(a => a.id === id)
}
