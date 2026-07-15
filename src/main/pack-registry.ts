import { readFileSync, existsSync, readdirSync, statSync, cpSync, mkdirSync, writeFileSync } from 'fs'
import { join, isAbsolute, basename } from 'path'
import type { CharacterPackManifest, ActionPackManifest, CharacterPack, ActionPack, PackImportResult } from '../shared/pack-types'
import type { CharacterPackSummary, ActionPackSummary } from '../shared/pack-types'
import type { ValidationError } from '../shared/pack-types'
import { validateCharacterManifest, validateActionManifest } from './pack-validators'

export type PackType = 'character' | 'action'

export interface PackScanResult {
  total: number
  loaded: number
  errors: { packId: string; errors: ValidationError[] }[]
}

export class PackRegistry {
  private characterPacks = new Map<string, CharacterPack>()
  private actionPacks = new Map<string, ActionPack>()
  private _ready = false

  get ready(): boolean {
    return this._ready
  }

  /**
   * Scan a directory for pack subdirectories and load their manifests.
   * Directory structure:
   *   packsDir/
   *     character_001/
   *       manifest.json
   *       parts/32/body.png
   *       parts/32/... (other layer PNGs)
   *       palettes/default.json
   *     action_wave/
   *       manifest.json
   *       poses/32.json
   *       overrides/raccoon/...png
   *
   * In development (unpackaged), also syncs from a dev-packs directory if provided.
   */
  async initialize(packsDir: string, devPacksDir?: string): Promise<PackScanResult> {
    // Dev-mode: auto-copy dev-packs that aren't in userData yet
    if (devPacksDir && existsSync(devPacksDir)) {
      this.syncDevPacks(devPacksDir, packsDir)
    }
    this.characterPacks.clear()
    this.actionPacks.clear()

    const errors: PackScanResult['errors'] = []

    if (!existsSync(packsDir)) {
      this._ready = true
      return { total: 0, loaded: 0, errors }
    }

    const entries = readdirSync(packsDir, { withFileTypes: true })
    const packDirs = entries.filter(e => e.isDirectory())

    let loaded = 0

    for (const dir of packDirs) {
      const packPath = join(packsDir, dir.name)
      const manifestPath = join(packPath, 'manifest.json')

      if (!existsSync(manifestPath)) {
        continue
      }

      try {
        const raw = JSON.parse(readFileSync(manifestPath, 'utf-8'))
        const packType = raw?.type

        if (packType === 'character') {
          const result = validateCharacterManifest(raw)
          if (!result.valid) {
            errors.push({ packId: dir.name, errors: result.errors })
            continue
          }
          this.characterPacks.set(result.data.id, this.buildCharacterPack(result.data, packPath))
          loaded++
        } else if (packType === 'action') {
          const result = validateActionManifest(raw)
          if (!result.valid) {
            errors.push({ packId: dir.name, errors: result.errors })
            continue
          }
          this.actionPacks.set(result.data.id, this.buildActionPack(result.data, packPath))
          loaded++
        }
      } catch (err) {
        errors.push({ packId: dir.name, errors: [{ field: 'load', message: String(err) }] })
      }
    }

    this._ready = true
    return { total: packDirs.length, loaded, errors }
  }

  // ── Queries ──

  listCharacterSummaries(): CharacterPackSummary[] {
    return Array.from(this.characterPacks.values()).map(p => ({
      id: p.manifest.id,
      name: p.manifest.name,
      resolutions: p.manifest.resolutions,
      defaultPalette: p.manifest.defaultPalette,
      layerCount: p.manifest.layers.length,
    }))
  }

  listActionSummaries(): ActionPackSummary[] {
    return Array.from(this.actionPacks.values()).map(p => ({
      id: p.manifest.id,
      name: p.manifest.name,
      category: p.manifest.category,
      frameCount: p.manifest.frameCount,
      fps: p.manifest.fps,
      loop: p.manifest.loop,
    }))
  }

  getCharacterById(id: string): CharacterPack | undefined {
    return this.characterPacks.get(id)
  }

  getActionById(id: string): ActionPack | undefined {
    return this.actionPacks.get(id)
  }

  hasCharacter(id: string): boolean {
    return this.characterPacks.has(id)
  }

  hasAction(id: string): boolean {
    return this.actionPacks.has(id)
  }

  /**
   * Remove a pack from the registry (does not delete files on disk).
   * Returns true if the pack was found and removed.
   */
  removePack(packId: string): boolean {
    return this.characterPacks.delete(packId) || this.actionPacks.delete(packId)
  }

