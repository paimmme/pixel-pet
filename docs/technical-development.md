# PixelPet Technical Development Document

## 1. Current State

The app is an Electron desktop pet using Canvas 2D. It already has:

- Transparent always-on-top desktop window.
- Renderer-side animation loop.
- State machine for idle, action, reaction, and dragging.
- Runtime frame composition from layers, pose templates, palettes, expressions, and accessories.
- Tray/context menu actions.
- Local state persistence.
- Generated test assets through `src/renderer/assets/test-factory.ts`.
- 11 cataloged animals.
- 15 cataloged actions, including rest, locomotion, interaction, and ballet/choreography actions.
- 16x16 and 32x32 rendering.
- Expression overlays, accessories, gesture detection, activity detection, auto-walk, settings panel, skill/fatigue tracking, and choreography presets.

Main gap: assets are not yet real user-generated packs. Current runtime can compose frames, but loading is tied to the large in-code `test-factory.ts`, which is currently the only asset source rather than a true fallback. AI generation needs explicit asset pack formats, validation, import/export, generation jobs, and a migration path that moves sample assets out of code.

## 2. Architecture Decisions

### 2.1 AI Execution Strategy

Initial strategy: hybrid architecture, API-first implementation.

- Use a provider interface for AI generation jobs.
- Start with cloud/API generation for research velocity.
- Keep generated assets local after job completion.
- Do not require WebGPU/local diffusion for MVP.
- Add local model providers later behind the same interface.
- Make cloud upload explicit in UI if source images leave the machine.

Reason: image-to-layered-pixel-rig generation is research-heavy. Locking the app to local inference first would add model packaging, GPU support, and performance risk before pack contracts are proven.

### 2.2 Product Scope Baseline

First MVP is pack-runtime MVP, not AI-generation MVP.

AI generation should only become product-facing after:

- Pack types exist.
- Pack validators reject malformed output.
- File-backed loader works.
- Runtime can preview and play hand-authored packs.

### 2.3 Documentation Phase Names

Use one phase model across docs:

- Phase 0: Current Runtime Stabilization
- Phase 1: Pack Contract And Loader
- Phase 2: Pack Library And Runtime Integration
- Phase 3: AI Character Experimental Preview
- Phase 4: AI Action Experimental Preview
- Phase 5: Desktop Companion Intelligence
- Phase 6: Creator Tooling And Sharing

## 3. Target Architecture

```text
Electron main process
  - window lifecycle
  - file dialogs
  - pack storage
  - local generation jobs
  - persistence

Preload
  - safe IPC bridge
  - pack/generation API

Renderer
  - pet runtime
  - asset preview
  - generation UI
  - animation playback

Asset system
  - character packs
  - action packs
  - validators
  - import/export

AI pipeline
  - image-to-character
  - prompt-to-action
  - validation
  - preview
```

## 4. Asset Pack Model

### 4.1 Character Pack

A character pack is the reusable identity of a pet. It should contain source-independent, runtime-ready assets.

Recommended layout:

```text
packs/characters/{characterId}/
  manifest.json
  preview.png
  parts/
    32/
      shadow.png
      body.png
      ears.png
      tail.png
      front_arm.png
      back_arm.png
      eyes.png
      mouth.png
      expr_eyes_blink0.png
      expr_eyes_happy.png
      expr_mouth_smile.png
    16/
      ...
  palettes/
    default.json
    alternate.json
  metadata/
    source.json
```

Minimal `manifest.json`:

