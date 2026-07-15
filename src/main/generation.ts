import { randomUUID } from 'crypto'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import type {
  GenerationProvider,
  CharacterGenerationInput,
  CharacterGenerationResult,
  ActionGenerationInput,
  ActionGenerationResult,
  GenerationJob,
  GenerationInput,
} from '../shared/generation-types'
import type { ActionPackManifest, CharacterPackManifest } from '../shared/pack-types'
import type { ActionPhase, Direction, ActionPhaseType } from '../shared/app-types'

// ──────────────────────────────────────
// In-memory job store
// ──────────────────────────────────────

const jobs = new Map<string, GenerationJob>()

export function getJob(id: string): GenerationJob | undefined {
  return jobs.get(id)
}

export function listJobs(): GenerationJob[] {
  return Array.from(jobs.values())
}

export function createJob(type: 'character' | 'action', input: GenerationInput): string {
  const id = `gen_${randomUUID().slice(0, 8)}`
  const job: GenerationJob = {
    id,
    type,
    status: 'queued',
    progress: 0,
    input,
    result: null,
    createdAt: Date.now(),
  }
  jobs.set(id, job)
  return id
}

function updateJob(id: string, partial: Partial<GenerationJob>): void {
  const job = jobs.get(id)
  if (job) Object.assign(job, partial)
}

// ──────────────────────────────────────
// Claude API provider
// ──────────────────────────────────────

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'

/**
 * Claude Generation Provider.
 * Uses the Anthropic Messages API with tool use to generate pixel art character packs.
 */
export class ClaudeGenerationProvider implements GenerationProvider {
  name = 'Claude AI'

  constructor(private apiKey: string) {}

  isAvailable(): boolean {
    return !!this.apiKey
  }