  // ── Asset path resolution ──

  /**
   * Resolve a relative asset path within a pack to an absolute filesystem path.
   * Returns null if the requested pack doesn't exist or if the resulting path
   * would escape the pack directory (path traversal guard).
   */
  resolveAssetPath(packId: string, relativePath: string): string | null {
    const pack = this.characterPacks.get(packId) ?? this.actionPacks.get(packId)
    if (!pack) return null

    const absolute = join(pack.rootPath, relativePath)
    // Path traversal guard: must still be inside the pack root
    if (!absolute.startsWith(pack.rootPath)) return null
    if (!existsSync(absolute)) return null

    return absolute
  }

  /**
   * Copy dev-packs from source to userData packs directory.
   * Only copies packs that don't already exist in userData.
   */
  private syncDevPacks(srcDir: string, destDir: string): void {
    if (!existsSync(destDir)) {
      mkdirSync(destDir, { recursive: true })
    }

    const entries = readdirSync(srcDir, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      const packManifest = join(srcDir, entry.name, 'manifest.json')
      if (!existsSync(packManifest)) continue

      const destPackDir = join(destDir, entry.name)
      if (existsSync(destPackDir)) continue

      console.log(`[PackRegistry] Copying dev-pack: ${entry.name} -> ${destDir}`)
      cpSync(join(srcDir, entry.name), destPackDir, { recursive: true })
    }
  }

  /**
   * Read a pack asset and return its bytes. Returns null if not found.
   * Used by IPC handlers to serve asset data to the renderer.
   */
  readAssetBytes(packId: string, relativePath: string): Uint8Array | null {
    const absPath = this.resolveAssetPath(packId, relativePath)
    if (!absPath) return null
    return readFileSync(absPath)
  }

  // ── Import / Export ──

  /**
   * Import a pack from sourcePath into packsDir.
   * Validates the manifest, copies files, and registers the pack.
   */
  importPack(sourcePath: string, packsDir: string): PackImportResult {
    const manifestPath = join(sourcePath, 'manifest.json')
    if (!existsSync(manifestPath)) {
      return { success: false, errors: [{ field: 'manifest.json', message: 'manifest.json not found in selected directory' }] }
    }

    try {
      const raw = JSON.parse(readFileSync(manifestPath, 'utf-8'))
      if (!raw || typeof raw.type !== 'string') {
        return { success: false, errors: [{ field: 'manifest.type', message: 'Invalid or missing pack type' }] }
      }

      // Validate manifest
      if (raw.type === 'character') {
        const result = validateCharacterManifest(raw)
        if (!result.valid) return { success: false, packId: raw.id, errors: result.errors }
      } else if (raw.type === 'action') {
        const result = validateActionManifest(raw)
        if (!result.valid) return { success: false, packId: raw.id, errors: result.errors }
      } else {
        return { success: false, errors: [{ field: 'type', message: `Unknown pack type: ${raw.type}` }] }
      }

      const packId = raw.id
      const destDir = join(packsDir, packId)

      // Copy pack directory
      if (!existsSync(packsDir)) mkdirSync(packsDir, { recursive: true })
      if (existsSync(destDir)) {
        return { success: false, packId, errors: [{ field: 'id', message: `A pack with id "${packId}" already exists` }] }
      }

      cpSync(sourcePath, destDir, { recursive: true })

      // Register the pack
      if (raw.type === 'character') {
        this.characterPacks.set(packId, this.buildCharacterPack(raw as CharacterPackManifest, destDir))
      } else {
        this.actionPacks.set(packId, this.buildActionPack(raw as ActionPackManifest, destDir))
      }

      return { success: true, packId }
    } catch (err) {
      return { success: false, errors: [{ field: 'import', message: String(err) }] }
    }
  }

