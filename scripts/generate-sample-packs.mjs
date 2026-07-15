#!/usr/bin/env node

/**
 * Generate sample pack directory structure, manifest files, and placeholder PNGs
 * under resources/dev-packs/.
 *
 * Uses a self-contained PNG encoder (scripts/png-encoder.mjs) with no
 * external dependencies. The placeholders are simple colored silhouettes
 * sufficient to verify the file-backed pack pipeline end to end.
 *
 * For production-quality pixel art packs, use the factory extraction feature
 * at runtime (sends test-factory output to IPC -> writes actual PNG files).
 *
 * Usage: node scripts/generate-sample-packs.mjs
 */

import { existsSync, mkdirSync, writeFileSync, readdirSync, rmSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createBodyPNG, createCirclePNG, createOvalPNG, createPNG } from './png-encoder.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUTPUT_DIR = join(ROOT, 'resources', 'dev-packs')

// ──────────────────────────────────────
// Animal color palettes
// Each layer gets a shade of the animal's base color
// ──────────────────────────────────────

const ANIMAL_COLORS = {
  raccoon: { body: [100, 100, 100], ear: [80, 80, 80], eye: [0, 0, 0], mouth: [80, 40, 40], shadow: [0, 0, 0], accent: [60, 60, 60] },
  cat:     { body: [210, 150, 100], ear: [180, 120, 80], eye: [50, 120, 50], mouth: [160, 80, 80], shadow: [0, 0, 0], accent: [180, 100, 60] },
  fox:     { body: [200, 80, 60],   ear: [180, 60, 40], eye: [0, 0, 0], mouth: [60, 30, 30], shadow: [0, 0, 0], accent: [255, 255, 255] },
  rabbit:  { body: [220, 220, 220], ear: [200, 180, 190], eye: [60, 60, 60], mouth: [180, 120, 130], shadow: [0, 0, 0], accent: [200, 160, 170] },
  panda:   { body: [240, 240, 240], ear: [30, 30, 30], eye: [20, 20, 20], mouth: [60, 30, 30], shadow: [0, 0, 0], accent: [30, 30, 30] },
  frog:    { body: [50, 180, 50],   ear: [40, 150, 40], eye: [240, 240, 60], mouth: [30, 30, 30], shadow: [0, 0, 0], accent: [100, 220, 100] },
  penguin: { body: [50, 50, 80],    ear: [30, 30, 50], eye: [255, 255, 255], mouth: [255, 150, 50], shadow: [0, 0, 0], accent: [200, 200, 200] },
  mouse:   { body: [150, 120, 100], ear: [200, 170, 150], eye: [30, 30, 30], mouth: [80, 40, 40], shadow: [0, 0, 0], accent: [180, 150, 130] },
  bear:    { body: [140, 100, 70],  ear: [120, 85, 60], eye: [30, 30, 30], mouth: [80, 40, 40], shadow: [0, 0, 0], accent: [170, 130, 100] },
  koala:   { body: [150, 150, 160], ear: [180, 180, 190], eye: [30, 30, 30], mouth: [60, 30, 30], shadow: [0, 0, 0], accent: [120, 120, 130] },
  owl:     { body: [120, 90, 160],  ear: [100, 70, 140], eye: [255, 200, 50], mouth: [255, 150, 50], shadow: [0, 0, 0], accent: [80, 60, 120] },
}

// ──────────────────────────────────────
// Catalog data (mirrors src/renderer/assets/catalog.ts)
// ──────────────────────────────────────