```json
{
  "schemaVersion": 1,
  "id": "custom_001",
  "name": "Custom Character",
  "type": "character",
  "resolutions": [32],
  "defaultResolution": 32,
  "defaultPalette": "default",
  "layers": [
    { "id": "shadow", "zIndex": 0, "anchor": { "x": 0, "y": 0 }, "zone": "body", "optional": true },
    { "id": "body", "zIndex": 2, "anchor": { "x": 16, "y": 20 }, "zone": "body" },
    { "id": "ears", "zIndex": 3, "anchor": { "x": 16, "y": 8 }, "zone": "head" },
    { "id": "tail", "zIndex": 4, "anchor": { "x": 8, "y": 20 }, "zone": "tail" },
    { "id": "front_arm", "zIndex": 5, "anchor": { "x": 16, "y": 17 }, "zone": "body" },
    { "id": "eyes", "zIndex": 6, "anchor": { "x": 16, "y": 10 }, "zone": "head" },
    { "id": "mouth", "zIndex": 7, "anchor": { "x": 16, "y": 13 }, "zone": "head" }
  ],
  "hitArea": { "x": 6, "y": 6, "width": 20, "height": 24 },
  "zones": [
    { "id": "head", "anchor": { "x": 16, "y": 10 }, "radius": 6 },
    { "id": "body", "anchor": { "x": 16, "y": 21 }, "radius": 7 }
  ]
}
```

Core TypeScript interfaces should exist before schemas, loaders, or validators:

```ts
export interface CharacterPackManifest {
  schemaVersion: 1
  id: string
  name: string
  type: 'character'
  resolutions: PixelResolution[]
  defaultResolution: PixelResolution
  defaultPalette: string
  layers: LayerDef[]
  hitArea: Rect
  zones?: ZoneDef[]
}

export interface CharacterPack {
  manifest: CharacterPackManifest
  rootPath: string
  parts: Map<string, string>
  palettes: Map<string, string>
  previewPath?: string
}
```

### 4.2 Action Pack

An action pack describes movement. It should be reusable across compatible character rigs.

Recommended layout:

```text
packs/actions/{actionId}/
  manifest.json
  preview.gif
  poses/
    32.json
    16.json
  overrides/
    {characterId}/
      32/
        run_excited_front_arm.png
        run_excited_mouth.png
```

Override files use `{actionId}_{layerId}.png`. Each file is a horizontal spritesheet whose frame index matches pose `override.frame`. A pose override reference such as `{ "layer": "front_arm", "frame": 2 }` resolves to `overrides/{characterId}/{resolution}/{actionId}_front_arm.png`, frame 2.

Minimal `manifest.json`:

```json
{
  "schemaVersion": 1,
  "id": "run_excited",
  "name": "Excited Run",
  "type": "action",
  "category": "locomotion",
  "frameCount": 6,
  "fps": 10,
  "loop": true,
  "directions": ["left", "right"],
  "requiredLayers": ["body", "ears", "tail", "front_arm", "eyes", "mouth"],
  "phases": [
    { "name": "step_a", "phaseType": "execute", "startFrame": 0, "endFrame": 2 },
    { "name": "step_b", "phaseType": "execute", "startFrame": 3, "endFrame": 5 }
  ]
}
```

Pose file:

```json
{
  "action": "run_excited",
  "resolution": 32,
  "directions": {
    "right": [
      {
        "index": 0,
        "parts": {
          "body": { "dx": 0, "dy": 1 },
          "ears": { "dx": 1, "dy": 0, "rotation": 3 },
          "eyes": { "dx": 1, "dy": 0 },
          "mouth": { "dx": 1, "dy": 0 },
          "front_arm": { "dx": 2, "dy": 0, "rotation": -18 }
        }
      }
    ]
  }
}
```

Core TypeScript interfaces:

```ts
export interface ActionPackManifest {
  schemaVersion: 1
  id: string
  name: string
  type: 'action'
  category: string
  frameCount: number
  fps: number
  loop: boolean
  directions: Direction[] | null
  requiredLayers: string[]
  phases?: ActionPhase[]
}

export interface ActionPack {
  manifest: ActionPackManifest
  rootPath: string
  poses: Map<PixelResolution, string>
  overrides: Map<string, string>
  previewPath?: string
}
```

## 5. AI Generation Pipeline

AI generation is split into research previews, not one delivery milestone. The first implementation should be allowed to fail validation and ask for regeneration.

### 5.1 Image-To-Character

Pipeline:

