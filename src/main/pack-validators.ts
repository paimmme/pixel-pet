import { existsSync, statSync } from 'fs'
import { join } from 'path'
import type { CharacterPackManifest, ActionPackManifest, ValidationError } from '../shared/pack-types'

export type ValidationResult<T> =
  | { valid: true; data: T }
  | { valid: false; errors: ValidationError[] }

// ──────────────────────────────────────
// Manifest shape validation
// ──────────────────────────────────────

const VALID_RESOLUTIONS = [16, 32]

function checkShape(value: unknown, field: string): ValidationError[] {
  const errs: ValidationError[] = []

  if (value === null || value === undefined) {
    errs.push({ field, message: 'Required value is null or undefined' })
    return errs
  }

  return errs
}

export function validateCharacterManifest(raw: unknown): ValidationResult<CharacterPackManifest> {
  const errors: ValidationError[] = []

  if (!raw || typeof raw !== 'object') {
    errors.push({ field: 'root', message: 'Manifest must be a JSON object' })
    return { valid: false, errors }
  }

  const m = raw as Record<string, unknown>

  // schemaVersion
  if (m.schemaVersion !== 1) {
    errors.push({ field: 'schemaVersion', message: `Expected 1, got ${m.schemaVersion}` })
  }

  // id
  if (!m.id || typeof m.id !== 'string') {
    errors.push({ field: 'id', message: 'Must be a non-empty string' })
  }

  // name
  if (!m.name || typeof m.name !== 'string') {
    errors.push({ field: 'name', message: 'Must be a non-empty string' })
  }

  // type
  if (m.type !== 'character') {
    errors.push({ field: 'type', message: `Expected 'character', got ${m.type}` })
  }

  // resolutions
  if (!Array.isArray(m.resolutions) || m.resolutions.length === 0) {
    errors.push({ field: 'resolutions', message: 'Must be a non-empty array' })
  } else {
    for (const r of m.resolutions) {
      if (!VALID_RESOLUTIONS.includes(r as number)) {
        errors.push({ field: 'resolutions', message: `Invalid resolution: ${r}` })
      }
    }
  }

  // defaultResolution
  if (typeof m.defaultResolution !== 'number' || !VALID_RESOLUTIONS.includes(m.defaultResolution as number)) {
    errors.push({ field: 'defaultResolution', message: `Must be one of ${VALID_RESOLUTIONS.join(',')}` })
  }

  // defaultPalette
  if (!m.defaultPalette || typeof m.defaultPalette !== 'string') {
    errors.push({ field: 'defaultPalette', message: 'Must be a non-empty string' })
  }

  // layers
  if (!Array.isArray(m.layers) || m.layers.length === 0) {
    errors.push({ field: 'layers', message: 'Must be a non-empty array' })
  } else {
    for (let i = 0; i < m.layers.length; i++) {
      const l = m.layers[i] as Record<string, unknown>
      if (!l.id || typeof l.id !== 'string') errors.push({ field: `layers[${i}].id`, message: 'Missing layer id' })
      if (typeof l.zIndex !== 'number') errors.push({ field: `layers[${i}].zIndex`, message: 'Expected number' })
      if (!l.name || typeof l.name !== 'string') errors.push({ field: `layers[${i}].name`, message: 'Missing layer name' })
      if (!l.anchor || typeof l.anchor !== 'object') errors.push({ field: `layers[${i}].anchor`, message: 'Required {x, y} object' })
      else {
        const a = l.anchor as Record<string, unknown>
        if (typeof a.x !== 'number') errors.push({ field: `layers[${i}].anchor.x`, message: 'Expected number' })
        if (typeof a.y !== 'number') errors.push({ field: `layers[${i}].anchor.y`, message: 'Expected number' })
      }
    }
  }

  // hitArea
  if (!m.hitArea || typeof m.hitArea !== 'object') {
    errors.push({ field: 'hitArea', message: 'Required object' })
  }

  if (errors.length > 0) return { valid: false, errors }

  return {
    valid: true,
    data: m as unknown as CharacterPackManifest
  }
}

export function validateActionManifest(raw: unknown): ValidationResult<ActionPackManifest> {
  const errors: ValidationError[] = []

  if (!raw || typeof raw !== 'object') {
    errors.push({ field: 'root', message: 'Manifest must be a JSON object' })
    return { valid: false, errors }
  }

  const m = raw as Record<string, unknown>

  if (m.schemaVersion !== 1) errors.push({ field: 'schemaVersion', message: `Expected 1, got ${m.schemaVersion}` })
  if (!m.id || typeof m.id !== 'string') errors.push({ field: 'id', message: 'Must be a non-empty string' })
  if (m.type !== 'action') errors.push({ field: 'type', message: `Expected 'action', got ${m.type}` })
  if (!m.name || typeof m.name !== 'string') errors.push({ field: 'name', message: 'Must be a non-empty string' })
  if (typeof m.frameCount !== 'number' || (m.frameCount as number) < 1) errors.push({ field: 'frameCount', message: 'Must be positive integer' })
  if (typeof m.fps !== 'number' || (m.fps as number) < 1) errors.push({ field: 'fps', message: 'Must be positive integer' })
  if (typeof m.loop !== 'boolean') errors.push({ field: 'loop', message: 'Expected boolean' })
  if (typeof m.category !== 'string') errors.push({ field: 'category', message: 'Must be a string' })

  if (m.directions !== undefined && m.directions !== null) {
    const validDirections = ['down', 'left', 'right', 'up']
    if (!Array.isArray(m.directions) || m.directions.length < 1) {
      errors.push({ field: 'directions', message: 'Must be a non-empty array of Direction (down/left/right/up) when specified' })
    } else {
      for (const d of m.directions) {
        if (typeof d !== 'string' || !validDirections.includes(d)) {
          errors.push({ field: 'directions', message: `Invalid direction "${String(d)}". Must be one of: ${validDirections.join(', ')}` })
        }
      }
    }
  }

  if (m.requiredLayers !== undefined && m.requiredLayers !== null) {
    if (!Array.isArray(m.requiredLayers)) {
      errors.push({ field: 'requiredLayers', message: 'Must be an array of strings' })
    }
  }

  if (errors.length > 0) return { valid: false, errors }

  return {
    valid: true,
    data: m as unknown as ActionPackManifest
  }
}

// ──────────────────────────────────────
// On-disk existence validation
// ──────────────────────────────────────

export function validatePackFiles(
  rootPath: string,
  manifest: CharacterPackManifest
): ValidationError[] {
  const errors: ValidationError[] = []

  if (!existsSync(rootPath)) {
    errors.push({ field: 'rootPath', message: `Pack directory not found: ${rootPath}` })
    return errors
  }

  if (!existsSync(join(rootPath, 'manifest.json'))) {
    errors.push({ field: 'manifest.json', message: 'manifest.json not found' })
  }

  // Check resolutions subdirectories exist
  for (const res of manifest.resolutions) {
    const resDir = join(rootPath, 'parts', String(res))
    if (!existsSync(resDir)) {
      errors.push({ field: `parts/${res}`, message: `Resolution directory missing: ${resDir}` })
    }
  }

  // Check each layer's PNG exists
  for (const layer of manifest.layers) {
    for (const res of manifest.resolutions) {
      const layerPath = join(rootPath, 'parts', String(res), `${layer.id}.png`)
      if (!existsSync(layerPath)) {
        if (!layer.optional) {
          errors.push({ field: layer.id, message: `Required layer "${layer.id}" missing at ${res}px` })
        }
      }
    }
  }

  return errors
}