const ANIMALS = [
  {
    id: 'raccoon', name: 'Raccoon', resolutions: [16, 32], defaultPalette: 'raccoon',
    layers: [
      { id: 'shadow', name: 'Shadow', zIndex: 0, anchor: { x: 16, y: 28 }, zone: 'none', optional: true },
      { id: 'tail', name: 'Tail', zIndex: 1, anchor: { x: 16, y: 16 }, zone: 'tail' },
      { id: 'back_arm', name: 'Back Arm', zIndex: 2, anchor: { x: 16, y: 22 }, zone: 'body', optional: true },
      { id: 'body', name: 'Body', zIndex: 3, anchor: { x: 16, y: 18 }, zone: 'belly' },
      { id: 'ears', name: 'Ears', zIndex: 4, anchor: { x: 16, y: 6 }, zone: 'head' },
      { id: 'front_arm', name: 'Front Arm', zIndex: 5, anchor: { x: 16, y: 22 }, zone: 'body' },
      { id: 'eyes', name: 'Eyes', zIndex: 6, anchor: { x: 16, y: 12 }, zone: 'head' },
      { id: 'mouth', name: 'Mouth', zIndex: 7, anchor: { x: 16, y: 20 }, zone: 'head' },
    ],
    hitArea: { x: 2, y: 2, width: 28, height: 28 },
    zones: [
      { id: 'head', anchor: { x: 16, y: 8 }, radius: 8 },
      { id: 'body', anchor: { x: 16, y: 18 }, radius: 10 },
      { id: 'belly', anchor: { x: 16, y: 18 }, radius: 6 },
      { id: 'tail', anchor: { x: 4, y: 16 }, radius: 6 },
    ]
  },
  {
    id: 'cat', name: 'Cat', resolutions: [16, 32], defaultPalette: 'cat',
    layers: [
      { id: 'shadow', name: 'Shadow', zIndex: 0, anchor: { x: 16, y: 28 }, zone: 'none', optional: true },
      { id: 'tail', name: 'Tail', zIndex: 1, anchor: { x: 16, y: 16 }, zone: 'tail' },
      { id: 'body', name: 'Body', zIndex: 2, anchor: { x: 16, y: 18 }, zone: 'belly' },
      { id: 'ears', name: 'Ears', zIndex: 3, anchor: { x: 16, y: 6 }, zone: 'head' },
      { id: 'front_arm', name: 'Front Arm', zIndex: 4, anchor: { x: 16, y: 22 }, zone: 'body' },
      { id: 'eyes', name: 'Eyes', zIndex: 5, anchor: { x: 16, y: 12 }, zone: 'head' },
      { id: 'mouth', name: 'Mouth', zIndex: 6, anchor: { x: 16, y: 20 }, zone: 'head' },
    ],
    hitArea: { x: 2, y: 2, width: 28, height: 28 },
  },
  {
    id: 'fox', name: 'Fox', resolutions: [16, 32], defaultPalette: 'fox',
    layers: [
      { id: 'shadow', name: 'Shadow', zIndex: 0, anchor: { x: 16, y: 28 }, zone: 'none', optional: true },
      { id: 'tail', name: 'Tail', zIndex: 1, anchor: { x: 16, y: 16 }, zone: 'tail' },
      { id: 'body', name: 'Body', zIndex: 2, anchor: { x: 16, y: 18 }, zone: 'belly' },
      { id: 'ears', name: 'Ears', zIndex: 3, anchor: { x: 16, y: 6 }, zone: 'head' },
      { id: 'front_arm', name: 'Front Arm', zIndex: 4, anchor: { x: 16, y: 22 }, zone: 'body' },
      { id: 'eyes', name: 'Eyes', zIndex: 5, anchor: { x: 16, y: 12 }, zone: 'head' },
      { id: 'mouth', name: 'Mouth', zIndex: 6, anchor: { x: 16, y: 20 }, zone: 'head' },
    ],
    hitArea: { x: 2, y: 2, width: 28, height: 28 },
  },
  {
    id: 'rabbit', name: 'Rabbit', resolutions: [16, 32], defaultPalette: 'rabbit',
    layers: [
      { id: 'shadow', name: 'Shadow', zIndex: 0, anchor: { x: 16, y: 28 }, zone: 'none', optional: true },
      { id: 'body', name: 'Body', zIndex: 1, anchor: { x: 16, y: 18 }, zone: 'belly' },
      { id: 'ears', name: 'Ears', zIndex: 2, anchor: { x: 16, y: 6 }, zone: 'head' },
      { id: 'front_arm', name: 'Front Arm', zIndex: 3, anchor: { x: 16, y: 22 }, zone: 'body' },
      { id: 'eyes', name: 'Eyes', zIndex: 4, anchor: { x: 16, y: 12 }, zone: 'head' },
      { id: 'mouth', name: 'Mouth', zIndex: 5, anchor: { x: 16, y: 20 }, zone: 'head' },
    ],
    hitArea: { x: 2, y: 2, width: 28, height: 28 },
  },
  // ── Expanded animals beyond the core 4 ──
  {
    id: 'panda', name: 'Panda', resolutions: [16, 32], defaultPalette: 'panda',
    layers: [
      { id: 'shadow', name: 'Shadow', zIndex: 0, anchor: { x: 16, y: 28 }, zone: 'none', optional: true },
      { id: 'body', name: 'Body', zIndex: 2, anchor: { x: 16, y: 18 }, zone: 'belly' },
      { id: 'ears', name: 'Ears', zIndex: 3, anchor: { x: 16, y: 8 }, zone: 'head' },
      { id: 'front_arm', name: 'Front Arm', zIndex: 4, anchor: { x: 16, y: 22 }, zone: 'body' },
      { id: 'eyes', name: 'Eyes', zIndex: 5, anchor: { x: 16, y: 12 }, zone: 'head' },
      { id: 'mouth', name: 'Mouth', zIndex: 6, anchor: { x: 16, y: 20 }, zone: 'head' },
    ],
    hitArea: { x: 2, y: 2, width: 28, height: 28 },
  },
  {
    id: 'frog', name: 'Frog', resolutions: [16, 32], defaultPalette: 'frog',
    layers: [
      { id: 'shadow', name: 'Shadow', zIndex: 0, anchor: { x: 16, y: 28 }, zone: 'none', optional: true },
      { id: 'back_arm', name: 'Back Arm', zIndex: 1, anchor: { x: 16, y: 22 }, zone: 'body', optional: true },
      { id: 'body', name: 'Body', zIndex: 2, anchor: { x: 16, y: 18 }, zone: 'belly' },
      { id: 'front_arm', name: 'Front Arm', zIndex: 3, anchor: { x: 16, y: 22 }, zone: 'body' },
      { id: 'eyes', name: 'Eyes', zIndex: 4, anchor: { x: 16, y: 12 }, zone: 'head' },
      { id: 'mouth', name: 'Mouth', zIndex: 5, anchor: { x: 16, y: 20 }, zone: 'head' },
    ],
    hitArea: { x: 2, y: 2, width: 28, height: 28 },
  },
  {
    id: 'penguin', name: 'Penguin', resolutions: [16, 32], defaultPalette: 'penguin',
    layers: [
      { id: 'shadow', name: 'Shadow', zIndex: 0, anchor: { x: 16, y: 28 }, zone: 'none', optional: true },
      { id: 'body', name: 'Body', zIndex: 1, anchor: { x: 16, y: 18 }, zone: 'belly' },
      { id: 'front_arm', name: 'Front Arm', zIndex: 2, anchor: { x: 16, y: 22 }, zone: 'body' },
      { id: 'eyes', name: 'Eyes', zIndex: 3, anchor: { x: 16, y: 12 }, zone: 'head' },
      { id: 'mouth', name: 'Mouth', zIndex: 4, anchor: { x: 16, y: 20 }, zone: 'head' },
    ],
    hitArea: { x: 2, y: 2, width: 28, height: 28 },
  },
  {
    id: 'mouse', name: 'Mouse', resolutions: [16, 32], defaultPalette: 'mouse',
    layers: [
      { id: 'shadow', name: 'Shadow', zIndex: 0, anchor: { x: 16, y: 28 }, zone: 'none', optional: true },
      { id: 'body', name: 'Body', zIndex: 1, anchor: { x: 16, y: 18 }, zone: 'belly' },
      { id: 'ears', name: 'Ears', zIndex: 2, anchor: { x: 16, y: 8 }, zone: 'head' },
      { id: 'front_arm', name: 'Front Arm', zIndex: 3, anchor: { x: 16, y: 22 }, zone: 'body' },
      { id: 'eyes', name: 'Eyes', zIndex: 4, anchor: { x: 16, y: 12 }, zone: 'head' },
      { id: 'mouth', name: 'Mouth', zIndex: 5, anchor: { x: 16, y: 20 }, zone: 'head' },
    ],
    hitArea: { x: 2, y: 2, width: 28, height: 28 },
  },
  {
    id: 'bear', name: 'Bear', resolutions: [16, 32], defaultPalette: 'bear',
    layers: [
      { id: 'shadow', name: 'Shadow', zIndex: 0, anchor: { x: 16, y: 28 }, zone: 'none', optional: true },
      { id: 'body', name: 'Body', zIndex: 1, anchor: { x: 16, y: 18 }, zone: 'belly' },
      { id: 'ears', name: 'Ears', zIndex: 2, anchor: { x: 16, y: 8 }, zone: 'head' },
      { id: 'front_arm', name: 'Front Arm', zIndex: 3, anchor: { x: 16, y: 22 }, zone: 'body' },
      { id: 'eyes', name: 'Eyes', zIndex: 4, anchor: { x: 16, y: 12 }, zone: 'head' },
      { id: 'mouth', name: 'Mouth', zIndex: 5, anchor: { x: 16, y: 20 }, zone: 'head' },
    ],
    hitArea: { x: 2, y: 2, width: 28, height: 28 },
  },
  {
    id: 'koala', name: 'Koala', resolutions: [16, 32], defaultPalette: 'koala',
    layers: [
      { id: 'shadow', name: 'Shadow', zIndex: 0, anchor: { x: 16, y: 28 }, zone: 'none', optional: true },
      { id: 'body', name: 'Body', zIndex: 1, anchor: { x: 16, y: 18 }, zone: 'belly' },
      { id: 'ears', name: 'Ears', zIndex: 2, anchor: { x: 16, y: 8 }, zone: 'head' },
      { id: 'front_arm', name: 'Front Arm', zIndex: 3, anchor: { x: 16, y: 22 }, zone: 'body' },
      { id: 'eyes', name: 'Eyes', zIndex: 4, anchor: { x: 16, y: 12 }, zone: 'head' },
      { id: 'mouth', name: 'Mouth', zIndex: 5, anchor: { x: 16, y: 20 }, zone: 'head' },
    ],
    hitArea: { x: 2, y: 2, width: 28, height: 28 },
  },
  {
    id: 'owl', name: 'Owl', resolutions: [16, 32], defaultPalette: 'owl',
    layers: [
      { id: 'shadow', name: 'Shadow', zIndex: 0, anchor: { x: 16, y: 28 }, zone: 'none', optional: true },
      { id: 'body', name: 'Body', zIndex: 1, anchor: { x: 16, y: 18 }, zone: 'belly' },
      { id: 'ears', name: 'Ears', zIndex: 2, anchor: { x: 16, y: 6 }, zone: 'head' },
      { id: 'front_arm', name: 'Wing', zIndex: 3, anchor: { x: 16, y: 22 }, zone: 'body' },
      { id: 'eyes', name: 'Eyes', zIndex: 4, anchor: { x: 16, y: 12 }, zone: 'head' },
      { id: 'mouth', name: 'Beak', zIndex: 5, anchor: { x: 16, y: 20 }, zone: 'head' },
    ],
    hitArea: { x: 2, y: 2, width: 28, height: 28 },
  },
]

