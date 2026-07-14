#!/usr/bin/env node

/**
 * Generate sample pack directory structure and manifest files under resources/dev-packs/.
 *
 * Phase 1: Creates directory structure + JSON manifests only.
 * Phase 2: Will include PNG generation from factory output via Electron utility window.
 *
 * Usage: node scripts/generate-sample-packs.mjs
 */

import { existsSync, mkdirSync, writeFileSync, readdirSync, copyFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUTPUT_DIR = join(ROOT, 'resources', 'dev-packs')

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

const PALETTES = [
  { id: 'raccoon', name: 'Raccoon', mappings: [] },
  { id: 'cat', name: 'Cat', mappings: [] },
  { id: 'fox', name: 'Fox', mappings: [] },
  { id: 'rabbit', name: 'Rabbit', mappings: [] },
  { id: 'panda', name: 'Panda', mappings: [] },
  { id: 'frog', name: 'Frog', mappings: [] },
  { id: 'penguin', name: 'Penguin', mappings: [] },
  { id: 'mouse', name: 'Mouse', mappings: [] },
  { id: 'bear', name: 'Bear', mappings: [] },
  { id: 'koala', name: 'Koala', mappings: [] },
  { id: 'owl', name: 'Owl', mappings: [] },
]

// ──────────────────────────────────────
// Write helpers
// ──────────────────────────────────────

function ensureDir(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}

function writeJson(path, obj) {
  writeFileSync(path, JSON.stringify(obj, null, 2) + '\n')
}

// ──────────────────────────────────────
// Generate character packs
// ──────────────────────────────────────

function generateCharacterPacks() {
  for (const animal of ANIMALS) {
    const packDir = join(OUTPUT_DIR, `${animal.id}`)
    ensureDir(packDir)

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

    // Create resolution subdirectories
    for (const res of animal.resolutions) {
      ensureDir(join(packDir, 'parts', String(res)))
    }

    ensureDir(join(packDir, 'palettes'))

    // Write placeholder palette JSONs
    const usedPalettes = PALETTES.filter(p =>
      p.id === animal.defaultPalette ||
      ANIMALS.some(a => a.id === animal.id && a.defaultPalette === p.id)
    )
    for (const pal of usedPalettes) {
      writeJson(join(packDir, 'palettes', `${pal.id}.json`), pal)
    }
  }
}

// ──────────────────────────────────────
// Generate action packs
// ──────────────────────────────────────

function generateActionPacks() {
  for (const action of ACTIONS) {
    const packDir = join(OUTPUT_DIR, `${action.id}`)
    ensureDir(packDir)

    // Collect all used resolutions from character packs
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

    // Create pose resolution subdirectories
    ensureDir(join(packDir, 'poses'))
    ensureDir(join(packDir, 'overrides'))
  }
}

// ──────────────────────────────────────
// Main
// ──────────────────────────────────────

console.log(`Generating sample packs in ${OUTPUT_DIR}...`)

ensureDir(OUTPUT_DIR)
generateCharacterPacks()
generateActionPacks()

const dirCount = readdirSync(OUTPUT_DIR).filter(e => existsSync(join(OUTPUT_DIR, e, 'manifest.json'))).length
console.log(`Done. Generated ${dirCount} pack directories.`)
console.log('')
console.log('Next steps:')
console.log('  1. Copy to userData:  cp -r resources/dev-packs/* ~/Library/Application\\ Support/pixel-pet/packs/')
console.log('  2. Need actual PNG files? Generate them from the Electron dev app (Phase 2)')