  /**
   * Export a known pack to destinationPath.
   * For factory-based packs that are not on disk, this creates the pack structure
   * from the in-memory registry data.
   */
  exportPack(packId: string, kind: 'character' | 'action', destinationPath: string): PackImportResult {
    try {
      if (kind === 'character') {
        const pack = this.characterPacks.get(packId)
        if (!pack) return { success: false, errors: [{ field: 'id', message: `Character pack "${packId}" not found` }] }

        if (!existsSync(destinationPath)) mkdirSync(destinationPath, { recursive: true })

        // Write manifest
        writeFileSync(join(destinationPath, 'manifest.json'), JSON.stringify(pack.manifest, null, 2))

        // For file-backed packs, copy actual files
        if (existsSync(pack.rootPath)) {
          cpSync(pack.rootPath, destinationPath, { recursive: true })
        } else {
          // For factory-only packs, just create structure with manifest
          for (const res of pack.manifest.resolutions) {
            mkdirSync(join(destinationPath, 'parts', String(res)), { recursive: true })
          }
          mkdirSync(join(destinationPath, 'palettes'), { recursive: true })
        }
      } else {
        const pack = this.actionPacks.get(packId)
        if (!pack) return { success: false, errors: [{ field: 'id', message: `Action pack "${packId}" not found` }] }

        if (!existsSync(destinationPath)) mkdirSync(destinationPath, { recursive: true })
        writeFileSync(join(destinationPath, 'manifest.json'), JSON.stringify(pack.manifest, null, 2))

        if (existsSync(pack.rootPath)) {
          cpSync(pack.rootPath, destinationPath, { recursive: true })
        } else {
          mkdirSync(join(destinationPath, 'poses'), { recursive: true })
          mkdirSync(join(destinationPath, 'overrides'), { recursive: true })
        }
      }

      return { success: true, packId }
    } catch (err) {
      return { success: false, errors: [{ field: 'export', message: String(err) }] }
    }
  }

  // ── Internal ──

  private buildCharacterPack(manifest: CharacterPackManifest, rootPath: string): CharacterPack {
    const parts: Record<string, string> = {}
    const expressionParts: Record<string, string> = {}
    const palettes: Record<string, string> = {}

    // Build part PNG paths for each resolution + layer
    for (const res of manifest.resolutions) {
      for (const layer of manifest.layers) {
        const key = `${res}/${layer.id}`
        const fullPath = join(rootPath, 'parts', String(res), `${layer.id}.png`)
        if (existsSync(fullPath)) {
          parts[key] = fullPath
        }
      }
    }

    // Expression parts
    const exprDir = join(rootPath, 'expression')
    if (existsSync(exprDir)) {
      this.scanDirFlat(exprDir).forEach(([relPath, fullPath]) => {
        expressionParts[relPath.replace(/\.png$/i, '')] = fullPath
      })
    }

    // Palette JSON files
    const paletteDir = join(rootPath, 'palettes')
    if (existsSync(paletteDir)) {
      this.scanDirFlat(paletteDir).forEach(([relPath, fullPath]) => {
        if (relPath.endsWith('.json')) {
          palettes[relPath.replace(/\.json$/i, '')] = fullPath
        }
      })
    }

    return {
      manifest,
      rootPath,
      parts,
      expressionParts,
      palettes,
    }
  }

  private buildActionPack(manifest: ActionPackManifest, rootPath: string): ActionPack {
    const poses: Record<number, string> = {}
    const overrides: Record<string, string> = {}

    // For MVP, all poses go in a single JSON file per resolution
    const posesDir = join(rootPath, 'poses')
    if (existsSync(posesDir)) {
      this.scanDirFlat(posesDir).forEach(([relPath, fullPath]) => {
        if (relPath.endsWith('.json')) {
          const resMatch = relPath.match(/^(\d+)/)
          if (resMatch) {
            poses[parseInt(resMatch[1])] = fullPath
          }
        }
      })
    }

    // Override spritesheets per character
    const overrideDir = join(rootPath, 'overrides')
    if (existsSync(overrideDir)) {
      this.scanDirFlat(overrideDir, true).forEach(([relPath, fullPath]) => {
        overrides[relPath] = fullPath
      })
    }

    return {
      manifest,
      rootPath,
      poses,
      overrides,
    }
  }

  /** Scan a directory (non-recursive by default) and return [relative_path, absolute_path] pairs */
  private scanDirFlat(dir: string, recursive = false): [string, string][] {
    const results: [string, string][] = []

    try {
      const entries = readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = join(dir, entry.name)
        if (entry.isFile()) {
          results.push([entry.name, fullPath])
        } else if (entry.isDirectory() && recursive) {
          const subEntries = readdirSync(fullPath, { withFileTypes: true })
          for (const sub of subEntries) {
            if (sub.isFile()) {
              const relPath = `${entry.name}/${sub.name}`
              results.push([relPath, join(fullPath, sub.name)])
            }
          }
        }
      }
    } catch {
      // Directory doesn't exist or can't be read — skip
    }

    return results
  }
}

/** Singleton instance shared across the main process */
export const packRegistry = new PackRegistry()