  async generateCharacter(input: CharacterGenerationInput, onProgress?: (pct: number) => void): Promise<CharacterGenerationResult> {
    onProgress?.(10)

    const resolution = input.resolution ?? 32
    const maxColors = input.maxPaletteColors ?? 16

    // Determine the layers to generate
    const layerDefs = [
      { id: 'shadow', name: 'Shadow', zIndex: 0 },
      { id: 'tail', name: 'Tail', zIndex: 1 },
      { id: 'back_arm', name: 'Back Arm', zIndex: 2 },
      { id: 'body', name: 'Body', zIndex: 3 },
      { id: 'ears', name: 'Ears', zIndex: 4 },
      { id: 'front_arm', name: 'Front Arm', zIndex: 5 },
      { id: 'eyes', name: 'Eyes', zIndex: 6 },
      { id: 'mouth', name: 'Mouth', zIndex: 7 },
    ]

    onProgress?.(20)

    // Build structured prompt for Claude
    const systemPrompt = `You are a pixel art generator for a desktop pet application called PixelPet.

Your task: Given a user-submitted image, design a ${resolution}x${resolution} pixel art character that captures the essence of the subject.

Output requirements:
1. Generate ONE base64-encoded PNG per layer (${resolution}x${resolution} pixels, transparent background).
2. Layers must be: ${layerDefs.map(l => `${l.id} (zIndex:${l.zIndex})`).join(', ')}.
3. Use a maximum of ${maxColors} colors across ALL layers combined.
4. Each PNG must have a transparent background (alpha channel).
5. The "shadow" layer should be a subtle drop shadow on the ground.
6. The "eyes" and "mouth" layers must be positioned to align with the body.
7. All layers should align so they compose into a coherent character centered in the ${resolution}x${resolution} canvas.

Return ONLY valid JSON matching this exact schema:
{
  "layerPngs": {
    "shadow": "<base64 PNG data>",
    "tail": "<base64 PNG data>",
    "back_arm": "<base64 PNG data>",
    "body": "<base64 PNG data>",
    "ears": "<base64 PNG data>",
    "front_arm": "<base64 PNG data>",
    "eyes": "<base64 PNG data>",
    "mouth": "<base64 PNG data>"
  },
  "palette": {
    "colors": [[r,g,b], ...],
    "primaryColor": [r,g,b]
  },
  "hitArea": { "x": number, "y": number, "width": number, "height": number }
}`

    onProgress?.(30)

    try {
      const response = await fetch(ANTHROPIC_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 8192,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: input.imageMimeType,
                    data: input.imageData,
                  },
                },
                {
                  type: 'text',
                  text: `Generate a ${resolution}x${resolution} pixel art character from this image. Create all 8 layer PNGs with transparent backgrounds. Keep palette under ${maxColors} colors total.`,
                },
              ],
            },
          ],
        }),
      })

      onProgress?.(60)

      if (!response.ok) {
        const errText = await response.text()
        throw new Error(`Claude API error ${response.status}: ${errText}`)
      }

      const data = await response.json()
      onProgress?.(70)

      // Extract JSON from Claude's response
      const content = data.content?.[0]?.text
      if (!content) throw new Error('No content in Claude response')

      // Parse JSON from response (it may be wrapped in markdown code blocks)
      const jsonMatch = content.match(/```(?:json)?\s*({[\s\S]*?})\s*```/) || content.match(/{[\s\S]*?}/)
      if (!jsonMatch) throw new Error('Could not parse JSON from Claude response')

      const parsed = JSON.parse(jsonMatch[1] ?? jsonMatch[0])
      onProgress?.(80)

      if (!parsed.layerPngs || typeof parsed.layerPngs !== 'object') {
        throw new Error('Claude response missing layerPngs')
      }

      // Build the result
      const layers: Record<string, string> = {}
      for (const layer of layerDefs) {
        const pngData = parsed.layerPngs[layer.id]
        if (pngData && typeof pngData === 'string') {
          layers[`${resolution}/${layer.id}`] = pngData.startsWith('data:') ? pngData.split(',')[1] : pngData
        }
      }

      if (Object.keys(layers).length === 0) {
        throw new Error('No valid layer PNGs generated')
      }

      onProgress?.(90)

      const result: CharacterGenerationResult = {
        packId: `ai_${randomUUID().slice(0, 8)}`,
        packName: 'AI Character',
        layers,
        layersOrder: layerDefs,
        palettes: [
          {
            id: 'default',
            name: 'Default',
            mappings: [],
          },
        ],
      }

      onProgress?.(100)
      return result
    } catch (err) {
      throw new Error(`Generation failed: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  async generateAction(input: ActionGenerationInput, onProgress?: (pct: number) => void): Promise<ActionGenerationResult> {
    onProgress?.(10)

    const resolution = input.resolution ?? 32
    const packId = `act_${randomUUID().slice(0, 8)}`

    const systemPrompt = `You are a pixel art animation designer for a desktop pet application called PixelPet.

Your task: Given a user's action prompt, design a ${resolution}x${resolution} pixel art animation sequence (pose template).

The pet character has these layers: shadow, tail, back_arm, body, ears, front_arm, eyes, mouth.
Each layer is a ${resolution}x${resolution} transparent PNG. Layers are composed top-to-bottom by zIndex.

Output requirements:
1. Generate a structured action plan (name, category, loop, frameCount, fps, directions, phases).
2. Generate pose JSON for EVERY frame: each frame has per-layer transforms { dx, dy, rotation }.
3. dx/dy are pixel offsets from the idle position (typically -${resolution/4} to ${resolution/4} pixels).
4. rotation is in degrees (typically -30 to 30 degrees for subtle tilts).
5. "directions" tells which orientations the pet faces: null means symmetrical (mirrored), ["left","right"] means distinct left/right poses.
6. For layers that cannot express the motion via transforms alone (e.g. open mouth, closed eye), set "overrideLayer": true in the frame's part entry and also generate a base64 PNG for that specific frame+layer.
7. All positions should keep the character centered in the ${resolution}x${resolution} canvas.

Return ONLY valid JSON matching this exact schema:
{
  "plan": {
    "name": "Action Name",
    "category": "rest | locomotion | interaction | ballet | choreography | custom",
    "loop": false,
    "frameCount": 4,
    "fps": 8,
    "directions": null,
    "phases": ["ready", "action", "recover"],
    "needsOverrideFrames": [],
    "notes": "Brief description of the motion"
  },
  "poses": {
    "32": {
      "action": "action_id",
      "resolution": 32,
      "directions": {
        "left": [
          { "index": 0, "parts": { "body": { "dx": 0, "dy": 0 }, "eyes": { "dx": 0, "dy": -1 }, ... } },
          { "index": 1, "parts": { "body": { "dx": 1, "dy": -1 }, "eyes": { "dx": 0, "dy": -2, "rotation": 5 }, ... } }
        ],
        "right": [...]
      }
    }
  },
  "overridePngs": {
    "32/mouth_1": "<base64 PNG>",
    "32/eyes_2": "<base64 PNG>"
  }
}`

    onProgress?.(20)

    try {
      const response = await fetch(ANTHROPIC_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 8192,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Design a pixel art animation for a desktop pet. Prompt: "${input.prompt}"

Generate ${resolution}x${resolution} pose template. Include a semantic plan and per-frame transforms for each direction. Use override PNGs only for frames where transforms are insufficient.

The animation should be ${resolution}x${resolution} pixels per frame. Keep all limbs in bounds. Use smooth motion between frames.`,
                },
              ],
            },
          ],
        }),
      })

      onProgress?.(60)

      if (!response.ok) {
        const errText = await response.text()
        throw new Error(`Claude API error ${response.status}: ${errText}`)
      }

      const data = await response.json()
      onProgress?.(70)

      const content = data.content?.[0]?.text
      if (!content) throw new Error('No content in Claude response')

      const jsonMatch = content.match(/```(?:json)?\s*({[\s\S]*?})\s*```/) || content.match(/{[\s\S]*?}/)
      if (!jsonMatch) throw new Error('Could not parse JSON from Claude response')

      const parsed = JSON.parse(jsonMatch[1] ?? jsonMatch[0])
      onProgress?.(80)

      if (!parsed.plan || !parsed.poses) {
        throw new Error('Claude response missing plan or poses')
      }

      // Sanitize the action ID from the prompt
      const actionId = input.prompt
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '')
        .slice(0, 32) || `action_${packId.slice(4)}`

      onProgress?.(90)

      const result: ActionGenerationResult = {
        packId,
        packName: parsed.plan.name || input.prompt,
        plan: {
          name: parsed.plan.name || input.prompt,
          category: parsed.plan.category || 'custom',
          loop: !!parsed.plan.loop,
          frameCount: parsed.plan.frameCount || 4,
          fps: parsed.plan.fps || 8,
          directions: parsed.plan.directions ?? null,
          phases: Array.isArray(parsed.plan.phases) ? parsed.plan.phases : [],
          needsOverrideFrames: Array.isArray(parsed.plan.needsOverrideFrames) ? parsed.plan.needsOverrideFrames : [],
          notes: parsed.plan.notes || '',
        },
        poses: parsed.poses,
        overridePngs: parsed.overridePngs || undefined,
      }

      onProgress?.(100)
      return result
    } catch (err) {
      throw new Error(`Action generation failed: ${err instanceof Error ? err.message : String(err)}`)
    }
  }
}

