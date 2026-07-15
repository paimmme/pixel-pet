import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import type { CharacterPack, CharacterPackManifest } from '../shared/pack-types'

// ──────────────────────────────────────
// Types
// ──────────────────────────────────────

export interface QualityScore {
  /** Overall quality 0-100 */
  overall: number
  details: {
    layerCompleteness: number  // % of required layers with present PNGs
    resolutionCoverage: number // % of resolution×layer cells filled
    expressionVariety: number  // 0-20 (based on expression part count)
    paletteCount: number       // 0-20 (based on palette variety)
    layerAlignment: number     // 0-20 (based on layer size consistency)
    validColors: number        // 0-10 (palette color validation)
  }
  notes: string[]
}

// ──────────────────────────────────────
// Helpers
// ──────────────────────────────────────

function getRequiredLayerCount(manifest: CharacterPackManifest): number {
  return manifest.layers.filter(l => !l.optional).length
}

// ──────────────────────────────────────
// Scoring
// ──────────────────────────────────────

export function scoreCharacterPack(pack: CharacterPack): QualityScore {
  const { manifest, parts, expressionParts, palettes } = pack
  const notes: string[] = []

  // 1. Layer completeness — are all required layer PNGs present?
  const requiredLayers = manifest.layers.filter(l => !l.optional)
  const totalExpected = requiredLayers.length * manifest.resolutions.length
  let presentCount = 0

  for (const layer of requiredLayers) {
    for (const res of manifest.resolutions) {
      const key = `${res}/${layer.id}`
      if (parts[key]) presentCount++
    }
  }

  const layerCompletenessPct = totalExpected > 0 ? (presentCount / totalExpected) : 0
  const layerCompleteness = Math.round(layerCompletenessPct * 20)

  if (presentCount < totalExpected) {
    notes.push(`Missing ${totalExpected - presentCount} layer PNG(s) out of ${totalExpected}`)
  }

  // 2. Resolution coverage
  const resolutionCoverage = manifest.resolutions.length >= 2 ? 20 : manifest.resolutions.length === 1 ? 10 : 0

  if (manifest.resolutions.length < 2) {
    notes.push(`Only ${manifest.resolutions.length} resolution(s) — 16 and 32 recommended for best results`)
  }

  // 3. Expression variety
  const exprKeys = Object.keys(expressionParts)
  const expressionVariety = Math.min(20, Math.round(exprKeys.length * 2.5))

  if (exprKeys.length === 0) {
    notes.push('No expression variants — character may appear static')
  } else if (exprKeys.length < 4) {
    notes.push(`Only ${exprKeys.length} expression part(s) — 4+ recommended for lively expressions`)
  }

  // 4. Palette count
  const paletteIds = Object.keys(palettes)
  const paletteCount = Math.min(20, paletteIds.length * 4)

  if (paletteIds.length === 0) {
    notes.push('No palette files — default palette will be used')
  } else if (paletteIds.length < 3) {
    notes.push(`Only ${paletteIds.length} palette(s) — 3+ recommended for color variety`)
  }

  // 5. Layer alignment — check if all PNG layers for the same resolution are consistent size
  let alignmentScore = 20
  for (const res of manifest.resolutions) {
    const keyPrefix = `${res}/`
    const resLayers = Object.entries(parts).filter(([k]) => k.startsWith(keyPrefix))

    if (resLayers.length >= 2) {
      const firstPath = resLayers[0][1]
      const firstSize = getPngSize(firstPath)

      if (firstSize) {
        for (let i = 1; i < resLayers.length; i++) {
          const size = getPngSize(resLayers[i][1])
          if (size && (size.width !== firstSize.width || size.height !== firstSize.height)) {
            alignmentScore -= 5
            break
          }
        }
      }
    }
  }
  const layerAlignment = Math.max(0, alignmentScore)

  if (alignmentScore < 20) {
    notes.push('Layer sizes are not uniform — some layers may misalign in composition')
  }

  // 6. Valid colors — check palette mappings reference valid RGBA colors
  let validColors = 10
  for (const palId of paletteIds) {
    try {
      const palPath = palettes[palId]
      if (!existsSync(palPath)) {
        validColors -= 2
        continue
      }
      const raw = JSON.parse(readFileSync(palPath, 'utf-8'))
      if (!raw.mappings || !Array.isArray(raw.mappings)) {
        validColors -= 2
        notes.push(`Palette "${palId}" has no valid mappings`)
        continue
      }
      for (const mapping of raw.mappings) {
        if (!mapping.from || !mapping.to || mapping.from.length !== 3 || mapping.to.length !== 3) {
          validColors -= 1
        }
      }
    } catch {
      validColors -= 2
      notes.push(`Failed to parse palette "${palId}"`)
    }
  }
  if (paletteIds.length === 0) validColors = 0

  // Overall = sum of all categories (max 100)
  const details = {
    layerCompleteness,
    resolutionCoverage,
    expressionVariety,
    paletteCount,
    layerAlignment,
    validColors,
  }

  const overall = Math.min(100, Math.max(0,
    layerCompleteness +
    resolutionCoverage +
    expressionVariety +
    paletteCount +
    layerAlignment +
    validColors
  ))

  return { overall, details, notes }
}

// ──────────────────────────────────────
// PNG size reader (header-only, no decode)
// ──────────────────────────────────────

interface PngSize {
  width: number
  height: number
}

function getPngSize(filePath: string): PngSize | null {
  try {
    if (!existsSync(filePath)) return null
    const buf = readFileSync(filePath)
    // PNG header: 8-byte signature, then IHDR chunk: 4 len, 4 type, 4 width, 4 height
    if (buf.length < 24) return null
    // IHDR chunk type at byte 12
    if (buf[12] !== 0x49 || buf[13] !== 0x48 || buf[14] !== 0x44 || buf[15] !== 0x52) return null
    // Width at offset 16, height at offset 20 (big-endian)
    const width = buf.readUInt32BE(16)
    const height = buf.readUInt32BE(20)
    return { width, height }
  } catch {
    return null
  }
}
