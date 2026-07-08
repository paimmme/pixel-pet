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
  },
  {
    id: 'sleep',
    name: '睡觉',
    frameCount: 6,
    fps: 3,
    loop: true,
    directions: null,
    poseTemplate: 'poses_32.json'
  },
  {
    id: 'sit',
    name: '坐下',
    frameCount: 4,
    fps: 4,
    loop: true,
    directions: null,
    poseTemplate: 'poses_32.json'
  },
  {
    id: 'eat',
    name: '吃饭',
    frameCount: 6,
    fps: 5,
    loop: false,
    directions: null,
    poseTemplate: 'poses_32.json'
  },
  {
    id: 'dance',
    name: '跳舞',
    frameCount: 8,
    fps: 8,
    loop: true,
    directions: null,
    poseTemplate: 'poses_32.json'
  },
  {
    id: 'surprise',
    name: '惊讶',
    frameCount: 3,
    fps: 6,
    loop: false,
    directions: null,
    poseTemplate: 'poses_32.json'
  },
  {
    id: 'dodge',
    name: '躲闪',
    frameCount: 4,
    fps: 8,
    loop: false,
    directions: null,
    poseTemplate: 'poses_32.json'
  }
]

export function getAnimal(id: string): AnimalDef | undefined {
  return ANIMALS.find(a => a.id === id)
}

export function getAction(id: string): ActionDef | undefined {
  return ACTIONS.find(a => a.id === id)
}