// ──────────────────────────────────────
// Generation orchestrator
// ──────────────────────────────────────

export class GenerationService {
  private provider: GenerationProvider | null = null

  setProvider(provider: GenerationProvider): void {
    this.provider = provider
  }

  getProvider(): GenerationProvider | null {
    return this.provider
  }

  isReady(): boolean {
    return this.provider !== null && this.provider.isAvailable()
  }

  async startGeneration(jobId: string): Promise<void> {
    const job = jobs.get(jobId)
    if (!job || !job.input) return

    if (!this.provider || !this.provider.isAvailable()) {
      updateJob(jobId, { status: 'failed', error: 'No generation provider available' })
      return
    }

    updateJob(jobId, { status: 'running', progress: 0 })

    try {
      if (job.type === 'character') {
        const result = await this.provider.generateCharacter(job.input as CharacterGenerationInput, (pct) => {
          updateJob(jobId, { progress: pct })
        })
        updateJob(jobId, {
          status: 'completed',
          progress: 100,
          result,
          completedAt: Date.now(),
        })
      } else if (job.type === 'action') {
        const result = await this.provider.generateAction(job.input as ActionGenerationInput, (pct) => {
          updateJob(jobId, { progress: pct })
        })
        updateJob(jobId, {
          status: 'completed',
          progress: 100,
          result,
          completedAt: Date.now(),
        })
      }
    } catch (err) {
      updateJob(jobId, {
        status: 'failed',
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  /**
   * Save a completed character generation result as a file-backed character pack.
   */
  saveCharacterResult(jobId: string, packsDir: string): string | null {
    const job = jobs.get(jobId)
    if (!job || !job.result || job.type !== 'character') return null

    const result = job.result as CharacterGenerationResult
    const packDir = join(packsDir, result.packId)
    mkdirSync(packDir, { recursive: true })

    // Layout layers
    const layers = result.layersOrder.map((l) => ({
      id: l.id,
      name: l.name,
      zIndex: l.zIndex,
      anchor: { x: Math.floor(32 / 2), y: Math.floor(32 / 2) },
      zone: l.zIndex <= 1 ? 'body' as const : l.zIndex >= 6 ? 'head' as const : 'body' as const,
    }))

    const manifest: CharacterPackManifest = {
      schemaVersion: 1,
      id: result.packId,
      name: result.packName,
      type: 'character',
      resolutions: [32],
      defaultResolution: 32,
      defaultPalette: 'default',
      layers,
      hitArea: { x: 4, y: 4, width: 24, height: 24 },
    }

    writeFileSync(join(packDir, 'manifest.json'), JSON.stringify(manifest, null, 2))

    // Write PNG files
    for (const [key, pngBase64] of Object.entries(result.layers)) {
      const [res, layerId] = key.split('/')
      const layerDir = join(packDir, 'parts', res)
      mkdirSync(layerDir, { recursive: true })
      const pngBuffer = Buffer.from(pngBase64, 'base64')
      writeFileSync(join(layerDir, `${layerId}.png`), pngBuffer)
    }

    // Write palette
    const paletteDir = join(packDir, 'palettes')
    mkdirSync(paletteDir, { recursive: true })
    for (const pal of result.palettes) {
      writeFileSync(join(paletteDir, `${pal.id}.json`), JSON.stringify(pal, null, 2))
    }

    return result.packId
  }

  /**
   * Save a completed action generation result as a file-backed action pack.
   */
  saveActionResult(jobId: string, packsDir: string): string | null {
    const job = jobs.get(jobId)
    if (!job || !job.result || job.type !== 'action') return null

    const result = job.result as ActionGenerationResult
    const packDir = join(packsDir, result.packId)
    mkdirSync(packDir, { recursive: true })

    // Build manifest
    const phases: ActionPhase[] = result.plan.phases.map((name, i) => {
      const frameSpan = Math.floor(result.plan.frameCount / Math.max(result.plan.phases.length, 1))
      const phaseType: ActionPhaseType = i === 0 ? 'prepare' : i === result.plan.phases.length - 1 ? 'recover' : 'execute'
      return {
        name,
        phaseType,
        startFrame: i * frameSpan,
        endFrame: Math.min((i + 1) * frameSpan - 1, result.plan.frameCount - 1),
        staminaCostPerTick: 0,
        gracePotential: 0,
      }
    })

    // Convert direction string array from AI to Direction[] format
    const directions: Direction[] | null = result.plan.directions
      ? (Array.isArray(result.plan.directions) ? (result.plan.directions as string[])
        .filter((d): d is Direction => ['down', 'left', 'right', 'up'].includes(d))
      : [])
      : null

    const manifest: ActionPackManifest = {
      schemaVersion: 1,
      id: result.packId,
      name: result.packName,
      type: 'action',
      category: result.plan.category,
      frameCount: result.plan.frameCount,
      fps: result.plan.fps,
      loop: result.plan.loop,
      directions: directions && directions.length > 0 ? directions : null,
      requiredLayers: ['body', 'eyes', 'mouth', 'front_arm'],
      phases: phases.length > 0 ? phases : undefined,
    }

    writeFileSync(join(packDir, 'manifest.json'), JSON.stringify(manifest, null, 2))

    // Write pose files
    const posesDir = join(packDir, 'poses')
    mkdirSync(posesDir, { recursive: true })
    for (const [resKey, poseData] of Object.entries(result.poses)) {
      writeFileSync(join(posesDir, `${resKey}.json`), JSON.stringify(poseData, null, 2))
    }

    // Write override PNGs if any
    if (result.overridePngs) {
      const overridesDir = join(packDir, 'overrides')
      for (const [key, pngBase64] of Object.entries(result.overridePngs)) {
        const [res, layerFrame] = key.split('/')
        const overrideDir = join(overridesDir, res)
        mkdirSync(overrideDir, { recursive: true })
        const pngBuffer = Buffer.from(pngBase64, 'base64')
        writeFileSync(join(overrideDir, `${layerFrame}.png`), pngBuffer)
      }
    }

    return result.packId
  }
}

/** Singleton instance */
export const generationService = new GenerationService()
