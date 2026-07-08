import type { AnimalDef, LayerDef, PoseTemplate, PoseFrame, PartTransform, PaletteDef, RGB } from '../engine/types'

export interface TestAssets {
  parts: Map<string, ImageBitmap>
  poses: Map<string, PoseTemplate>
  overrides: Map<string, Map<number, ImageBitmap>>
  palettes: PaletteDef[]
}

// ===== SCALING HELPERS =====

function createScaled(
  drawFn: (ctx: OffscreenCanvasRenderingContext2D, s: number) => void,
  resolution: number,
  sourceResolution = 32
): ImageBitmap {
  if (resolution === sourceResolution) {
    const canvas = new OffscreenCanvas(resolution, resolution)
    const ctx = canvas.getContext('2d')!
    ctx.imageSmoothingEnabled = false
    ctx.clearRect(0, 0, resolution, resolution)
    drawFn(ctx, resolution)
    return canvas.transferToImageBitmap()
  }
  // Draw at source resolution, then scale down
  const src = new OffscreenCanvas(sourceResolution, sourceResolution)
  const srcCtx = src.getContext('2d')!
  srcCtx.imageSmoothingEnabled = false
  drawFn(srcCtx, sourceResolution)
  const canvas = new OffscreenCanvas(resolution, resolution)
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(src, 0, 0, resolution, resolution)
  return canvas.transferToImageBitmap()
}

function createScaledSpritesheet(
  frameCount: number,
  drawFrame: (ctx: OffscreenCanvasRenderingContext2D, s: number, frameIndex: number, totalFrames: number) => void,
  resolution: number,
  sourceResolution = 32
): Map<number, ImageBitmap> {
  const frames = new Map<number, ImageBitmap>()
  for (let i = 0; i < frameCount; i++) {
    frames.set(i, createScaled(
      (ctx, _s) => drawFrame(ctx, sourceResolution, i, frameCount),
      resolution,
      sourceResolution
    ))
  }
  return frames
}

// ===== RACCOON PART DRAWING FUNCTIONS =====

function drawRaccoonShadow(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = 'rgba(0,0,0,0.15)'
  ctx.beginPath()
  ctx.ellipse(s / 2, s - 3, s / 3, 3, 0, 0, Math.PI * 2)
  ctx.fill()
}

function drawRaccoonTail(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#8B7355'
  ctx.fillRect(2, 12, 8, 4)
  ctx.fillRect(1, 14, 4, 4)
  ctx.fillRect(0, 16, 3, 4)
}

function drawRaccoonBody(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#A0896C'
  ctx.fillRect(8, 12, 16, 14)
  ctx.fillStyle = '#C4B39D'
  ctx.fillRect(12, 16, 8, 8)
}

function drawRaccoonEars(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#6B5335'
  ctx.fillRect(9, 4, 6, 4)
  ctx.fillRect(17, 4, 6, 4)
  ctx.fillStyle = '#D4A574'
  ctx.fillRect(10, 5, 4, 3)
  ctx.fillRect(18, 5, 4, 3)
}

function drawRaccoonFrontArm(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#8B7355'
  ctx.fillRect(6, 18, 3, 8)
  ctx.fillRect(23, 18, 3, 8)
}

function drawRaccoonEyes(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(11, 10, 4, 4)
  ctx.fillRect(17, 10, 4, 4)
  ctx.fillStyle = '#000000'
  ctx.fillRect(13, 11, 2, 3)
  ctx.fillRect(19, 11, 2, 3)
}

function drawRaccoonMouth(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#000000'
  ctx.fillRect(15, 19, 2, 1)
}

// ===== RACCOON OVERRIDE DRAWING FUNCTIONS =====

function drawRaccoonWaveFrontArm(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  ctx.fillStyle = '#8B7355'
  // Arm raises up progressively
  const armRaise = Math.floor(frame * (6 / total))
  // Left arm
  ctx.fillRect(6, 18 - armRaise, 3, 8 + armRaise)
  // Right arm (slightly lower)
  ctx.fillRect(23, 18 - armRaise + 1, 3, 8 + armRaise - 1)
}

function drawRaccoonJumpBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  // Squat and stretch animation
  const t = frame / (total - 1) // 0→1
  const squash = 1 - 0.15 * Math.sin(t * Math.PI)
  const bodyHeight = Math.floor(14 * squash)
  const yOffset = Math.floor((14 - bodyHeight) / 2)

  ctx.fillStyle = '#A0896C'
  ctx.fillRect(8, 12 + yOffset, 16, bodyHeight)
  ctx.fillStyle = '#C4B39D'
  ctx.fillRect(12, 16 + yOffset, 8, bodyHeight - 4)
}

// ===== CAT PART DRAWING FUNCTIONS =====

function drawCatShadow(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = 'rgba(0,0,0,0.15)'
  ctx.beginPath()
  ctx.ellipse(s / 2, s - 3, s / 3, 3, 0, 0, Math.PI * 2)
  ctx.fill()
}

function drawCatTail(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#D4845A'
  ctx.fillRect(0, 8, 6, 3)
  ctx.fillRect(0, 6, 5, 2)
  ctx.fillRect(0, 5, 4, 1)
  ctx.fillRect(1, 4, 3, 1)
}

function drawCatBody(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#D4845A'
  ctx.fillRect(8, 14, 16, 12)
  ctx.fillStyle = '#F0C9A0'
  ctx.fillRect(12, 16, 8, 8)
  // tabby stripes
  ctx.fillStyle = '#B8653A'
  ctx.fillRect(10, 15, 2, 10)
  ctx.fillRect(16, 15, 2, 10)
  ctx.fillRect(22, 15, 2, 10)
}

function drawCatEars(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#D4845A'
  ctx.fillRect(8, 4, 5, 5)
  ctx.fillRect(19, 4, 5, 5)
  ctx.fillStyle = '#F0C9A0'
  ctx.fillRect(9, 5, 3, 3)
  ctx.fillRect(20, 5, 3, 3)
}

function drawCatFrontArm(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#D4845A'
  ctx.fillRect(6, 20, 3, 6)
  ctx.fillRect(23, 20, 3, 6)
}

function drawCatEyes(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(11, 11, 4, 4)
  ctx.fillRect(17, 11, 4, 4)
  ctx.fillStyle = '#2D8C2D'
  ctx.fillRect(13, 12, 2, 3)
  ctx.fillRect(19, 12, 2, 3)
  ctx.fillStyle = '#000000'
  ctx.fillRect(13, 12, 1, 2)
  ctx.fillRect(19, 12, 1, 2)
}

function drawCatMouth(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#FF9999'
  ctx.fillRect(15, 18, 2, 1)
  ctx.fillStyle = '#000000'
  ctx.fillRect(15, 19, 1, 1)
}

// ===== FOX PART DRAWING FUNCTIONS =====

function drawFoxShadow(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = 'rgba(0,0,0,0.15)'
  ctx.beginPath()
  ctx.ellipse(s / 2, s - 3, s / 3, 3, 0, 0, Math.PI * 2)
  ctx.fill()
}

function drawFoxTail(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#D46A3A'
  ctx.fillRect(1, 10, 10, 4)
  ctx.fillRect(0, 12, 8, 4)
  ctx.fillRect(0, 14, 6, 3)
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 16, 3, 2)
}

function drawFoxBody(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#D46A3A'
  ctx.fillRect(8, 12, 16, 14)
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(12, 16, 8, 8)
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(13, 12, 6, 4)
}

function drawFoxEars(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#D46A3A'
  ctx.fillRect(9, 3, 6, 5)
  ctx.fillRect(17, 3, 6, 5)
  ctx.fillStyle = '#FFD4A0'
  ctx.fillRect(10, 4, 4, 3)
  ctx.fillRect(18, 4, 4, 3)
  ctx.fillStyle = '#000000'
  ctx.fillRect(10, 4, 1, 2)
  ctx.fillRect(21, 4, 1, 2)
}

function drawFoxFrontArm(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#D46A3A'
  ctx.fillRect(6, 18, 3, 8)
  ctx.fillRect(23, 18, 3, 8)
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(6, 24, 3, 2)
  ctx.fillRect(23, 24, 3, 2)
}

function drawFoxEyes(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(12, 10, 3, 3)
  ctx.fillRect(17, 10, 3, 3)
  ctx.fillStyle = '#D4A020'
  ctx.fillRect(13, 11, 2, 2)
  ctx.fillRect(18, 11, 2, 2)
  ctx.fillStyle = '#000000'
  ctx.fillRect(13, 12, 1, 1)
  ctx.fillRect(18, 12, 1, 1)
}