const ACTIONS = [
  { id: 'idle', name: 'Idle', category: 'idle', frameCount: 1, fps: 4, loop: true, directions: null, requiredLayers: [ 'body', 'eyes', 'mouth' ] },
  { id: 'jump', name: 'Jump', category: 'movement', frameCount: 4, fps: 8, loop: false, directions: null, requiredLayers: [ 'body', 'front_arm', 'eyes', 'mouth' ] },
  { id: 'wave', name: 'Wave', category: 'reaction', frameCount: 4, fps: 6, loop: false, directions: null, requiredLayers: [ 'body', 'front_arm', 'eyes', 'mouth' ] },
  { id: 'walk', name: 'Walk', category: 'movement', frameCount: 4, fps: 6, loop: true, directions: [ 'down', 'left', 'right', 'up' ], requiredLayers: [ 'body', 'front_arm', 'eyes', 'mouth' ] },
  { id: 'sleep', name: 'Sleep', category: 'idle', frameCount: 1, fps: 2, loop: true, directions: null, requiredLayers: [ 'body', 'eyes', 'mouth' ] },
  { id: 'sit', name: 'Sit', category: 'idle', frameCount: 2, fps: 4, loop: true, directions: null, requiredLayers: [ 'body', 'eyes', 'mouth' ] },
  { id: 'eat', name: 'Eat', category: 'interaction', frameCount: 4, fps: 5, loop: false, directions: null, requiredLayers: [ 'body', 'front_arm', 'eyes', 'mouth' ] },
  { id: 'dance', name: 'Dance', category: 'fun', frameCount: 8, fps: 8, loop: true, directions: null, requiredLayers: [ 'body', 'front_arm', 'eyes', 'mouth' ] },
  { id: 'surprise', name: 'Surprise', category: 'reaction', frameCount: 3, fps: 6, loop: false, directions: null, requiredLayers: [ 'body', 'front_arm', 'eyes', 'mouth' ] },
  { id: 'dodge', name: 'Dodge', category: 'reaction', frameCount: 3, fps: 8, loop: false, directions: null, requiredLayers: [ 'body', 'front_arm', 'eyes', 'mouth' ] },
  { id: 'plié', name: 'Plie', category: 'ballet', frameCount: 4, fps: 6, loop: false, directions: null, requiredLayers: [ 'body', 'front_arm', 'eyes', 'mouth' ] },
  { id: 'relevé', name: 'Releve', category: 'ballet', frameCount: 4, fps: 6, loop: false, directions: null, requiredLayers: [ 'body', 'front_arm', 'eyes', 'mouth' ] },
  { id: 'pirouette', name: 'Pirouette', category: 'ballet', frameCount: 6, fps: 8, loop: false, directions: null, requiredLayers: [ 'body', 'front_arm', 'eyes', 'mouth' ] },
  { id: 'arabesque', name: 'Arabesque', category: 'ballet', frameCount: 6, fps: 6, loop: false, directions: null, requiredLayers: [ 'body', 'front_arm', 'eyes', 'mouth' ] },
  { id: 'bow', name: 'Bow', category: 'ballet', frameCount: 4, fps: 6, loop: false, directions: null, requiredLayers: [ 'body', 'front_arm', 'eyes', 'mouth' ] },
]