```text
input image
-> normalize image
-> remove or simplify background
-> detect subject silhouette
-> generate 32x32 pixel base
-> reduce palette
-> split into layers
-> detect anchors and hit zones
-> generate expressions
-> validate pack
-> preview idle/wave
-> save pack
```

Implementation notes:

- Keep generation output as PNG plus JSON, not opaque binary.
- Use fixed canvas sizes first: 32x32 MVP, 16x16 later.
- Enforce transparent background.
- Restrict palette count, for example 8 to 16 colors.
- Use deterministic validation before accepting output.
- Treat upload-to-valid-layered-pack as a research track. It includes subject extraction, pixel style transfer, palette reduction, layer segmentation, anchor detection, expression generation, and validation repair.
- Start with pets/mascots/stylized characters before exact human likeness.

### 5.2 Prompt-To-Action

Pipeline:

```text
action prompt
-> action semantic plan
-> frame count/fps/loop/category
-> pose timeline JSON
-> optional override frames
-> compose preview against selected character
-> validate smoothness and bounds
-> save action pack
```

Structured action plan example:

```json
{
  "name": "Coffee Sip",
  "category": "interaction",
  "loop": false,
  "frames": 8,
  "phases": ["raise_cup", "sip", "lower_cup"],
  "needsOverrideFrames": ["front_arm", "mouth"],
  "notes": "Small head tilt, no full body movement."
}
```

The AI should generate pose templates first. Generate per-frame PNG overrides only when transforms cannot express the motion.

## 6. Runtime Composition

Current composition model should remain:

```text
Character layers + Action pose template + Palette + Expression + Accessories -> ImageBitmap frames
```

Required runtime changes:

1. Add file-backed pack loading beside factory loading.
2. Treat `test-factory` as current legacy source, then demote it to fallback/dev sample data after file-backed samples cover current runtime.
3. Pass `animalId` or `characterId` into pose loading.
4. Keep compose cache key synchronized with all visible `ComposeConfig` fields: animal, action, resolution, palette, direction, accessories, and expression.
5. Preserve `skillData` when patching saved state.
6. Add schema validation before loading user-generated packs.

### 6.1 Factory-To-File Loader Transition

Do not replace `test-factory` in one step. Use a source chain:

```text
AssetLoader
  -> FileBackedPackSource
  -> FactoryPackSource
```

Lookup order:

1. If selected character/action is a file-backed pack, load from `userData/packs`.
2. If selected ID exists only in current catalog/factory data, load from `test-factory`.
3. If both exist, file-backed pack wins.
4. Validation runs before a file-backed pack enters the registry.

This preserves current demos while allowing generated packs to land incrementally.

## 7. Storage

Recommended local storage:

```text
app.getPath("userData")/
  pet-state.json
  packs/
    characters/
    actions/
  generation-jobs/
    {jobId}.json
  cache/
    previews/
```

Do not store generated packs inside `resources/`; packaged app resources should be read-only. User-generated packs belong in `userData`.

## 8. IPC Surface

Add safe APIs to preload:

```ts
interface ElectronAPI {
  importCharacterPack(path: string): Promise<PackImportResult>
  importActionPack(path: string): Promise<PackImportResult>
  listCharacterPacks(): Promise<CharacterPackSummary[]>
  listActionPacks(): Promise<ActionPackSummary[]>
  getPackAssetUrl(packId: string, assetPath: string): Promise<string>
  createCharacterFromImage(input: CharacterGenerationInput): Promise<GenerationJob>
  createActionFromPrompt(input: ActionGenerationInput): Promise<GenerationJob>
  getGenerationJob(jobId: string): Promise<GenerationJob>
}
```

Renderer should never read arbitrary filesystem paths directly.

Implementation rule:

- Add new channel names to `IPC_CHANNELS` in `src/shared/ipc-types.ts`.
- Extend the existing `ElectronAPI` interface in the same file.
- Expose only those methods through `src/preload/index.ts`.
- Implement filesystem and generation work in main-process handlers.
- Keep renderer calls typed against `ElectronAPI`; do not pass raw absolute paths to renderer except as opaque pack IDs or app-managed asset URLs.

