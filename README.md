<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/paimmme/pixel-pet/main/test-results/e2e-smoke.png">
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/paimmme/pixel-pet/main/test-results/e2e-smoke.png">
  <img alt="PixelPet screenshot" src="test-results/e2e-smoke.png" width="480">
</picture>

<h1 align="center">PixelPet</h1>

<p align="center">
  <i>AI-powered pixel desktop pet — generate, customize, animate.</i>
  <br>
  <a href="#features">Features</a> · <a href="#quick-start">Quick Start</a> · <a href="#development">Development</a> · <a href="#architecture">Architecture</a>
</p>

<p align="center">
  <img alt="CI" src="https://github.com/paimmme/pixel-pet/actions/workflows/ci.yml/badge.svg">
  <img alt="Tests" src="https://img.shields.io/badge/tests-86%20passed-brightgreen">
  <img alt="Electron" src="https://img.shields.io/badge/Electron-43-blue">
  <img alt="License" src="https://img.shields.io/badge/license-MIT-blue">
</p>

---

## Overview

PixelPet is a desktop companion creator built with Electron. It generates pixel characters from images (via AI), assembles action animations, and lets them live on your desktop — responding to clicks, auto-walking, expressing moods, and reacting to your activity.

> **From image to animated pixel companion — no drawing required.**

---

## Features

### 🎨 AI Character Generation
Upload a reference image, describe the style, and PixelPet generates a full character pack: layered sprite parts (head, body, eyes, mouth, accessories), palette mappings, hit zones, and interaction zones.

### 🏃 AI Action Generation
Describe an action — "coffee sip", "excited jump", "ballet pirouette" — and PixelPet designs a frame-by-frame pixel animation with per-layer transforms and optional override frames.

### 🐾 11 Default Animals
Choose from raccoon, cat, fox, rabbit, panda, frog, penguin, mouse, bear, koala, and owl — each with 7-9 layers and 2 resolutions (16×16 and 32×32).

### 🎨 23+ Color Palettes
Every character supports palette swapping. The default set covers classic, monochrome, pastel, retro, and seasonal themes.

### 🧠 Intelligent Behavior
A behavior scheduler picks appropriate idle actions based on:
- **Fatigue** — rests when tired, plays actively when energetic
- **Activity** — coding triggers sit/sleep, gaming triggers jump/dance
- **Cooldowns** — per-category timing prevents repetitive animations

### 🖱️ Desktop Companion
- Click to interact (pet / wave)
- Click empty area → auto-walk
- Double-click → wave reaction
- Context menu with all actions
- Supports 11 preset reactions
- Expression system: blink, happy, surprised, sleepy + smile/open/pout mouth

### 🔌 Pack System
- **Import/Export** — share characters and actions as file-based packs
- **Editor** — browse layers, replace PNGs, edit palettes with live preview
- **Quality scoring** — AI-generated packs get auto-scored on completeness

### 🎨 Apple-Inspired UI
Bottom-sheet settings panel, frosted-glass overlays, spring animations, and full **Light/Dark mode** support.

### 🌐 i18n
Built-in Chinese/English localization with language toggle in settings. Easy to extend.

---

## Quick Start

### Download