function drawFoxMouth(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(14, 18, 4, 2)
  ctx.fillStyle = '#000000'
  ctx.fillRect(15, 18, 1, 1)
  ctx.fillRect(15, 19, 2, 1)
}

// ===== POSE DATA (resolution-independent transforms) =====

function createIdlePoses(): PoseTemplate {
  const frames: PoseFrame[] = [0, 1, 2, 3].map(i => ({
    index: i,
    parts: {
      body: { dy: i < 2 ? -1 : 1 },
      tail: { dx: i < 2 ? -1 : 1 },
      front_arm: {}
    }
  }))
  return { action: 'idle', resolution: 32, frames }
}

function createJumpPoses(): PoseTemplate {
  const frames: PoseFrame[] = [
    { index: 0, parts: { body: { dy: 3 }, front_arm: { dy: 2 } } },
    { index: 1, parts: { body: { override: { layer: 'body', frame: 0 } }, front_arm: { dy: 1 } } },
    { index: 2, parts: { body: { override: { layer: 'body', frame: 1 } }, front_arm: { dy: -1 }, tail: { rotation: -5 } } },
    { index: 3, parts: { body: { override: { layer: 'body', frame: 2 } }, front_arm: { dy: -2 }, tail: { rotation: -8 } } },
    { index: 4, parts: { body: { override: { layer: 'body', frame: 3 } }, front_arm: { dy: -1 }, tail: { rotation: -3 } } },
    { index: 5, parts: { body: { override: { layer: 'body', frame: 4 } }, front_arm: { dy: 0 } } }
  ]
  return { action: 'jump', resolution: 32, frames }
}

function createWavePoses(): PoseTemplate {
  const frames: PoseFrame[] = [
    { index: 0, parts: { front_arm: { override: { layer: 'front_arm', frame: 0 } } } },
    { index: 1, parts: { front_arm: { override: { layer: 'front_arm', frame: 1 } }, tail: { rotation: -3 } } },
    { index: 2, parts: { front_arm: { override: { layer: 'front_arm', frame: 2 } }, tail: { rotation: 3 } } },
    { index: 3, parts: { front_arm: { override: { layer: 'front_arm', frame: 3 } }, tail: { rotation: 0 } } }
  ]
  return { action: 'wave', resolution: 32, frames }
}

function createWalkPoses(): PoseTemplate {
  // 4 directions, 4 frames each
  // walk_down: front view, subtle bounce + arm swing
  // walk_left / walk_right: side-to-side sway
  // walk_up: back view (eyes hidden)
  return {
    action: 'walk',
    resolution: 32,
    frames: [
      { index: 0, parts: {} },
      { index: 1, parts: { body: { dy: -1 } } },
      { index: 2, parts: { body: { dy: 0 } } },
      { index: 3, parts: { body: { dy: -1 } } }
    ],
    directions: {
      down: [
        { index: 0, parts: { body: { dy: 0 }, front_arm: { dx: 1 } } },
        { index: 1, parts: { body: { dy: -1 }, front_arm: { dx: -1 } } },
        { index: 2, parts: { body: { dy: 0 }, front_arm: { dx: 1 } } },
        { index: 3, parts: { body: { dy: -1 }, front_arm: { dx: -1 } } }
      ],
      left: [
        { index: 0, parts: { body: { dx: 0, dy: 0 }, tail: { rotation: -5 } } },
        { index: 1, parts: { body: { dx: -1, dy: -1 }, tail: { rotation: 0 } } },
        { index: 2, parts: { body: { dx: 0, dy: 0 }, tail: { rotation: 5 } } },
        { index: 3, parts: { body: { dx: -1, dy: -1 }, tail: { rotation: 0 } } }
      ],
      right: [
        { index: 0, parts: { body: { dx: 0, dy: 0 }, tail: { rotation: 5 } } },
        { index: 1, parts: { body: { dx: 1, dy: -1 }, tail: { rotation: 0 } } },
        { index: 2, parts: { body: { dx: 0, dy: 0 }, tail: { rotation: -5 } } },
        { index: 3, parts: { body: { dx: 1, dy: -1 }, tail: { rotation: 0 } } }
      ],
      up: [
        { index: 0, parts: { body: { dy: 0 }, eyes: { visible: false }, mouth: { visible: false } } },
        { index: 1, parts: { body: { dy: -1 }, eyes: { visible: false }, mouth: { visible: false } } },
        { index: 2, parts: { body: { dy: 0 }, eyes: { visible: false }, mouth: { visible: false } } },
        { index: 3, parts: { body: { dy: -1 }, eyes: { visible: false }, mouth: { visible: false } } }
      ]
    }
  }
}