## 9. Validation

Character pack validation:

- `manifest.json` exists and matches schema.
- All required layers exist for each declared resolution.
- PNG dimensions match resolution.
- PNG background is transparent.
- Layer IDs are unique.
- `hitArea` is inside canvas.
- Anchors are inside or near canvas bounds.
- Palette JSON maps valid RGB values.

Action pack validation:

- Manifest exists and matches schema.
- Pose file exists for declared resolutions.
- Frame count matches pose frame count.
- Required layers are known.
- Transforms are within allowed movement bounds.
- Override frame sheets have expected dimensions.
- Looping actions have smooth first/last transition.

## 10. Generation Quality Gates

Before saving generated output:

- Compose idle preview successfully.
- Compose at least one reaction action successfully.
- No frame exceeds expected visible bounds.
- No missing required layer.
- Palette size remains under configured limit.
- Pixel image uses nearest-neighbor scaling.
- Cache key includes all visible variation inputs.

## 11. Development Phases

### Phase 0: Current Runtime Stabilization

Deliverables:

- Done: update README or mark it as historical MVP documentation.
- Done: fix compose cache key mismatch.
- Done: pass character ID into pose loading.
- Done: preserve `skillData` in existing `patchState`.
- Done: document current runtime features.

Acceptance:

- Existing catalog/factory runtime still works.
- Typecheck and build pass.

### Phase 1: Pack Contract And Loader

Deliverables:

- Done: `CharacterPack` and `ActionPack` TypeScript types in `src/shared/pack-types.ts`.
- Done: Runtime validators in `src/main/pack-validators.ts` (manifest shape + file existence).
- Done: File-backed pack loader (`src/main/pack-registry.ts`, scans `userData/packs/` on startup).
- Done: IPC bridge for pack listing, manifest retrieval, and raw asset reading.
- Done: Source chain in `AssetLoader` — tries `PackAssetSource` (IPC) first, factory fallback.
- Done: Dev sample pack generation script (`scripts/generate-sample-packs.mjs` → `resources/dev-packs/`).
- Done: Migration plan for splitting `test-factory.ts` (`docs/migration-test-factory.md`).
- Done: Existing runtime still plays idle/wave/walk.
- Done: Type reorganization — `Direction`, `LayerDef`, `ZoneDef`, `ActionPhase` moved to `shared/app-types.ts` for main process availability.

Acceptance:

- ✅ App can load a character pack from `userData`.
- ✅ App can load an action pack from `userData`.
- ✅ Factory assets remain as fallback, but normal runtime can use file-backed packs.
- ✅ `test-factory.ts` is no longer the only asset source.

### Phase 2: Pack Library And Runtime Integration

Deliverables:

- Done: Pack-aware character list in settings panel — merges factory + file-backed pack characters.
- Done: Action list helper (`mergeActions`) available for future UI.
- Done: Preview panel — settings panel shows imported packs with name, layer count, and remove button.
- Done: Import pack command — file dialog → validate → copy to `userData/packs/` → register.
- Done: Export pack command — save dialog → write manifest + pack files to chosen path.
- Done: Remove pack command — unregister from registry (files stay on disk).
- Done: Validation error display — red error box in settings panel with field-level messages.

Acceptance:

- ✅ User can open Settings → click "+ Import Pack" → navigate to a pack directory → see it appear in the list.
- ✅ Invalid packs show field-level errors in the settings panel.
- ✅ User can remove imported packs from the list.
- ✅ Typecheck and build pass.

### Phase 3: AI Character Experimental Preview

Deliverables:

- Done: Upload image flow — native file dialog with image filters, base64 transfer via IPC.
- Done: `GenerationProvider` interface (`src/shared/generation-types.ts`) and `ClaudeGenerationProvider` implementation (`src/main/generation.ts`).
- Done: Generation job management (`createJob`, `startGeneration`, polling, `saveCharacterResult`).
- Done: Progress tracking and status reporting through IPC.
- Done: Settings panel "AI Character" section with generate button, progress bar, and result/error display.
- Done: Save-only-after-validation — saves as file-backed pack and re-scans registry on completion.
- Done: `.env.example` with `ANTHROPIC_API_KEY` documentation.

Usage:

1. Set `ANTHROPIC_API_KEY` in `.env` (or export in shell).
2. Open Settings → AI Character → "Generate from Image".
3. Select a PNG/JPEG photo.
4. Claude generates an 8-layer pixel art character pack.
5. Result auto-saves as a file-backed pack and appears in the character list.

Acceptance:

- ✅ At least one supported input class (pet/mascot image via file dialog) can become a valid character pack through the Claude API pipeline.
- ✅ The saved pack composes frames without runtime exceptions (standard pack validation + pack-registry integration).
- ✅ The saved pack has required layers, transparent PNGs, valid anchors, and a valid hit area (generated by Claude + packed using standard types).
- ✅ Typecheck and build pass.

### Phase 4: AI Action Experimental Preview

Deliverables:

- Prompt input for action.
- Structured action semantic plan.
- Generated pose template.
- Optional override frames.
- Preview against selected character.
- Save only after validation passes.

Acceptance:

- User can generate a custom action candidate, validate it, save it, and trigger it from context menu.
- The saved action composes against the selected character without missing layers or out-of-bounds frames.

### Phase 5: Desktop Companion Intelligence

Current code already has the inputs for this phase: `ActionDef.category`, `phases`, `staminaCost`, skill levels, fatigue, activity detection, auto-walk, and choreography hooks. This phase connects those hooks through a scheduler instead of rebuilding them.

Deliverables:

- Behavior scheduler using existing `ActionDef.category`, `phases`, `staminaCost`, skill records, fatigue, activity detection, and choreography hooks.
- Cooldowns.
- Context triggers.
- Idle variation.
- Personality weights.

Acceptance:

- Pet chooses actions without feeling repetitive or distracting.

### Phase 6: Creator Tooling And Sharing

Deliverables:

- Manual correction tools.
- Pack versioning and compatibility checks.
- Local sharing workflow.
- Quality scoring for generated packs.

## 12. Known Technical Risks

- AI-generated layers may not align consistently.
- 32x32 resolution leaves little room for recognizable human characters.
- Cross-character action reuse depends on strict rig compatibility.
- Electron file access must stay behind IPC.
- Cache bugs can make generated variations appear stale.
- Pixel art quality may require manual correction tools.

## 13. Near-Term Fix List

These should happen before AI work:

1. Add regression coverage for `createComposeCacheKey`; it must stay synchronized with visible `ComposeConfig` fields, including accessories and expression.
2. Define `CharacterPack` and `ActionPack` TypeScript interfaces.
3. Define pack schemas or runtime validators from those interfaces.
4. Add file-backed pack loader with factory fallback.
5. Add pack validation command.
6. Add at least one real sample pack under a dev fixture directory.

## 14. Testing Strategy

Unit tests:

- Cache key generation.
- `patchState` preserves `skillData`.
- `composeAnimation` passes character ID to pose loading.
- Pack schema validation.
- Pose frame selection.
- Palette compilation.
- State patch persistence.

Integration tests:

- Load sample character pack.
- Load sample action pack.
- Compose idle/walk/run frames.
- Import invalid pack and report errors.

Manual verification:

- Transparent window.
- Drag behavior.
- Click reactions.
- Tray actions.
- Generated character preview.
- Generated action preview.

## 15. Done Definition For AI Experimental Preview

AI experimental preview is done when:

- User can upload an image.
- App can produce a valid 32x32 character pack for at least one constrained input class.
- User can generate one custom action candidate from prompt.
- Character and action can combine in runtime.
- Generated output persists after app restart.
- Invalid AI output is rejected with clear validation errors.
- Existing desktop pet behavior still works.