Download the latest build from [Releases](https://github.com/paimmme/pixel-pet/releases).

- **macOS**: `PixelPet-0.1.0.dmg`
- **Windows**: `PixelPet Setup 0.1.0.exe`
- **Linux**: `PixelPet-0.1.0.AppImage`

### From Source

```bash
git clone https://github.com/paimmme/pixel-pet.git
cd pixel-pet
npm install
npm run build
npm run dev        # development mode
```

### AI Generation Setup

To use AI generation, set your Anthropic API key:

```bash
cp .env.example .env
# Edit .env and set ANTHROPIC_API_KEY=your_key_here
```

> The key is loaded at runtime from `process.env.ANTHROPIC_API_KEY`. The AI feature is optional — all default animals and actions work without it.

---

## Usage

### Character Selection

1. Open Settings (click the gear icon or right-click → Settings)
2. Choose an animal from the dropdown
3. Pick a palette
4. Toggle resolution between 16×16 and 32×32
5. Add accessories (hat, glasses)

### AI Character Generation

1. Open Settings → **AI 生成** section
2. Enter a text prompt (e.g., "a magical fox with star patterns")
3. Optionally select a reference image
4. Click **Generate from Image**
5. The new character appears in the pack list automatically

### AI Action Generation

1. Open Settings → **AI Action** section
2. Describe an action (e.g., "coffee sip", "happy dance")
3. Click **Generate Action**
4. When complete, right-click the pet and select the action from the context menu

### Equipping Actions for Context Menu

1. Open Settings → **Actions** section
2. Toggle the **Menu** checkbox on action packs you want visible
3. Right-click the pet to see equipped actions in the context menu

### Pack Management

- **Import**: Settings → Packs → **+ Import Pack** → select a pack directory
- **Edit**: Click **Edit** on a pack row → browse layers, replace PNGs, edit palettes
- **Remove**: Click **×** on a pack row
- **Show in Finder**: Click **Open Packs Folder**

---

## Development

### Prerequisites

- Node.js 20+
- npm

### Setup

```bash
npm install
npm run dev          # Launch dev mode with hot reload
```

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Electron dev mode |
| `npm run build` | Build all 3 environments (main, preload, renderer) |
| `npm test` | Run unit tests (vitest) |
| `npm run test:e2e` | Run E2E test (Playwright + Electron) |
| `npm run typecheck` | TypeScript type checking |
| `npm run lint:assets` | Validate asset catalog completeness |
| `npm run dist` | Package distributable via electron-builder |

### Project Structure

```
pixel-pet/
├── src/
│   ├── main/              # Electron main process
│   │   ├── index.ts           # App entry, window creation
│   │   ├── generation.ts      # AI character/action generation
│   │   ├── pack-registry.ts   # Pack file management
│   │   ├── pack-validators.ts # Zod schema validators
│   │   ├── ipc-handlers.ts    # IPC bridge handlers
│   │   ├── quality-score.ts   # Pack quality scoring
│   │   └── settings.ts        # Persistent state
│   ├── renderer/           # Renderer process (UI + engine)
│   │   ├── main.ts            # Engine coordinator, game loop
│   │   ├── assets/            # Catalog, locale, pack sources
│   │   ├── engine/            # Compositor, animation, palette, display
│   │   ├── state/             # State machine, behavior scheduler, stores
│   │   └── ui/                # Settings panel, context menu, editor, welcome screen
│   ├── preload/            # Electron preload (IPC bridge)
│   └── shared/             # Types shared between main + renderer
│       ├── app-types.ts        # Core domain types
│       ├── ipc-types.ts        # IPC channel definitions
│       └── pack-types.ts       # Pack data structures
├── resources/
│   └── dev-packs/          # Development sample packs (11 animals)
├── scripts/
│   ├── generate-sample-packs.mjs  # Generate dev pack assets
│   └── png-encoder.mjs            # Pure Node.js PNG writer
└── docs/
    ├── product.md                # Product requirements
    ├── technical-development.md  # Technical architecture + roadmap
    └── migration-test-factory.md # Pack migration plan
```

### Test Suite

```bash
npm test                          # 85 unit tests
npm run test:e2e                  # 1 E2E test (requires build)
```

Unit test coverage:

| File | Tests | Area |
|------|-------|------|
| `create-compose-cache-key.test.ts` | 12 | Cache key generation |
| `pack-validators.test.ts` | 25 | Zod schema + file validation |
| `settings.test.ts` | 4 | State persistence |
| `palette-swapper.test.ts` | 4 | Palette compilation |
| `behavior-scheduler.test.ts` | 17 | Cooldowns, fatigue, context triggers |
| E2E | 1 | Electron launch + canvas |

---

## Architecture

> Detailed architecture: [docs/technical-development.md](docs/technical-development.md)

### Rendering Pipeline

```
SelectionStore ──► ComposeConfig
                       │
                composeAnimation()
                       │
         ┌─────────────┼─────────────┐
     PackAssetSource  Factory  PaletteSwapper
         │                        │
     IPC read        ┌──── bitmap ───┘
       │             │
   main process  SpriteCompositor.drawFrame()
   file system   (OffscreenCanvas → DisplaySurface)
```

### State Machine

```
Idle ◄────► Acting
  │            │
  │            │  (animation-complete)
  ▼            │
Reacting ◄─────┤
  │            │
  └────► previousState (Idle / Acting)
```

### Pack Source Chain

```
AssetLoader.loadAnimalParts(id, packId?)
  ├── packId set → PackAssetSource (IPC → file system)
  └── packId null → Factory (test-factory.ts in-memory data)
```

---

## Screenshots

| Settings Panel | Welcome Screen | Pack Editor |
|:---:|:---:|:---:|
| ![Settings](test-results/e2e-smoke.png) | *(first launch)* | *(coming soon)* |

---

## Roadmap

See [docs/technical-development.md](docs/technical-development.md) for full roadmap.

Past phases:

- **Phase 0** — MVP validation and code quality
- **Phase 1** — Pack architecture and type reorganization
- **Phase 2** — Pack library with import/export/settings
- **Phase 3** — AI character generation
- **Phase 4** — Action pipeline and generation
- **Phase 5** — Desktop companion intelligence
- **Phase 6** — Creator tooling basics (scoring, versioning, sharing)
- **Phase 7** — Pack editor, action management, polish

---

## License

MIT

---

<p align="center">
  <sub>Built with Electron · TypeScript · Vitest · Playwright</sub>
</p>