// ===== CAT OVERRIDE DRAWING FUNCTIONS =====

function drawCatWaveFrontArm(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  ctx.fillStyle = '#D4845A'
  const armRaise = Math.floor(frame * (6 / total))
  ctx.fillRect(6, 20 - armRaise, 3, 6 + armRaise)
  ctx.fillRect(23, 20 - armRaise + 1, 3, 6 + armRaise - 1)
}

function drawCatJumpBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const t = frame / (total - 1)
  const squash = 1 - 0.15 * Math.sin(t * Math.PI)
  const bodyHeight = Math.floor(14 * squash)
  const yOffset = Math.floor((14 - bodyHeight) / 2)

  ctx.fillStyle = '#D4845A'
  ctx.fillRect(8, 14 + yOffset, 16, bodyHeight)
  ctx.fillStyle = '#F0C9A0'
  ctx.fillRect(12, 16 + yOffset, 8, bodyHeight - 4)
  // tabby stripes
  ctx.fillStyle = '#B8653A'
  ctx.fillRect(10, 15 + yOffset, 2, bodyHeight - 2)
  ctx.fillRect(16, 15 + yOffset, 2, bodyHeight - 2)
  ctx.fillRect(22, 15 + yOffset, 2, bodyHeight - 2)
}

// ===== FOX OVERRIDE DRAWING FUNCTIONS =====

function drawFoxWaveFrontArm(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  ctx.fillStyle = '#D46A3A'
  const armRaise = Math.floor(frame * (6 / total))
  ctx.fillRect(6, 18 - armRaise, 3, 8 + armRaise)
  ctx.fillRect(23, 18 - armRaise + 1, 3, 8 + armRaise - 1)
}

function drawFoxJumpBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const t = frame / (total - 1)
  const squash = 1 - 0.15 * Math.sin(t * Math.PI)
  const bodyHeight = Math.floor(14 * squash)
  const yOffset = Math.floor((14 - bodyHeight) / 2)

  ctx.fillStyle = '#D46A3A'
  ctx.fillRect(8, 12 + yOffset, 16, bodyHeight)
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(12, 16 + yOffset, 8, bodyHeight - 4)
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(13, 12 + yOffset, 6, 4)
}

// ===== ACCESSORY DRAWING FUNCTIONS =====

function drawTopHat(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  const hatH = Math.floor(s * 0.4)    // ~13 at 32px
  const brimW = Math.floor(s * 0.5)   // ~16 at 32px
  const hatW = Math.floor(s * 0.375)  // ~12 at 32px
  const hatX = Math.floor((s - hatW) / 2)
  const brimY = Math.floor(s * 0.15)  // ~5 at 32px

  // Hat body
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(hatX, 0, hatW, hatH - 2)
  // Brim
  ctx.fillRect(hatX - 2, hatH - 3, hatW + 4, 3)
  // Red band
  ctx.fillStyle = '#cc3333'
  ctx.fillRect(hatX, hatH - 6, hatW, 2)
}

function drawGlasses(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  const eyeW = Math.floor(s * 0.19)   // ~6 at 32px
  const eyeH = Math.floor(s * 0.16)   // ~5 at 32px
  const eyeY = Math.floor(s * 0.28)   // ~9 at 32px
  const leftX = Math.floor(s * 0.25)  // ~8 at 32px
  const rightX = Math.floor(s * 0.47) // ~15 at 32px

  ctx.strokeStyle = '#444444'
  ctx.lineWidth = 1
  ctx.strokeRect(leftX, eyeY, eyeW, eyeH)
  ctx.strokeRect(rightX, eyeY, eyeW, eyeH)
  // Bridge
  ctx.fillStyle = '#444444'
  ctx.fillRect(leftX + eyeW, eyeY + Math.floor(eyeH / 2) - 1, rightX - leftX - eyeW, 2)
}

