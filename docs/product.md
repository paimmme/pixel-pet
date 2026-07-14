# PixelPet Product Document

## 1. Product Vision

PixelPet is a desktop pixel companion creation tool. Users can upload an image, generate a personalized pixel character, then generate or install action modules such as idle, walk, run, jump, wave, sleep, and custom gestures. Character and action modules should combine without manual redraw for every pairing.

Long-term goal:

```text
User image + AI character rig + AI action module -> personalized animated desktop pet
```

The product should feel like a creative tool and a living desktop companion, not a static sprite viewer.

## 2. Target Users

Primary users:

- Users who want a customized desktop pet based on themselves, friends, pets, game characters, mascots, or original characters.
- Pixel art fans who want AI-assisted creation instead of drawing every animation frame by hand.
- Creators who want reusable action packs and shareable character packs.

Secondary users:

- Developers who want a local-first Electron desktop pet demo.
- Designers who want quick animation prototypes.

## 3. Core Value

PixelPet should solve three hard problems:

1. Image-to-character: turn an uploaded image into a consistent pixel character.
2. Action modularity: generate action modules that can work across compatible characters.
3. Desktop companion behavior: make the character feel alive through idle behavior, reactions, movement, and context-aware actions.

The key product promise is not only "make a pixel image"; it is "make a reusable animated character system."

## 4. User Journey

### 4.1 Create Character

1. User uploads an image.
2. System extracts subject and suggests character type.
3. System generates a pixel character preview.
4. User chooses resolution, palette style, and key visual details.
5. System creates a character asset pack with layers, anchors, hit area, palette, and preview.

Success criteria:

- Generated character is recognizable from source image.
- Character keeps a clean silhouette at 32x32.
- Character has stable layers for head, body, arms, eyes, mouth, accessories, and shadow.
- Character can play at least idle and wave.

### 4.2 Generate Action Module

1. User selects an existing character.
2. User describes action, for example "run excitedly", "dance", "stretch", "sit and drink coffee".
3. System generates an action preview.
4. User can accept, regenerate, or adjust speed/loop/direction.
5. System saves the action as an action module.

Success criteria:

- Action module has normalized metadata: frame count, fps, loop, direction support, semantic category.
- Action can be reused by compatible characters.
- Only character-specific details are generated as override frames.

### 4.3 Use As Desktop Pet

1. User selects character and enabled actions.
2. Pet appears in transparent always-on-top desktop window.
3. Pet idles, walks, runs, reacts to click, follows cursor or screen points, and occasionally performs personality actions.
4. User can trigger actions from tray/context menu.

Success criteria:

- Pet does not block normal desktop use.
- Animation remains crisp.
- Pet state persists across restarts.
- Behavior feels alive but not distracting.

## 5. Product Principles

### 5.1 Character First

The first viewport and default experience should show the pet itself. Controls should support creation and use, not dominate the product.

### 5.2 Modular Assets Over One-Off Sprites

Full spritesheets are useful as export output, but internal source should stay modular:

```text
character rig + pose template + optional overrides + palette -> frames
```

This keeps AI generation scalable.

### 5.3 AI Output Must Be Editable

AI-generated characters and actions should be stored as explicit assets and JSON metadata. Users and tools should be able to inspect, fix, regenerate, or share them.

### 5.4 Desktop Behavior Matters

A good desktop pet needs more than animation. It needs:

- idle variation
- click reactions
- drag behavior
- screen-aware movement
- fatigue/rest pacing
- lightweight memory
- context-based action selection

## 6. Core Features

### 6.1 Character Generation

Required:

- Upload image.
- Generate 32x32 pixel character.
- Extract limited palette.
- Generate body part layers.
- Generate expression parts.
- Save character pack.

Later:

- 16x16 mode.
- Multiple style presets.
- Manual pixel editor.
- Multiple variants from same image.

### 6.2 Action Generation

Required:

- Generate idle, jump, and wave first.
- Generate walk after the selected rig supports locomotion anchors and direction metadata.
- Generate run after the action catalog and runtime define a `run` action.
- Generate custom action from prompt.
- Preview action before saving.
- Save action module with normalized metadata.

Later:

- 4-direction locomotion.
- Action chaining.
- Choreography presets.
- Community action packs.

### 6.3 Desktop Pet Runtime

Already available in current runtime:

- Transparent always-on-top window.
- Pixel-perfect canvas rendering.
- Drag movement.
- Click reactions.
- Tray/context actions.
- Local persistence.
- Settings panel.
- Expressions.
- Accessories.
- Auto-walk.
- Gesture and activity hooks.

Still required for pack-runtime MVP:

- Select file-backed character packs.
- Select file-backed action packs.
- Persist selected pack IDs.
- Show validation errors for invalid packs.

Later:

- Multiple pets.
- Pet-to-pet interaction.
- Cross-platform packaging polish.

### 6.4 Asset Library

Required:

- Character pack list.
- Action pack list.
- Import/export local packs.
- Preview thumbnails.

Later:

- Pack marketplace or folder sync.
- Versioned compatibility.
- Sharing links.

## 7. AI Product Flow

### 7.1 Image-To-Character Pipeline

```text
upload image
-> subject extraction
-> pixel style transfer
-> palette reduction
-> layer segmentation
-> rig anchor detection
-> base expressions
-> character pack validation
-> preview
```

### 7.2 Prompt-To-Action Pipeline

```text
action prompt
-> semantic action plan
-> pose timeline
-> frame transform JSON
-> optional layer override frames
-> action pack validation
-> preview
```

The action prompt should generate structured data first, images second. This makes modules reusable.

## 8. Product Decisions

These decisions set the planning baseline. They can change later through ADRs, but the initial roadmap should not treat them as open.

- AI strategy: hybrid, API-first for MVP research. Local model support is a later adapter, not the first runtime path.
- Privacy: generated packs are stored locally. Uploaded images are not kept by default after generation unless user explicitly saves source metadata.
- First target: pets, mascots, and stylized characters before realistic human likeness. 32x32 human recognition is a hard quality problem.
- Editing scope: v1 needs validation and regeneration controls first, not a full pixel editor.
- Sharing scope: local import/export first. Marketplace or public sharing is post-v1.

## 9. MVP Scope

MVP should prove modular pack runtime, not full AI generation. A credible first MVP is:

- Define character pack and action pack formats.
- Load at least one real file-backed character pack.
- Load at least one real file-backed action pack.
- Keep factory-generated assets as development fallback.
- Preview and run the file-backed pack in the desktop pet.
- Validate packs and show clear errors.
- Export/import local packs.

Not required for MVP:

- Image upload to generated character.
- Prompt-to-action generation.
- Marketplace.
- Full pixel editor.
- Multi-pet.
- Cloud accounts.
- Perfect 4-direction movement.

AI generation becomes the next product iteration after pack runtime is stable. This avoids building generation output before the app has a strict contract for accepting it.

## 10. Unified Roadmap

Use these phase names across product and technical docs.

### Phase 0: Current Runtime Stabilization

- Update documentation to match current code: 11 animals, 15 actions, 16/32 resolutions, expressions, accessories, skill system, gestures, activity detection, choreography, auto-walk, and settings panel.
- Fix cache and persistence bugs that affect generated variations.
- Keep README as historical MVP reference or rewrite it as current architecture overview.

### Phase 1: Pack Contract And Loader

- Define TypeScript types for character packs and action packs.
- Define JSON schema/runtime validators.
- Add file-backed pack loader with factory fallback.
- Add one hand-authored sample pack.

### Phase 2: Pack Library And Runtime Integration

- Add pack list, preview, import, export, and validation UI.
- Let desktop runtime select file-backed characters and actions.
- Persist selected pack IDs.

### Phase 3: AI Character Experimental Preview

- Add upload flow behind an experimental flag.
- Generate a 32x32 character pack candidate.
- Require validation before save.
- Expect multiple regenerations; this is not a guaranteed one-shot flow.

### Phase 4: AI Action Experimental Preview

- Generate action semantic plan first.
- Generate pose template JSON second.
- Generate override PNGs only when transforms are insufficient.
- Preview against selected character before save.
- Target idle, jump, and wave first; walk/run require locomotion-specific rig support and runtime action definitions.

### Phase 5: Desktop Companion Intelligence

- Build a behavior scheduler on existing action categories, phases, stamina cost, fatigue, activity detection, and skill records.
- Add idle variation, cooldowns, personality weights, and context triggers.

### Phase 6: Creator Tooling And Sharing

- Add manual correction tools.
- Add pack versioning and compatibility checks.
- Add local sharing workflow.
- Add quality scoring for generated packs.

## 11. Metrics

MVP metrics:

- Pack validation pass/fail rate.
- Time to import and run a sample pack.
- Number of validation errors per imported pack.
- Crash-free sessions while switching packs.
- Successful preview render rate.

AI research metrics:

- Regeneration count before accept.
- Character recognizability rating.
- Layer alignment failure rate.
- Palette consistency score.
- Frame jitter score.

Growth metrics:

- Daily active pet runtime.
- Actions triggered per session.
- User-retained generated packs.
- Action compatibility rate across characters.

Growth metrics should not block MVP; they require real users and multiple reusable packs.

## 12. AI Quality Expectations

AI output will be inconsistent until the pack contract and validators are strict. Product UX should present generation as draft creation plus validation, not guaranteed finished art.

Known quality constraints:

- 32x32 is enough for silhouettes and mascots, but weak for exact human likeness.
- Layer segmentation is harder than generating a flat sprite.
- Cross-character action reuse only works when rigs share layer IDs and anchors.
- Generated actions should prefer pose transforms over full spritesheets to remain reusable.