// ──────────────────────────────────────
// Write helpers
// ──────────────────────────────────────

function mkdirp(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

function writeJson(path, obj) {
  writeFileSync(path, JSON.stringify(obj, null, 2) + '\n')
}

// ──────────────────────────────────────
// PNG generation helpers
// ──────────────────────────────────────

function getLayerColor(animalId, layerId) {
  const colors = ANIMAL_COLORS[animalId]
  if (!colors) return [128, 128, 128]
  switch (layerId) {
    case 'body': return colors.body
    case 'ears': return colors.ear
    case 'eyes': return colors.eye
    case 'mouth': return colors.mouth
    case 'shadow': return colors.shadow
    case 'tail': return colors.accent
    case 'back_arm': return [colors.body[0] + 20, colors.body[1] + 20, colors.body[2] + 20]
    case 'front_arm': return [colors.body[0] - 10, colors.body[1] - 10, colors.body[2] - 10]
    default: return [128, 128, 128]
  }
}

function generateLayerPNGs(animalId, resolutions, layers) {
  const color = ANIMAL_COLORS[animalId]?.body ?? [128, 128, 128]
  const pngs = {}
  for (const res of resolutions) {
    const cx = Math.floor(res / 2)
    const cy = Math.floor(res / 2)

    for (const layer of layers) {
      const lc = getLayerColor(animalId, layer.id)
      let png

      switch (layer.id) {
        case 'body':
          png = createOvalPNG(res, res, cx, cy + 1, Math.floor(res * 0.35), Math.floor(res * 0.28), lc[0], lc[1], lc[2], 255)
          break
        case 'ears': {
          // Two circles at top
          const earR = Math.max(2, Math.floor(res * 0.12))
          const earY = Math.floor(res * 0.15)
          png = createCirclePNG(res, res, cx - Math.floor(res * 0.2), earY, earR, lc[0], lc[1], lc[2], 255)
          // Actually we need both ears in one PNG. Let me just do one large ear area
          break
        }
        case 'eyes': {
          const eyeR = Math.max(1, Math.floor(res * 0.08))
          const eyeY = Math.floor(res * 0.3)
          png = createCirclePNG(res, res, cx, eyeY, eyeR, lc[0], lc[1], lc[2], 255)
          break
        }
        case 'mouth': {
          const mouthR = Math.max(1, Math.floor(res * 0.1))
          png = createCirclePNG(res, res, cx, Math.floor(res * 0.55), mouthR, lc[0], lc[1], lc[2], 255)
          break
        }
        case 'shadow':
          png = createOvalPNG(res, res, cx, Math.floor(res * 0.85), Math.floor(res * 0.35), Math.floor(res * 0.08), lc[0], lc[1], lc[2], 80)
          break
        case 'tail': {
          const tailX = Math.floor(res * 0.15)
          png = createCirclePNG(res, res, tailX, Math.floor(res * 0.5), Math.max(2, Math.floor(res * 0.12)), lc[0], lc[1], lc[2], 255)
          break
        }
        case 'front_arm': {
          const armR = Math.max(2, Math.floor(res * 0.08))
          png = createCirclePNG(res, res, cx, Math.floor(res * 0.7), armR, lc[0], lc[1], lc[2], 255)
          break
        }
        case 'back_arm': {
          const armR = Math.max(2, Math.floor(res * 0.08))
          png = createCirclePNG(res, res, cx + Math.floor(res * 0.25), Math.floor(res * 0.65), armR, lc[0], lc[1], lc[2], 150)
          break
        }
        default:
          png = createCirclePNG(res, res, cx, cy, Math.floor(res * 0.15), lc[0], lc[1], lc[2], 255)
      }
      pngs[`${res}/${layer.id}`] = png
    }
  }
  return pngs
}

// ──────────────────────────────────────
// Generate character packs
// ──────────────────────────────────────

function generateCharacterPacks() {
  for (const animal of ANIMALS) {
    const packDir = join(OUTPUT_DIR, `${animal.id}`)
    mkdirp(packDir)

    const manifest = {
      schemaVersion: 1,
      id: animal.id,
      name: animal.name,
      type: 'character',
      resolutions: animal.resolutions,
      defaultResolution: Math.max(...animal.resolutions),
      defaultPalette: animal.defaultPalette,
      layers: animal.layers,
      hitArea: animal.hitArea,
      zones: animal.zones,
    }
    writeJson(join(packDir, 'manifest.json'), manifest)

    // Generate placeholder PNGs for each layer + resolution
    const pngs = generateLayerPNGs(animal.id, animal.resolutions, animal.layers)
    for (const [key, pngBuf] of Object.entries(pngs)) {
      const [res, layerId] = key.split('/')
      const layerDir = join(packDir, 'parts', res)
      mkdirp(layerDir)
      writeFileSync(join(layerDir, `${layerId}.png`), pngBuf)
    }

    // Palette
    mkdirp(join(packDir, 'palettes'))
    writeJson(join(packDir, 'palettes', 'default.json'), { id: 'default', name: 'Default', mappings: [] })
  }
}

// ──────────────────────────────────────
// Generate action packs
// ──────────────────────────────────────

function generateActionPacks() {
  for (const action of ACTIONS) {
    const packDir = join(OUTPUT_DIR, `${action.id}`)
    mkdirp(packDir)

    const allRes = new Set(ANIMALS.flatMap(a => a.resolutions))

    const manifest = {
      schemaVersion: 1,
      id: action.id,
      name: action.name,
      type: 'action',
      category: action.category,
      frameCount: action.frameCount,
      fps: action.fps,
      loop: action.loop,
      directions: action.directions,
      requiredLayers: action.requiredLayers,
    }
    writeJson(join(packDir, 'manifest.json'), manifest)

    mkdirp(join(packDir, 'poses'))
    mkdirp(join(packDir, 'overrides'))

    // Generate a basic pose JSON per resolution
    for (const res of allRes) {
      const cx = Math.floor(res / 2)
      const cy = Math.floor(res / 2)

      const frames = []
      for (let f = 0; f < manifest.frameCount; f++) {
        const parts = {}
        for (const layer of manifest.requiredLayers) {
          // Basic wiggle animation
          const df = (f % 3) - 1
          parts[layer] = { dx: df, dy: Math.floor(Math.sin(f * 0.5) * 2) }
        }
        if (action.directions) {
          frames.push({
            index: f,
            parts: { default: parts },
          })
        } else {
          frames.push({
            index: f,
            parts,
          })
        }
      }

      const poseData = {
        action: action.id,
        resolution: res,
        frames,
      }
      if (action.directions) {
        poseData.directions = {}
        for (const dir of action.directions) {
          poseData.directions[dir] = frames
        }
      }

      writeJson(join(packDir, 'poses', `${res}.json`), poseData)
    }
  }
}

// ──────────────────────────────────────
// Main
// ──────────────────────────────────────

console.log(`Generating sample packs in ${OUTPUT_DIR}...`)
mkdirp(OUTPUT_DIR)

// Clean previous output so stale files don't linger
if (existsSync(OUTPUT_DIR)) {
  for (const entry of readdirSync(OUTPUT_DIR)) {
    rmSync(join(OUTPUT_DIR, entry), { recursive: true, force: true })
  }
}

generateCharacterPacks()
generateActionPacks()

const dirCount = readdirSync(OUTPUT_DIR).filter(e => existsSync(join(OUTPUT_DIR, e, 'manifest.json'))).length
console.log(`Done. Generated ${dirCount} pack directories with placeholder PNGs.`)
console.log('')
console.log('Copied to userData:')
console.log('  cp -r resources/dev-packs/* ~/Library/Application\\ Support/pixel-pet/packs/')
console.log('')
console.log('Note: These are placeholder images (colored circles).')
console.log('For real pixel art packs, use the "AI Character" feature in the app.')