// ===== PALETTES =====

function createRaccoonPalette(): PaletteDef {
  return {
    id: 'raccoon',
    name: 'Default Raccoon',
    mappings: [
      { from: [160, 137, 108], to: [160, 137, 108] },    // body base (identity for default)
      { from: [139, 115, 85], to: [139, 115, 85] },       // dark fur
      { from: [196, 179, 157], to: [196, 179, 157] },     // belly
      { from: [107, 83, 53], to: [107, 83, 53] },         // ears dark
      { from: [212, 165, 116], to: [212, 165, 116] },     // ears inner
      { from: [92, 64, 51], to: [92, 64, 51] }            // feet
    ]
  }
}

function createRaccoonSnowPalette(): PaletteDef {
  return {
    id: 'raccoon_snow',
    name: 'Snow Raccoon',
    mappings: [
      { from: [160, 137, 108], to: [200, 200, 200] },    // body → light gray
      { from: [139, 115, 85], to: [180, 180, 180] },      // dark fur → medium gray
      { from: [196, 179, 157], to: [230, 230, 230] },     // belly → off white
      { from: [107, 83, 53], to: [160, 160, 160] },       // ears dark → gray
      { from: [212, 165, 116], to: [240, 220, 200] },     // ears inner → cream
      { from: [92, 64, 51], to: [120, 120, 120] }          // feet → dark gray
    ]
  }
}

function createCatPalette(): PaletteDef {
  return {
    id: 'cat',
    name: 'Tabby Cat',
    mappings: [
      { from: [212, 132, 90], to: [212, 132, 90] },       // body → orange (identity)
      { from: [240, 201, 160], to: [240, 201, 160] },     // belly/light (identity)
      { from: [184, 101, 58], to: [184, 101, 58] },       // stripes (identity)
      { from: [45, 140, 45], to: [45, 140, 45] },         // eyes green (identity)
      { from: [255, 153, 153], to: [255, 153, 153] },     // nose pink (identity)
      { from: [0, 0, 0], to: [0, 0, 0] }                  // pupils black (identity)
    ]
  }
}

function createCatCalicoPalette(): PaletteDef {
  return {
    id: 'cat_calico',
    name: 'Calico Cat',
    mappings: [
      { from: [212, 132, 90], to: [240, 200, 200] },      // body → white/cream
      { from: [184, 101, 58], to: [200, 120, 120] },      // stripes → calico orange patches
      { from: [240, 201, 160], to: [255, 220, 220] },     // belly → white
      { from: [45, 140, 45], to: [60, 180, 60] },         // eyes green
      { from: [255, 153, 153], to: [255, 150, 150] },     // nose pink
      { from: [0, 0, 0], to: [0, 0, 0] }                  // black (identity)
    ]
  }
}

function createFoxPalette(): PaletteDef {
  return {
    id: 'fox',
    name: 'Red Fox',
    mappings: [
      { from: [212, 106, 58], to: [212, 106, 58] },       // body red (identity)
      { from: [255, 255, 255], to: [255, 255, 255] },     // white (identity)
      { from: [212, 160, 32], to: [212, 160, 32] },       // eyes amber (identity)
      { from: [0, 0, 0], to: [0, 0, 0] }                  // black (identity)
    ]
  }
}

function createFoxArcticPalette(): PaletteDef {
  return {
    id: 'fox_arctic',
    name: 'Arctic Fox',
    mappings: [
      { from: [212, 106, 58], to: [230, 230, 230] },      // body → white
      { from: [255, 255, 255], to: [255, 255, 255] },     // white stays white
      { from: [212, 160, 32], to: [100, 180, 220] },      // eyes → ice blue
      { from: [0, 0, 0], to: [60, 60, 60] }               // black → dark gray
    ]
  }
}

// ===== FACTORIES =====

