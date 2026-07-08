#!/usr/bin/env node
/**
 * PixelPet Asset Validation Script
 * 
 * Checks:
 * - All animals in catalog have required layers and valid resolutions
 * - All palette IDs are valid
 * - Each palette has at least one mapping
 * - All animal IDs have a corresponding factory
 */

const fs = require('fs')
const path = require('path')

const catalogPath = path.join(__dirname, '..', 'src', 'renderer', 'assets', 'catalog.ts')
const factoryPath = path.join(__dirname, '..', 'src', 'renderer', 'assets', 'test-factory.ts')

let errors = 0

const requiredLayers = ['shadow', 'tail', 'body', 'ears', 'front_arm', 'eyes', 'mouth']

/**
 * Extract top-level objects from the ANIMALS array by tracking brace depth.
 * Returns an array of raw object strings (including braces).
 */
function extractAnimalBlocks(content) {
  // Find the ANIMALS array: const ANIMALS: AnimalDef[] = [
  const arrayStart = content.indexOf('ANIMALS')
  if (arrayStart === -1) return []

  // Find the '= ' then the actual array opening bracket after it
  const equalsPos = content.indexOf('=', arrayStart)
  if (equalsPos === -1) return []
  const openBracket = content.indexOf('[', equalsPos)
  if (openBracket === -1) return []

  const blocks = []
  let depth = 0
  let braceDepth = 0
  let currentStart = -1
  let inTopArray = false

  for (let i = openBracket; i < content.length; i++) {
    const ch = content[i]

    if (!inTopArray && ch === '[') {
      inTopArray = true
      continue
    }

    if (!inTopArray) continue

    if (ch === '{') {
      if (braceDepth === 0) {
        currentStart = i
      }
      braceDepth++
    } else if (ch === '}') {
      braceDepth--
      if (braceDepth === 0 && currentStart !== -1) {
        blocks.push(content.slice(currentStart, i + 1))
        currentStart = -1
      }
    } else if (ch === ']' && braceDepth === 0 && inTopArray) {
      break
    }
  }

  return blocks
}

/**
 * Parse a single animal object string into structured data.
 */
function parseAnimalBlock(block) {
  const idMatch = block.match(/id:\s*'(\w+)'/)
  if (!idMatch) return null

  const nameMatch = block.match(/name:\s*'([^']+)'/)
  const resMatch = block.match(/resolutions:\s*\[([^\]]+)\]/)
  const layerMatches = [...block.matchAll(/\{ id:\s*'(\w+)'/g)]
  const paletteMatch = block.match(/defaultPalette:\s*'([^']+)'/)

  return {
    id: idMatch[1],
    name: nameMatch ? nameMatch[1] : '???',
    resolutions: resMatch ? resMatch[1].split(',').map(r => parseInt(r.trim())) : [],
    layers: layerMatches.map(m => m[1]),
    defaultPalette: paletteMatch ? paletteMatch[1] : null
  }
}

function extractPalettes(content) {
  const palettes = []
  const paletteRegex = /\{\s*id:\s*'(\w+)'\s*,\s*name:\s*'([^']+)'\s*,\s*animalId:\s*'(\w+)'\s*\}/g
  let m
  while ((m = paletteRegex.exec(content)) !== null) {
    palettes.push({ id: m[1], name: m[2], animalId: m[3] })
  }
  return palettes
}

// Main
console.log('\ud83d\udd0d PixelPet Asset Validation\n')

const content = fs.readFileSync(catalogPath, 'utf-8')

// 1. Check animals
const animalBlocks = extractAnimalBlocks(content)
const animals = animalBlocks.map(parseAnimalBlock).filter(Boolean)

console.log(`\ud83d\udccb Animals found: ${animals.length}`)

for (const animal of animals) {
  console.log(`\n  ${animal.name} (${animal.id}):`)

  // Check layers
  const layerErrors = requiredLayers.filter(l => !animal.layers.includes(l))
  if (layerErrors.length > 0) {
    console.error(`    \u274c Missing layers: ${layerErrors.join(', ')}`)
    errors++
  } else {
    console.log(`    \u2705 All ${requiredLayers.length} layers present`)
  }

  // Check resolutions
  if (animal.resolutions.length === 0) {
    console.error(`    \u274c No resolutions defined`)
    errors++
  } else {
    console.log(`    \u2705 Resolutions: ${animal.resolutions.join('x, ')}x`)
  }

  // Check default palette
  if (!animal.defaultPalette) {
    console.error(`    \u274c No default palette`)
    errors++
  } else {
    console.log(`    \u2705 Default palette: ${animal.defaultPalette}`)
  }
}

// 2. Check palettes
const palettes = extractPalettes(content)
console.log(`\n\ud83d\udccb Palettes found: ${palettes.length}`)

for (const palette of palettes) {
  const animal = animals.find(a => a.id === palette.animalId)
  if (!animal) {
    console.error(`  \u274c Palette "${palette.name}" references unknown animal: ${palette.animalId}`)
    errors++
  } else {
    console.log(`  \u2705 "${palette.name}" \u2192 ${animal.name}`)
  }
}

// 3. Check factory exists for each animal
let factoryContent
try {
  factoryContent = fs.readFileSync(factoryPath, 'utf-8')
} catch {
  console.error(`  \u274c Factory file not found: ${factoryPath}`)
  errors++
  process.exit(1)
}

for (const animal of animals) {
  const factoryRegex = new RegExp(`${animal.id}:\\s*create`)
  if (!factoryRegex.test(factoryContent)) {
    console.error(`  \u274c No asset factory found for animal: ${animal.id}`)
    errors++
  } else {
    console.log(`  \u2705 Factory exists for: ${animal.id}`)
  }
}

// Summary
console.log(`\n${'='.repeat(40)}`)
if (errors === 0) {
  console.log('\u2705 All assets validated successfully!')
} else {
  console.error(`\u274c ${errors} validation error(s) found`)
  process.exit(1)
}