function createRaccoonAssets(resolution: number): TestAssets {
  const parts = new Map<string, ImageBitmap>()
  parts.set('shadow', createScaled(drawRaccoonShadow, resolution))
  parts.set('tail', createScaled(drawRaccoonTail, resolution))
  parts.set('body', createScaled(drawRaccoonBody, resolution))
  parts.set('ears', createScaled(drawRaccoonEars, resolution))
  parts.set('front_arm', createScaled(drawRaccoonFrontArm, resolution))
  parts.set('eyes', createScaled(drawRaccoonEyes, resolution))
  parts.set('mouth', createScaled(drawRaccoonMouth, resolution))
  parts.set('accessory_hat', createScaled(drawTopHat, resolution))
  parts.set('accessory_glasses', createScaled(drawGlasses, resolution))

  const poses = new Map<string, PoseTemplate>()
  poses.set('idle', createIdlePoses())
  poses.set('jump', createJumpPoses())
  poses.set('wave', createWavePoses())
  poses.set('walk', createWalkPoses())

  const overrides = new Map<string, Map<number, ImageBitmap>>()
  overrides.set('wave_front_arm', createScaledSpritesheet(4, drawRaccoonWaveFrontArm, resolution))
  overrides.set('jump_body', createScaledSpritesheet(5, drawRaccoonJumpBody, resolution))

  const palettes: PaletteDef[] = [
    createRaccoonPalette(),
    createRaccoonSnowPalette()
  ]

  return { parts, poses, overrides, palettes }
}

function createCatAssets(resolution: number): TestAssets {
  const parts = new Map<string, ImageBitmap>()
  parts.set('shadow', createScaled(drawCatShadow, resolution))
  parts.set('tail', createScaled(drawCatTail, resolution))
  parts.set('body', createScaled(drawCatBody, resolution))
  parts.set('ears', createScaled(drawCatEars, resolution))
  parts.set('front_arm', createScaled(drawCatFrontArm, resolution))
  parts.set('eyes', createScaled(drawCatEyes, resolution))
  parts.set('mouth', createScaled(drawCatMouth, resolution))
  parts.set('accessory_hat', createScaled(drawTopHat, resolution))
  parts.set('accessory_glasses', createScaled(drawGlasses, resolution))

  const poses = new Map<string, PoseTemplate>()
  poses.set('idle', createIdlePoses())
  poses.set('jump', createJumpPoses())
  poses.set('wave', createWavePoses())
  poses.set('walk', createWalkPoses())

  const overrides = new Map<string, Map<number, ImageBitmap>>()
  overrides.set('wave_front_arm', createScaledSpritesheet(4, drawCatWaveFrontArm, resolution))
  overrides.set('jump_body', createScaledSpritesheet(5, drawCatJumpBody, resolution))

  const palettes: PaletteDef[] = [
    createCatPalette(),
    createCatCalicoPalette()
  ]

  return { parts, poses, overrides, palettes }
}

function createFoxAssets(resolution: number): TestAssets {
  const parts = new Map<string, ImageBitmap>()
  parts.set('shadow', createScaled(drawFoxShadow, resolution))
  parts.set('tail', createScaled(drawFoxTail, resolution))
  parts.set('body', createScaled(drawFoxBody, resolution))
  parts.set('ears', createScaled(drawFoxEars, resolution))
  parts.set('front_arm', createScaled(drawFoxFrontArm, resolution))
  parts.set('eyes', createScaled(drawFoxEyes, resolution))
  parts.set('mouth', createScaled(drawFoxMouth, resolution))
  parts.set('accessory_hat', createScaled(drawTopHat, resolution))
  parts.set('accessory_glasses', createScaled(drawGlasses, resolution))

  const poses = new Map<string, PoseTemplate>()
  poses.set('idle', createIdlePoses())
  poses.set('jump', createJumpPoses())
  poses.set('wave', createWavePoses())
  poses.set('walk', createWalkPoses())

  const overrides = new Map<string, Map<number, ImageBitmap>>()
  overrides.set('wave_front_arm', createScaledSpritesheet(4, drawFoxWaveFrontArm, resolution))
  overrides.set('jump_body', createScaledSpritesheet(5, drawFoxJumpBody, resolution))

  const palettes: PaletteDef[] = [
    createFoxPalette(),
    createFoxArcticPalette()
  ]

  return { parts, poses, overrides, palettes }
}

// ===== ANIMAL FACTORIES LOOKUP =====

export const ANIMAL_FACTORIES: Record<string, (resolution: number) => TestAssets> = {
  raccoon: createRaccoonAssets,
  cat: createCatAssets,
  fox: createFoxAssets
}

// ===== LEGACY EXPORT (kept for backward compatibility) =====

export function createTestAssets(): TestAssets {
  return createRaccoonAssets(32)
}
