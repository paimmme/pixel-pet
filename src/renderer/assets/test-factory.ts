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

// ===== RABBIT PART DRAWING FUNCTIONS =====

function drawRabbitShadow(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = 'rgba(0,0,0,0.15)'
  ctx.beginPath()
  ctx.ellipse(s / 2, s - 3, s / 3, 3, 0, 0, Math.PI * 2)
  ctx.fill()
}

function drawRabbitTail(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#F5F5F5'
  ctx.fillRect(2, 14, 5, 5)
  ctx.fillRect(1, 15, 4, 3)
}

function drawRabbitBody(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#C4A882'
  ctx.fillRect(8, 14, 16, 12)
  ctx.fillStyle = '#E8D5B7'
  ctx.fillRect(12, 16, 8, 8)
}

function drawRabbitEars(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#C4A882'
  ctx.fillRect(10, 2, 4, 8)
  ctx.fillRect(18, 2, 4, 8)
  ctx.fillStyle = '#F5F5F5'
  ctx.fillRect(11, 3, 2, 6)
  ctx.fillRect(19, 3, 2, 6)
}

function drawRabbitFrontArm(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#C4A882'
  ctx.fillRect(6, 18, 3, 8)
  ctx.fillRect(23, 18, 3, 8)
}

function drawRabbitEyes(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(11, 10, 3, 4)
  ctx.fillRect(18, 10, 3, 4)
  ctx.fillStyle = '#000000'
  ctx.fillRect(12, 11, 2, 3)
  ctx.fillRect(19, 11, 2, 3)
}

function drawRabbitMouth(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#FF69B4'
  ctx.fillRect(15, 18, 2, 1)
  ctx.fillStyle = '#000000'
  ctx.fillRect(15, 19, 2, 1)
}

// ===== RABBIT OVERRIDE DRAWING FUNCTIONS =====

function drawRabbitWaveFrontArm(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  ctx.fillStyle = '#C4A882'
  const armRaise = Math.floor(frame * (6 / total))
  ctx.fillRect(6, 18 - armRaise, 3, 8 + armRaise)
  ctx.fillRect(23, 18 - armRaise + 1, 3, 8 + armRaise - 1)
}

function drawRabbitJumpBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const t = frame / (total - 1)
  const squash = 1 - 0.15 * Math.sin(t * Math.PI)
  const bodyHeight = Math.floor(12 * squash)
  const yOffset = Math.floor((12 - bodyHeight) / 2)
  ctx.fillStyle = '#C4A882'
  ctx.fillRect(8, 14 + yOffset, 16, bodyHeight)
  ctx.fillStyle = '#E8D5B7'
  ctx.fillRect(12, 16 + yOffset, 8, bodyHeight - 4)
}

function drawRabbitEatMouth(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  if (frame === 0 || frame === 3) {
    ctx.fillStyle = '#FF69B4'
    ctx.fillRect(15, 19, 2, 1)
  } else {
    ctx.fillStyle = '#FF69B4'
    ctx.fillRect(14, 18, 4, 3)
    ctx.fillStyle = '#FF0000'
    ctx.fillRect(15, 19, 2, 1)
  }
}

function drawRabbitSurpriseEyes(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const size = 1 + Math.floor(frame * 2 / total)
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(10 - size, 10, 3 + 2 * size, 3 + size)
  ctx.fillRect(17 - size, 10, 3 + 2 * size, 3 + size)
  ctx.fillStyle = '#000000'
  ctx.fillRect(11, 11, 1 + size, 2 + size)
  ctx.fillRect(18, 11, 1 + size, 2 + size)
}

function drawRabbitDanceArms(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const armRaise = Math.floor(Math.abs(frame - total / 2) * 4 / total)
  ctx.fillStyle = '#C4A882'
  ctx.fillRect(6, 18 - armRaise, 3, 8 + armRaise)
  ctx.fillRect(23, 18 - armRaise, 3, 8 + armRaise)
}

// ===== PANDA PART DRAWING FUNCTIONS =====

function drawPandaShadow(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = 'rgba(0,0,0,0.15)'
  ctx.beginPath()
  ctx.ellipse(s / 2, s - 3, s / 3, 3, 0, 0, Math.PI * 2)
  ctx.fill()
}

function drawPandaTail(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(2, 16, 4, 3)
  ctx.fillRect(1, 17, 3, 2)
}

function drawPandaBody(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(8, 12, 16, 14)
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(8, 22, 4, 4)
  ctx.fillRect(20, 22, 4, 4)
}

function drawPandaEars(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(9, 4, 5, 4)
  ctx.fillRect(18, 4, 5, 4)
}

function drawPandaFrontArm(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(6, 18, 3, 8)
  ctx.fillRect(23, 18, 3, 8)
}

function drawPandaEyes(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(10, 10, 5, 5)
  ctx.fillRect(17, 10, 5, 5)
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(12, 11, 2, 3)
  ctx.fillRect(19, 11, 2, 3)
}

function drawPandaMouth(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(15, 18, 2, 2)
  ctx.fillRect(14, 19, 4, 1)
}

// ===== PANDA OVERRIDE DRAWING FUNCTIONS =====

function drawPandaWaveFrontArm(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  ctx.fillStyle = '#1a1a1a'
  const armRaise = Math.floor(frame * (6 / total))
  ctx.fillRect(6, 18 - armRaise, 3, 8 + armRaise)
  ctx.fillRect(23, 18 - armRaise + 1, 3, 8 + armRaise - 1)
}

function drawPandaJumpBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const t = frame / (total - 1)
  const squash = 1 - 0.15 * Math.sin(t * Math.PI)
  const bodyHeight = Math.floor(14 * squash)
  const yOffset = Math.floor((14 - bodyHeight) / 2)
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(8, 12 + yOffset, 16, bodyHeight)
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(8, 22 + yOffset, 4, 3)
  ctx.fillRect(20, 22 + yOffset, 4, 3)
}

function drawPandaEatMouth(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  if (frame === 0 || frame === 3) {
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(15, 19, 2, 1)
  } else {
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(14, 18, 4, 3)
    ctx.fillStyle = '#FF0000'
    ctx.fillRect(15, 19, 2, 1)
  }
}

function drawPandaSurpriseEyes(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const size = 1 + Math.floor(frame * 2 / total)
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(9 - size, 10, 5 + 2 * size, 5 + size)
  ctx.fillRect(16 - size, 10, 5 + 2 * size, 5 + size)
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(11, 11, 2 + size, 2 + size)
  ctx.fillRect(18, 11, 2 + size, 2 + size)
}

function drawPandaDanceArms(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const armRaise = Math.floor(Math.abs(frame - total / 2) * 4 / total)
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(6, 18 - armRaise, 3, 8 + armRaise)
  ctx.fillRect(23, 18 - armRaise, 3, 8 + armRaise)
}

// ===== FROG PART DRAWING FUNCTIONS =====

function drawFrogShadow(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = 'rgba(0,0,0,0.15)'
  ctx.beginPath()
  ctx.ellipse(s / 2, s - 3, s / 3, 3, 0, 0, Math.PI * 2)
  ctx.fill()
}

function drawFrogTail(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#4CAF50'
  ctx.fillRect(2, 20, 3, 2)
}

function drawFrogBody(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#4CAF50'
  ctx.fillRect(6, 14, 20, 14)
  ctx.fillStyle = '#C8E6C9'
  ctx.fillRect(12, 18, 8, 8)
  ctx.fillStyle = '#2E7D32'
  ctx.fillRect(8, 14, 2, 6)
  ctx.fillRect(22, 14, 2, 6)
}

function drawFrogEars(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#4CAF50'
  ctx.fillRect(10, 8, 5, 5)
  ctx.fillRect(17, 8, 5, 5)
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(11, 9, 3, 3)
  ctx.fillRect(18, 9, 3, 3)
  ctx.fillStyle = '#000000'
  ctx.fillRect(12, 10, 1, 2)
  ctx.fillRect(19, 10, 1, 2)
}

function drawFrogFrontArm(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#4CAF50'
  ctx.fillRect(4, 18, 3, 6)
  ctx.fillRect(25, 18, 3, 6)
  ctx.fillStyle = '#2E7D32'
  ctx.fillRect(4, 22, 3, 2)
  ctx.fillRect(25, 22, 3, 2)
}

function drawFrogEyes(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(11, 9, 3, 3)
  ctx.fillRect(18, 9, 3, 3)
  ctx.fillStyle = '#000000'
  ctx.fillRect(12, 10, 1, 2)
  ctx.fillRect(19, 10, 1, 2)
}

function drawFrogMouth(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#D32F2F'
  ctx.fillRect(12, 20, 8, 2)
  ctx.fillStyle = '#000000'
  ctx.fillRect(12, 21, 8, 1)
}

// ===== FROG OVERRIDE DRAWING FUNCTIONS =====

function drawFrogWaveFrontArm(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  ctx.fillStyle = '#4CAF50'
  const armRaise = Math.floor(frame * (6 / total))
  ctx.fillRect(4, 18 - armRaise, 3, 6 + armRaise)
  ctx.fillRect(25, 18 - armRaise + 1, 3, 6 + armRaise - 1)
}

function drawFrogJumpBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const t = frame / (total - 1)
  const squash = 1 - 0.15 * Math.sin(t * Math.PI)
  const bodyHeight = Math.floor(14 * squash)
  const yOffset = Math.floor((14 - bodyHeight) / 2)
  ctx.fillStyle = '#4CAF50'
  ctx.fillRect(6, 14 + yOffset, 20, bodyHeight)
  ctx.fillStyle = '#C8E6C9'
  ctx.fillRect(12, 18 + yOffset, 8, bodyHeight - 4)
}

function drawFrogEatMouth(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  if (frame === 0 || frame === 3) {
    ctx.fillStyle = '#000000'
    ctx.fillRect(14, 21, 4, 1)
  } else {
    ctx.fillStyle = '#D32F2F'
    ctx.fillRect(12, 20, 8, 4)
    ctx.fillStyle = '#FF0000'
    ctx.fillRect(13, 21, 6, 2)
  }
}

function drawFrogSurpriseEyes(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const size = 1 + Math.floor(frame * 2 / total)
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(10 - size, 8, 3 + 2 * size, 4 + size)
  ctx.fillRect(17 - size, 8, 3 + 2 * size, 4 + size)
  ctx.fillStyle = '#000000'
  ctx.fillRect(11, 9, 1 + size, 2 + size)
  ctx.fillRect(18, 9, 1 + size, 2 + size)
}

function drawFrogDanceArms(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const armRaise = Math.floor(Math.abs(frame - total / 2) * 4 / total)
  ctx.fillStyle = '#4CAF50'
  ctx.fillRect(4, 18 - armRaise, 3, 8 + armRaise)
  ctx.fillRect(25, 18 - armRaise, 3, 8 + armRaise)
}

// ===== PENGUIN PART DRAWING FUNCTIONS =====

function drawPenguinShadow(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = 'rgba(0,0,0,0.15)'
  ctx.beginPath()
  ctx.ellipse(s / 2, s - 3, s / 3, 3, 0, 0, Math.PI * 2)
  ctx.fill()
}

function drawPenguinTail(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(14, 26, 4, 2)
}

function drawPenguinBody(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(10, 10, 12, 18)
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(13, 12, 6, 14)
  ctx.fillStyle = '#FF9800'
  ctx.fillRect(14, 26, 2, 2)
  ctx.fillRect(18, 26, 2, 2)
}

function drawPenguinEars(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(11, 8, 2, 2)
  ctx.fillRect(19, 8, 2, 2)
}

function drawPenguinFrontArm(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(7, 16, 3, 8)
  ctx.fillRect(22, 16, 3, 8)
}

function drawPenguinEyes(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(13, 11, 3, 3)
  ctx.fillRect(17, 11, 3, 3)
  ctx.fillStyle = '#FF9800'
  ctx.fillRect(14, 12, 2, 2)
  ctx.fillRect(18, 12, 2, 2)
  ctx.fillStyle = '#000000'
  ctx.fillRect(14, 12, 1, 1)
  ctx.fillRect(18, 12, 1, 1)
}

function drawPenguinMouth(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#FF9800'
  ctx.fillRect(14, 14, 4, 2)
  ctx.fillRect(15, 13, 2, 1)
}

// ===== PENGUIN OVERRIDE DRAWING FUNCTIONS =====

function drawPenguinWaveFrontArm(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  ctx.fillStyle = '#1a1a1a'
  const armRaise = Math.floor(frame * (6 / total))
  ctx.fillRect(7, 16 - armRaise, 3, 8 + armRaise)
  ctx.fillRect(22, 16 - armRaise + 1, 3, 8 + armRaise - 1)
}

function drawPenguinJumpBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const t = frame / (total - 1)
  const squash = 1 - 0.15 * Math.sin(t * Math.PI)
  const bodyHeight = Math.floor(18 * squash)
  const yOffset = Math.floor((18 - bodyHeight) / 2)
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(10, 10 + yOffset, 12, bodyHeight)
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(13, 12 + yOffset, 6, bodyHeight - 4)
}

function drawPenguinEatMouth(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  if (frame === 0 || frame === 3) {
    ctx.fillStyle = '#FF9800'
    ctx.fillRect(15, 14, 2, 2)
  } else {
    ctx.fillStyle = '#FF9800'
    ctx.fillRect(14, 13, 4, 4)
    ctx.fillStyle = '#FF0000'
    ctx.fillRect(15, 14, 2, 2)
  }
}

function drawPenguinSurpriseEyes(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const size = 1 + Math.floor(frame * 2 / total)
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(12 - size, 11, 3 + 2 * size, 3 + size)
  ctx.fillRect(16 - size, 11, 3 + 2 * size, 3 + size)
  ctx.fillStyle = '#FF9800'
  ctx.fillRect(13, 12, 1 + size, 1 + size)
  ctx.fillRect(17, 12, 1 + size, 1 + size)
  ctx.fillStyle = '#000000'
  ctx.fillRect(13, 12, 1, 1)
  ctx.fillRect(17, 12, 1, 1)
}

function drawPenguinDanceArms(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const armRaise = Math.floor(Math.abs(frame - total / 2) * 4 / total)
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(7, 16 - armRaise, 3, 8 + armRaise)
  ctx.fillRect(22, 16 - armRaise, 3, 8 + armRaise)
}

// ===== MOUSE PART DRAWING FUNCTIONS =====

function drawMouseShadow(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = 'rgba(0,0,0,0.15)'
  ctx.beginPath()
  ctx.ellipse(s / 2, s - 3, s / 3, 3, 0, 0, Math.PI * 2)
  ctx.fill()
}

function drawMouseTail(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#9E9E9E'
  ctx.fillRect(6, 18, 4, 2)
  ctx.fillRect(4, 19, 3, 2)
  ctx.fillRect(2, 20, 3, 2)
  ctx.fillRect(1, 21, 2, 2)
  ctx.fillRect(0, 22, 2, 2)
}

function drawMouseBody(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#9E9E9E'
  ctx.fillRect(10, 14, 12, 12)
  ctx.fillStyle = '#E0E0E0'
  ctx.fillRect(13, 16, 6, 8)
}

function drawMouseEars(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#9E9E9E'
  ctx.fillRect(9, 6, 6, 5)
  ctx.fillRect(17, 6, 6, 5)
  ctx.fillStyle = '#FFCDD2'
  ctx.fillRect(10, 7, 4, 3)
  ctx.fillRect(18, 7, 4, 3)
}

function drawMouseFrontArm(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#9E9E9E'
  ctx.fillRect(8, 18, 3, 6)
  ctx.fillRect(21, 18, 3, 6)
}

function drawMouseEyes(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#000000'
  ctx.fillRect(12, 12, 2, 3)
  ctx.fillRect(18, 12, 2, 3)
}

function drawMouseMouth(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#F48FB1'
  ctx.fillRect(15, 18, 2, 1)
  ctx.fillStyle = '#000000'
  ctx.fillRect(15, 19, 2, 1)
  // whiskers
  ctx.fillStyle = '#000000'
  ctx.fillRect(11, 18, 2, 1)
  ctx.fillRect(19, 18, 2, 1)
}

// ===== MOUSE OVERRIDE DRAWING FUNCTIONS =====

function drawMouseWaveFrontArm(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  ctx.fillStyle = '#9E9E9E'
  const armRaise = Math.floor(frame * (6 / total))
  ctx.fillRect(8, 18 - armRaise, 3, 6 + armRaise)
  ctx.fillRect(21, 18 - armRaise + 1, 3, 6 + armRaise - 1)
}

function drawMouseJumpBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const t = frame / (total - 1)
  const squash = 1 - 0.15 * Math.sin(t * Math.PI)
  const bodyHeight = Math.floor(12 * squash)
  const yOffset = Math.floor((12 - bodyHeight) / 2)
  ctx.fillStyle = '#9E9E9E'
  ctx.fillRect(10, 14 + yOffset, 12, bodyHeight)
  ctx.fillStyle = '#E0E0E0'
  ctx.fillRect(13, 16 + yOffset, 6, bodyHeight - 4)
}

function drawMouseEatMouth(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  if (frame === 0 || frame === 3) {
    ctx.fillStyle = '#F48FB1'
    ctx.fillRect(15, 19, 2, 1)
  } else {
    ctx.fillStyle = '#F48FB1'
    ctx.fillRect(14, 18, 4, 3)
    ctx.fillStyle = '#FF0000'
    ctx.fillRect(15, 19, 2, 1)
  }
}

function drawMouseSurpriseEyes(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const size = 1 + Math.floor(frame * 2 / total)
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(11 - size, 11, 2 + 2 * size, 3 + size)
  ctx.fillRect(17 - size, 11, 2 + 2 * size, 3 + size)
  ctx.fillStyle = '#000000'
  ctx.fillRect(12, 12, 1 + size, 2 + size)
  ctx.fillRect(18, 12, 1 + size, 2 + size)
}

function drawMouseDanceArms(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const armRaise = Math.floor(Math.abs(frame - total / 2) * 4 / total)
  ctx.fillStyle = '#9E9E9E'
  ctx.fillRect(8, 18 - armRaise, 3, 8 + armRaise)
  ctx.fillRect(21, 18 - armRaise, 3, 8 + armRaise)
}

// ===== BEAR PART DRAWING FUNCTIONS =====

function drawBearShadow(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = 'rgba(0,0,0,0.15)'
  ctx.beginPath()
  ctx.ellipse(s / 2, s - 3, s / 3, 3, 0, 0, Math.PI * 2)
  ctx.fill()
}

function drawBearTail(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#8D6E63'
  ctx.fillRect(2, 16, 4, 4)
  ctx.fillRect(1, 17, 3, 2)
}

function drawBearBody(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#8D6E63'
  ctx.fillRect(6, 10, 20, 18)
  ctx.fillStyle = '#A1887F'
  ctx.fillRect(13, 14, 6, 5)
}

function drawBearEars(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#8D6E63'
  ctx.fillRect(8, 5, 5, 5)
  ctx.fillRect(19, 5, 5, 5)
  ctx.fillStyle = '#A1887F'
  ctx.fillRect(9, 6, 3, 3)
  ctx.fillRect(20, 6, 3, 3)
}

function drawBearFrontArm(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#8D6E63'
  ctx.fillRect(4, 18, 4, 8)
  ctx.fillRect(24, 18, 4, 8)
}

function drawBearEyes(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#000000'
  ctx.fillRect(12, 11, 2, 2)
  ctx.fillRect(18, 11, 2, 2)
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(12, 11, 1, 1)
  ctx.fillRect(19, 11, 1, 1)
}

function drawBearMouth(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#3E2723'
  ctx.fillRect(13, 14, 6, 3)
  ctx.fillRect(14, 13, 4, 1)
  ctx.fillStyle = '#000000'
  ctx.fillRect(15, 17, 2, 1)
}

// ===== BEAR OVERRIDE DRAWING FUNCTIONS =====

function drawBearWaveFrontArm(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  ctx.fillStyle = '#8D6E63'
  const armRaise = Math.floor(frame * (6 / total))
  ctx.fillRect(4, 18 - armRaise, 4, 8 + armRaise)
  ctx.fillRect(24, 18 - armRaise + 1, 4, 8 + armRaise - 1)
}

function drawBearJumpBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const t = frame / (total - 1)
  const squash = 1 - 0.15 * Math.sin(t * Math.PI)
  const bodyHeight = Math.floor(18 * squash)
  const yOffset = Math.floor((18 - bodyHeight) / 2)
  ctx.fillStyle = '#8D6E63'
  ctx.fillRect(6, 10 + yOffset, 20, bodyHeight)
  ctx.fillStyle = '#A1887F'
  ctx.fillRect(13, 14 + yOffset, 6, 5)
}

function drawBearEatMouth(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  if (frame === 0 || frame === 3) {
    ctx.fillStyle = '#3E2723'
    ctx.fillRect(15, 17, 2, 1)
  } else {
    ctx.fillStyle = '#3E2723'
    ctx.fillRect(14, 16, 4, 4)
    ctx.fillStyle = '#FF0000'
    ctx.fillRect(15, 17, 2, 2)
  }
}

function drawBearSurpriseEyes(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const size = 1 + Math.floor(frame * 2 / total)
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(11 - size, 10, 2 + 2 * size, 2 + size)
  ctx.fillRect(17 - size, 10, 2 + 2 * size, 2 + size)
  ctx.fillStyle = '#000000'
  ctx.fillRect(12, 11, 1 + size, 1 + size)
  ctx.fillRect(18, 11, 1 + size, 1 + size)
}

function drawBearDanceArms(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const armRaise = Math.floor(Math.abs(frame - total / 2) * 4 / total)
  ctx.fillStyle = '#8D6E63'
  ctx.fillRect(4, 18 - armRaise, 4, 10 + armRaise)
  ctx.fillRect(24, 18 - armRaise, 4, 10 + armRaise)
}

// ===== KOALA PART DRAWING FUNCTIONS =====

function drawKoalaShadow(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = 'rgba(0,0,0,0.15)'
  ctx.beginPath()
  ctx.ellipse(s / 2, s - 3, s / 3, 3, 0, 0, Math.PI * 2)
  ctx.fill()
}

function drawKoalaTail(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#78909C'
  ctx.fillRect(2, 18, 4, 4)
  ctx.fillRect(1, 19, 3, 2)
}

function drawKoalaBody(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#78909C'
  ctx.fillRect(8, 12, 16, 14)
  ctx.fillStyle = '#CFD8DC'
  ctx.fillRect(12, 16, 8, 8)
}

function drawKoalaEars(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#78909C'
  ctx.fillRect(6, 8, 5, 7)
  ctx.fillRect(21, 8, 5, 7)
  ctx.fillStyle = '#CFD8DC'
  ctx.fillRect(7, 9, 3, 5)
  ctx.fillRect(22, 9, 3, 5)
}

function drawKoalaFrontArm(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#78909C'
  ctx.fillRect(6, 18, 3, 8)
  ctx.fillRect(23, 18, 3, 8)
}

function drawKoalaEyes(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#000000'
  ctx.fillRect(12, 11, 3, 4)
  ctx.fillRect(17, 11, 3, 4)
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(13, 12, 1, 1)
  ctx.fillRect(18, 12, 1, 1)
}

function drawKoalaMouth(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(14, 16, 4, 3)
  ctx.fillRect(15, 15, 2, 1)
  ctx.fillStyle = '#000000'
  ctx.fillRect(15, 18, 2, 1)
}

// ===== KOALA OVERRIDE DRAWING FUNCTIONS =====

function drawKoalaWaveFrontArm(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  ctx.fillStyle = '#78909C'
  const armRaise = Math.floor(frame * (6 / total))
  ctx.fillRect(6, 18 - armRaise, 3, 8 + armRaise)
  ctx.fillRect(23, 18 - armRaise + 1, 3, 8 + armRaise - 1)
}

function drawKoalaJumpBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const t = frame / (total - 1)
  const squash = 1 - 0.15 * Math.sin(t * Math.PI)
  const bodyHeight = Math.floor(14 * squash)
  const yOffset = Math.floor((14 - bodyHeight) / 2)
  ctx.fillStyle = '#78909C'
  ctx.fillRect(8, 12 + yOffset, 16, bodyHeight)
  ctx.fillStyle = '#CFD8DC'
  ctx.fillRect(12, 16 + yOffset, 8, bodyHeight - 4)
}

function drawKoalaEatMouth(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  if (frame === 0 || frame === 3) {
    ctx.fillStyle = '#000000'
    ctx.fillRect(15, 18, 2, 1)
  } else {
    ctx.fillStyle = '#000000'
    ctx.fillRect(14, 16, 4, 4)
    ctx.fillStyle = '#FF0000'
    ctx.fillRect(15, 17, 2, 2)
  }
}

function drawKoalaSurpriseEyes(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const size = 1 + Math.floor(frame * 2 / total)
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(11 - size, 10, 3 + 2 * size, 4 + size)
  ctx.fillRect(16 - size, 10, 3 + 2 * size, 4 + size)
  ctx.fillStyle = '#000000'
  ctx.fillRect(12, 11, 2 + size, 3 + size)
  ctx.fillRect(17, 11, 2 + size, 3 + size)
}

function drawKoalaDanceArms(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const armRaise = Math.floor(Math.abs(frame - total / 2) * 4 / total)
  ctx.fillStyle = '#78909C'
  ctx.fillRect(6, 18 - armRaise, 3, 8 + armRaise)
  ctx.fillRect(23, 18 - armRaise, 3, 8 + armRaise)
}

// ===== OWL PART DRAWING FUNCTIONS =====

function drawOwlShadow(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = 'rgba(0,0,0,0.15)'
  ctx.beginPath()
  ctx.ellipse(s / 2, s - 3, s / 3, 3, 0, 0, Math.PI * 2)
  ctx.fill()
}

function drawOwlTail(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#795548'
  ctx.fillRect(14, 26, 4, 2)
}

function drawOwlBody(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#795548'
  ctx.fillRect(8, 10, 16, 18)
  ctx.fillStyle = '#D7CCC8'
  ctx.fillRect(13, 16, 6, 8)
  ctx.fillStyle = '#5D4037'
  ctx.fillRect(8, 16, 2, 8)
  ctx.fillRect(22, 16, 2, 8)
  ctx.fillStyle = '#FF9800'
  ctx.fillRect(14, 26, 2, 2)
  ctx.fillRect(18, 26, 2, 2)
}

function drawOwlEars(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#795548'
  ctx.fillRect(10, 2, 3, 5)
  ctx.fillRect(19, 2, 3, 5)
  ctx.fillStyle = '#5D4037'
  ctx.fillRect(11, 2, 1, 4)
  ctx.fillRect(20, 2, 1, 4)
}

function drawOwlFrontArm(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#5D4037'
  ctx.fillRect(6, 16, 2, 10)
  ctx.fillRect(24, 16, 2, 10)
  ctx.fillStyle = '#795548'
  ctx.fillRect(6, 22, 2, 4)
  ctx.fillRect(24, 22, 2, 4)
}

function drawOwlEyes(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(11, 10, 5, 6)
  ctx.fillRect(17, 10, 5, 6)
  ctx.fillStyle = '#FFC107'
  ctx.fillRect(13, 12, 3, 4)
  ctx.fillRect(19, 12, 3, 4)
  ctx.fillStyle = '#000000'
  ctx.fillRect(14, 13, 2, 3)
  ctx.fillRect(20, 13, 2, 3)
}

function drawOwlMouth(ctx: OffscreenCanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#FF9800'
  ctx.fillRect(15, 18, 2, 2)
  ctx.fillRect(14, 19, 4, 1)
}

// ===== OWL OVERRIDE DRAWING FUNCTIONS =====

function drawOwlWaveFrontArm(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  ctx.fillStyle = '#5D4037'
  const armRaise = Math.floor(frame * (6 / total))
  ctx.fillRect(6, 16 - armRaise, 2, 10 + armRaise)
  ctx.fillRect(24, 16 - armRaise + 1, 2, 10 + armRaise - 1)
}

function drawOwlJumpBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const t = frame / (total - 1)
  const squash = 1 - 0.15 * Math.sin(t * Math.PI)
  const bodyHeight = Math.floor(18 * squash)
  const yOffset = Math.floor((18 - bodyHeight) / 2)
  ctx.fillStyle = '#795548'
  ctx.fillRect(8, 10 + yOffset, 16, bodyHeight)
  ctx.fillStyle = '#D7CCC8'
  ctx.fillRect(13, 16 + yOffset, 6, bodyHeight - 4)
  ctx.fillStyle = '#5D4037'
  ctx.fillRect(8, 16 + yOffset, 2, bodyHeight - 4)
  ctx.fillRect(22, 16 + yOffset, 2, bodyHeight - 4)
}

function drawOwlEatMouth(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  if (frame === 0 || frame === 3) {
    ctx.fillStyle = '#FF9800'
    ctx.fillRect(15, 19, 2, 1)
  } else {
    ctx.fillStyle = '#FF9800'
    ctx.fillRect(14, 18, 4, 4)
    ctx.fillStyle = '#FF0000'
    ctx.fillRect(15, 19, 2, 2)
  }
}

function drawOwlSurpriseEyes(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const size = 1 + Math.floor(frame * 2 / total)
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(10 - size, 9, 5 + 2 * size, 6 + size)
  ctx.fillRect(16 - size, 9, 5 + 2 * size, 6 + size)
  ctx.fillStyle = '#FFC107'
  ctx.fillRect(12, 11, 3 + size, 4 + size)
  ctx.fillRect(18, 11, 3 + size, 4 + size)
  ctx.fillStyle = '#000000'
  ctx.fillRect(13, 12, 2 + size, 3 + size)
  ctx.fillRect(19, 12, 2 + size, 3 + size)
}

function drawOwlDanceArms(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const armRaise = Math.floor(Math.abs(frame - total / 2) * 4 / total)
  ctx.fillStyle = '#5D4037'
  ctx.fillRect(6, 16 - armRaise, 2, 10 + armRaise)
  ctx.fillRect(24, 16 - armRaise, 2, 10 + armRaise)
}

// ===== RACCOON BALLET OVERRIDE DRAWING FUNCTIONS =====

function drawRaccoonBalletPliéBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const t = frame / (total - 1)
  const compress = 1 - 0.12 * Math.sin(t * Math.PI)
  const widen = 1 + 0.06 * Math.sin(t * Math.PI)
  const bodyH = Math.floor(14 * compress)
  const bodyW = Math.floor(16 * widen)
  const dx = Math.floor((16 - bodyW) / 2)
  const dy = Math.floor((14 - bodyH) / 2)
  ctx.fillStyle = '#A0896C'
  ctx.fillRect(8 + dx, 12 + dy, bodyW, bodyH)
  ctx.fillStyle = '#C4B39D'
  ctx.fillRect(12 + dx, 16 + dy, bodyW - 8, bodyH - 4)
  ctx.fillStyle = '#8B7355'
  const armOff = Math.floor(3 * Math.sin(t * Math.PI))
  ctx.fillRect(6 - armOff, 18 + dy, 3, 8)
  ctx.fillRect(23 + armOff, 18 + dy, 3, 8)
}

function drawRaccoonBalletRelevéBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const dy = -Math.floor(frame * 2 / (total - 1))
  ctx.fillStyle = '#A0896C'
  ctx.fillRect(8, 12 + dy, 16, 14)
  ctx.fillStyle = '#C4B39D'
  ctx.fillRect(12, 16 + dy, 8, 8)
  ctx.fillStyle = '#8B7355'
  const armRise = Math.floor(frame * 4 / (total - 1))
  ctx.fillRect(6, 14 + dy - armRise, 3, 8 + armRise)
  ctx.fillRect(23, 14 + dy - armRise, 3, 8 + armRise)
}

function drawRaccoonBalletPirouetteBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const dx = frame === 0 ? 0 : frame === 1 ? 1 : 0
  ctx.fillStyle = '#A0896C'
  ctx.fillRect(8 + dx, 12, 16, 14)
  ctx.fillStyle = '#C4B39D'
  ctx.fillRect(12 + dx, 16, 8, 8)
}

function drawRaccoonBalletArabesqueBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const t = frame / (total - 1)
  const lean = Math.floor(3 * Math.sin(t * Math.PI))
  const bodyH = 14 - lean
  ctx.fillStyle = '#A0896C'
  ctx.fillRect(8, 12 + lean, 16, bodyH)
  ctx.fillStyle = '#C4B39D'
  ctx.fillRect(12, 16 + lean, 8, bodyH - 4)
  if (frame > 0) {
    ctx.fillStyle = '#8B7355'
    ctx.fillRect(4, 20 + lean, 4, 3)
  }
}

function drawRaccoonBalletBowBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const t = frame / (total - 1)
  const topTrim = Math.floor(8 * Math.sin(t * Math.PI))
  ctx.fillStyle = '#A0896C'
  ctx.fillRect(8, 12 + topTrim, 16, 14 - topTrim)
  ctx.fillStyle = '#C4B39D'
  ctx.fillRect(12, 16 + topTrim, 8, 8 - topTrim)
}

// ===== CAT BALLET OVERRIDE DRAWING FUNCTIONS =====

function drawCatBalletPliéBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const t = frame / (total - 1)
  const compress = 1 - 0.12 * Math.sin(t * Math.PI)
  const widen = 1 + 0.06 * Math.sin(t * Math.PI)
  const bodyH = Math.floor(12 * compress)
  const bodyW = Math.floor(16 * widen)
  const dx = Math.floor((16 - bodyW) / 2)
  const dy = Math.floor((12 - bodyH) / 2)
  ctx.fillStyle = '#D4845A'
  ctx.fillRect(8 + dx, 14 + dy, bodyW, bodyH)
  ctx.fillStyle = '#F0C9A0'
  ctx.fillRect(12 + dx, 16 + dy, bodyW - 8, bodyH - 4)
  ctx.fillStyle = '#B8653A'
  ctx.fillRect(10 + dx, 15 + dy, 2, bodyH - 2)
  ctx.fillRect(16 + dx, 15 + dy, 2, bodyH - 2)
  ctx.fillRect(22 + dx, 15 + dy, 2, bodyH - 2)
  ctx.fillStyle = '#D4845A'
  const armOff = Math.floor(3 * Math.sin(t * Math.PI))
  ctx.fillRect(6 - armOff, 18 + dy, 3, 8)
  ctx.fillRect(23 + armOff, 18 + dy, 3, 8)
}

function drawCatBalletRelevéBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const dy = -Math.floor(frame * 2 / (total - 1))
  ctx.fillStyle = '#D4845A'
  ctx.fillRect(8, 14 + dy, 16, 12)
  ctx.fillStyle = '#F0C9A0'
  ctx.fillRect(12, 16 + dy, 8, 8)
  ctx.fillStyle = '#B8653A'
  ctx.fillRect(10, 15 + dy, 2, 10)
  ctx.fillRect(16, 15 + dy, 2, 10)
  ctx.fillRect(22, 15 + dy, 2, 10)
  ctx.fillStyle = '#D4845A'
  const armRise = Math.floor(frame * 4 / (total - 1))
  ctx.fillRect(6, 16 + dy - armRise, 3, 6 + armRise)
  ctx.fillRect(23, 16 + dy - armRise, 3, 6 + armRise)
}

function drawCatBalletPirouetteBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const dx = frame === 0 ? 0 : frame === 1 ? 1 : 0
  ctx.fillStyle = '#D4845A'
  ctx.fillRect(8 + dx, 14, 16, 12)
  ctx.fillStyle = '#F0C9A0'
  ctx.fillRect(12 + dx, 16, 8, 8)
  ctx.fillStyle = '#B8653A'
  ctx.fillRect(10 + dx, 15, 2, 10)
  ctx.fillRect(16 + dx, 15, 2, 10)
  ctx.fillRect(22 + dx, 15, 2, 10)
}

function drawCatBalletArabesqueBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const t = frame / (total - 1)
  const lean = Math.floor(3 * Math.sin(t * Math.PI))
  const bodyH = 12 - lean
  ctx.fillStyle = '#D4845A'
  ctx.fillRect(8, 14 + lean, 16, bodyH)
  ctx.fillStyle = '#F0C9A0'
  ctx.fillRect(12, 16 + lean, 8, bodyH - 4)
  ctx.fillStyle = '#B8653A'
  ctx.fillRect(10, 15 + lean, 2, bodyH - 2)
  ctx.fillRect(16, 15 + lean, 2, bodyH - 2)
  ctx.fillRect(22, 15 + lean, 2, bodyH - 2)
  if (frame > 0) {
    ctx.fillStyle = '#D4845A'
    ctx.fillRect(4, 20 + lean, 4, 3)
  }
}

function drawCatBalletBowBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const t = frame / (total - 1)
  const topTrim = Math.floor(8 * Math.sin(t * Math.PI))
  ctx.fillStyle = '#D4845A'
  ctx.fillRect(8, 14 + topTrim, 16, 12 - topTrim)
  ctx.fillStyle = '#F0C9A0'
  ctx.fillRect(12, 16 + topTrim, 8, 8 - topTrim)
  ctx.fillStyle = '#B8653A'
  ctx.fillRect(10, 15 + topTrim, 2, 10 - topTrim)
  ctx.fillRect(16, 15 + topTrim, 2, 10 - topTrim)
  ctx.fillRect(22, 15 + topTrim, 2, 10 - topTrim)
}

// ===== FOX BALLET OVERRIDE DRAWING FUNCTIONS =====

function drawFoxBalletPliéBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const t = frame / (total - 1)
  const compress = 1 - 0.12 * Math.sin(t * Math.PI)
  const widen = 1 + 0.06 * Math.sin(t * Math.PI)
  const bodyH = Math.floor(14 * compress)
  const bodyW = Math.floor(16 * widen)
  const dx = Math.floor((16 - bodyW) / 2)
  const dy = Math.floor((14 - bodyH) / 2)
  ctx.fillStyle = '#D46A3A'
  ctx.fillRect(8 + dx, 12 + dy, bodyW, bodyH)
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(12 + dx, 16 + dy, bodyW - 8, bodyH - 4)
  ctx.fillRect(13 + dx, 12 + dy, bodyW - 10, 4)
  ctx.fillStyle = '#D46A3A'
  const armOff = Math.floor(3 * Math.sin(t * Math.PI))
  ctx.fillRect(6 - armOff, 18 + dy, 3, 8)
  ctx.fillRect(23 + armOff, 18 + dy, 3, 8)
}

function drawFoxBalletRelevéBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const dy = -Math.floor(frame * 2 / (total - 1))
  ctx.fillStyle = '#D46A3A'
  ctx.fillRect(8, 12 + dy, 16, 14)
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(12, 16 + dy, 8, 8)
  ctx.fillRect(13, 12 + dy, 6, 4)
  ctx.fillStyle = '#D46A3A'
  const armRise = Math.floor(frame * 4 / (total - 1))
  ctx.fillRect(6, 16 + dy - armRise, 3, 8 + armRise)
  ctx.fillRect(23, 16 + dy - armRise, 3, 8 + armRise)
}

function drawFoxBalletPirouetteBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const dx = frame === 0 ? 0 : frame === 1 ? 1 : 0
  ctx.fillStyle = '#D46A3A'
  ctx.fillRect(8 + dx, 12, 16, 14)
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(12 + dx, 16, 8, 8)
  ctx.fillRect(13 + dx, 12, 6, 4)
}

function drawFoxBalletArabesqueBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const t = frame / (total - 1)
  const lean = Math.floor(3 * Math.sin(t * Math.PI))
  const bodyH = 14 - lean
  ctx.fillStyle = '#D46A3A'
  ctx.fillRect(8, 12 + lean, 16, bodyH)
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(12, 16 + lean, 8, bodyH - 4)
  ctx.fillRect(13, 12 + lean, 6, 4)
  if (frame > 0) {
    ctx.fillStyle = '#D46A3A'
    ctx.fillRect(4, 20 + lean, 4, 3)
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(4, 22 + lean, 4, 1)
  }
}

function drawFoxBalletBowBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const t = frame / (total - 1)
  const topTrim = Math.floor(8 * Math.sin(t * Math.PI))
  ctx.fillStyle = '#D46A3A'
  ctx.fillRect(8, 12 + topTrim, 16, 14 - topTrim)
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(12, 16 + topTrim, 8, 8 - topTrim)
  ctx.fillRect(13, 12 + topTrim, 6, 4 - Math.min(4, topTrim))
}

// ===== RABBIT BALLET OVERRIDE DRAWING FUNCTIONS =====

function drawRabbitBalletPliéBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const t = frame / (total - 1)
  const compress = 1 - 0.12 * Math.sin(t * Math.PI)
  const widen = 1 + 0.06 * Math.sin(t * Math.PI)
  const bodyH = Math.floor(12 * compress)
  const bodyW = Math.floor(16 * widen)
  const dx = Math.floor((16 - bodyW) / 2)
  const dy = Math.floor((12 - bodyH) / 2)
  ctx.fillStyle = '#C4A882'
  ctx.fillRect(8 + dx, 14 + dy, bodyW, bodyH)
  ctx.fillStyle = '#E8D5B7'
  ctx.fillRect(12 + dx, 16 + dy, bodyW - 8, bodyH - 4)
  ctx.fillStyle = '#C4A882'
  const armOff = Math.floor(3 * Math.sin(t * Math.PI))
  ctx.fillRect(6 - armOff, 18 + dy, 3, 8)
  ctx.fillRect(23 + armOff, 18 + dy, 3, 8)
}

function drawRabbitBalletRelevéBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const dy = -Math.floor(frame * 2 / (total - 1))
  ctx.fillStyle = '#C4A882'
  ctx.fillRect(8, 14 + dy, 16, 12)
  ctx.fillStyle = '#E8D5B7'
  ctx.fillRect(12, 16 + dy, 8, 8)
  ctx.fillStyle = '#C4A882'
  const armRise = Math.floor(frame * 4 / (total - 1))
  ctx.fillRect(6, 16 + dy - armRise, 3, 8 + armRise)
  ctx.fillRect(23, 16 + dy - armRise, 3, 8 + armRise)
}

function drawRabbitBalletPirouetteBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const dx = frame === 0 ? 0 : frame === 1 ? 1 : 0
  ctx.fillStyle = '#C4A882'
  ctx.fillRect(8 + dx, 14, 16, 12)
  ctx.fillStyle = '#E8D5B7'
  ctx.fillRect(12 + dx, 16, 8, 8)
}

function drawRabbitBalletArabesqueBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const t = frame / (total - 1)
  const lean = Math.floor(3 * Math.sin(t * Math.PI))
  const bodyH = 12 - lean
  ctx.fillStyle = '#C4A882'
  ctx.fillRect(8, 14 + lean, 16, bodyH)
  ctx.fillStyle = '#E8D5B7'
  ctx.fillRect(12, 16 + lean, 8, bodyH - 4)
  if (frame > 0) {
    ctx.fillStyle = '#C4A882'
    ctx.fillRect(4, 20 + lean, 4, 3)
  }
}

function drawRabbitBalletBowBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const t = frame / (total - 1)
  const topTrim = Math.floor(8 * Math.sin(t * Math.PI))
  ctx.fillStyle = '#C4A882'
  ctx.fillRect(8, 14 + topTrim, 16, 12 - topTrim)
  ctx.fillStyle = '#E8D5B7'
  ctx.fillRect(12, 16 + topTrim, 8, 8 - topTrim)
}

// ===== PANDA BALLET OVERRIDE DRAWING FUNCTIONS =====

function drawPandaBalletPliéBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const t = frame / (total - 1)
  const compress = 1 - 0.12 * Math.sin(t * Math.PI)
  const widen = 1 + 0.06 * Math.sin(t * Math.PI)
  const bodyH = Math.floor(14 * compress)
  const bodyW = Math.floor(16 * widen)
  const dx = Math.floor((16 - bodyW) / 2)
  const dy = Math.floor((14 - bodyH) / 2)
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(8 + dx, 12 + dy, bodyW, bodyH)
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(8 + dx, 22 + dy - Math.floor(Math.min(4, bodyH - 8)), 4, 4)
  ctx.fillRect(20 + dx, 22 + dy - Math.floor(Math.min(4, bodyH - 8)), 4, 4)
  ctx.fillStyle = '#1a1a1a'
  const armOff = Math.floor(3 * Math.sin(t * Math.PI))
  ctx.fillRect(6 - armOff, 18 + dy, 3, 8)
  ctx.fillRect(23 + armOff, 18 + dy, 3, 8)
}

function drawPandaBalletRelevéBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const dy = -Math.floor(frame * 2 / (total - 1))
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(8, 12 + dy, 16, 14)
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(8, 22 + dy, 4, 4)
  ctx.fillRect(20, 22 + dy, 4, 4)
  ctx.fillStyle = '#1a1a1a'
  const armRise = Math.floor(frame * 4 / (total - 1))
  ctx.fillRect(6, 16 + dy - armRise, 3, 8 + armRise)
  ctx.fillRect(23, 16 + dy - armRise, 3, 8 + armRise)
}

function drawPandaBalletPirouetteBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const dx = frame === 0 ? 0 : frame === 1 ? 1 : 0
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(8 + dx, 12, 16, 14)
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(8 + dx, 22, 4, 4)
  ctx.fillRect(20 + dx, 22, 4, 4)
}

function drawPandaBalletArabesqueBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const t = frame / (total - 1)
  const lean = Math.floor(3 * Math.sin(t * Math.PI))
  const bodyH = 14 - lean
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(8, 12 + lean, 16, bodyH)
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(8, 22 + lean, 4, Math.min(4, bodyH - 10))
  ctx.fillRect(20, 22 + lean, 4, Math.min(4, bodyH - 10))
  if (frame > 0) {
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(4, 20 + lean, 4, 3)
  }
}

function drawPandaBalletBowBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const t = frame / (total - 1)
  const topTrim = Math.floor(8 * Math.sin(t * Math.PI))
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(8, 12 + topTrim, 16, 14 - topTrim)
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(8, 22 + topTrim - Math.min(topTrim, 4), 4, 4)
  ctx.fillRect(20, 22 + topTrim - Math.min(topTrim, 4), 4, 4)
}

// ===== FROG BALLET OVERRIDE DRAWING FUNCTIONS =====

function drawFrogBalletPliéBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const t = frame / (total - 1)
  const compress = 1 - 0.12 * Math.sin(t * Math.PI)
  const widen = 1 + 0.06 * Math.sin(t * Math.PI)
  const bodyH = Math.floor(14 * compress)
  const bodyW = Math.floor(20 * widen)
  const dx = Math.floor((20 - bodyW) / 2)
  const dy = Math.floor((14 - bodyH) / 2)
  ctx.fillStyle = '#4CAF50'
  ctx.fillRect(6 + dx, 14 + dy, bodyW, bodyH)
  ctx.fillStyle = '#C8E6C9'
  ctx.fillRect(12 + dx, 18 + dy, bodyW - 8, bodyH - 4)
  ctx.fillStyle = '#2E7D32'
  ctx.fillRect(8 + dx, 14 + dy, 2, 6)
  ctx.fillRect(22 + dx, 14 + dy, 2, 6)
  ctx.fillStyle = '#4CAF50'
  const armOff = Math.floor(3 * Math.sin(t * Math.PI))
  ctx.fillRect(4 - armOff, 18 + dy, 3, 6)
  ctx.fillRect(25 + armOff, 18 + dy, 3, 6)
}

function drawFrogBalletRelevéBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const dy = -Math.floor(frame * 2 / (total - 1))
  ctx.fillStyle = '#4CAF50'
  ctx.fillRect(6, 14 + dy, 20, 14)
  ctx.fillStyle = '#C8E6C9'
  ctx.fillRect(12, 18 + dy, 8, 8)
  ctx.fillStyle = '#2E7D32'
  ctx.fillRect(8, 14 + dy, 2, 6)
  ctx.fillRect(22, 14 + dy, 2, 6)
  ctx.fillStyle = '#4CAF50'
  const armRise = Math.floor(frame * 4 / (total - 1))
  ctx.fillRect(4, 16 + dy - armRise, 3, 6 + armRise)
  ctx.fillRect(25, 16 + dy - armRise, 3, 6 + armRise)
}

function drawFrogBalletPirouetteBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const dx = frame === 0 ? 0 : frame === 1 ? 1 : 0
  ctx.fillStyle = '#4CAF50'
  ctx.fillRect(6 + dx, 14, 20, 14)
  ctx.fillStyle = '#C8E6C9'
  ctx.fillRect(12 + dx, 18, 8, 8)
  ctx.fillStyle = '#2E7D32'
  ctx.fillRect(8 + dx, 14, 2, 6)
  ctx.fillRect(22 + dx, 14, 2, 6)
}

function drawFrogBalletArabesqueBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const t = frame / (total - 1)
  const lean = Math.floor(3 * Math.sin(t * Math.PI))
  const bodyH = 14 - lean
  ctx.fillStyle = '#4CAF50'
  ctx.fillRect(6, 14 + lean, 20, bodyH)
  ctx.fillStyle = '#C8E6C9'
  ctx.fillRect(12, 18 + lean, 8, bodyH - 4)
  ctx.fillStyle = '#2E7D32'
  ctx.fillRect(8, 14 + lean, 2, Math.min(6, bodyH - 2))
  ctx.fillRect(22, 14 + lean, 2, Math.min(6, bodyH - 2))
  if (frame > 0) {
    ctx.fillStyle = '#4CAF50'
    ctx.fillRect(4, 18 + lean, 3, 4)
  }
}

function drawFrogBalletBowBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const t = frame / (total - 1)
  const topTrim = Math.floor(8 * Math.sin(t * Math.PI))
  ctx.fillStyle = '#4CAF50'
  ctx.fillRect(6, 14 + topTrim, 20, 14 - topTrim)
  ctx.fillStyle = '#C8E6C9'
  ctx.fillRect(12, 18 + topTrim, 8, 8 - topTrim)
  ctx.fillStyle = '#2E7D32'
  ctx.fillRect(8, 14 + topTrim, 2, Math.min(6, 6 - topTrim))
  ctx.fillRect(22, 14 + topTrim, 2, Math.min(6, 6 - topTrim))
}

// ===== PENGUIN BALLET OVERRIDE DRAWING FUNCTIONS =====

function drawPenguinBalletPliéBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const t = frame / (total - 1)
  const compress = 1 - 0.10 * Math.sin(t * Math.PI)
  const widen = 1 + 0.06 * Math.sin(t * Math.PI)
  const bodyH = Math.floor(18 * compress)
  const bodyW = Math.floor(12 * widen)
  const dx = Math.floor((12 - bodyW) / 2)
  const dy = Math.floor((18 - bodyH) / 2)
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(10 + dx, 10 + dy, bodyW, bodyH)
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(13 + dx, 12 + dy, bodyW - 6, bodyH - 4)
  ctx.fillStyle = '#FF9800'
  ctx.fillRect(14 + dx, 26 + dy - Math.floor(Math.min(2, bodyH - 14)), 2, 2)
  ctx.fillRect(18 + dx, 26 + dy - Math.floor(Math.min(2, bodyH - 14)), 2, 2)
  ctx.fillStyle = '#1a1a1a'
  const armOff = Math.floor(2 * Math.sin(t * Math.PI))
  ctx.fillRect(7 - armOff, 16 + dy, 3, 8)
  ctx.fillRect(22 + armOff, 16 + dy, 3, 8)
}

function drawPenguinBalletRelevéBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const dy = -Math.floor(frame * 2 / (total - 1))
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(10, 10 + dy, 12, 18)
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(13, 12 + dy, 6, 14)
  ctx.fillStyle = '#FF9800'
  ctx.fillRect(14, 26 + dy, 2, 2)
  ctx.fillRect(18, 26 + dy, 2, 2)
  ctx.fillStyle = '#1a1a1a'
  const armRise = Math.floor(frame * 4 / (total - 1))
  ctx.fillRect(7, 14 + dy - armRise, 3, 8 + armRise)
  ctx.fillRect(22, 14 + dy - armRise, 3, 8 + armRise)
}

function drawPenguinBalletPirouetteBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const dx = frame === 0 ? 0 : frame === 1 ? 1 : 0
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(10 + dx, 10, 12, 18)
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(13 + dx, 12, 6, 14)
  ctx.fillStyle = '#FF9800'
  ctx.fillRect(14 + dx, 26, 2, 2)
  ctx.fillRect(18 + dx, 26, 2, 2)
}

function drawPenguinBalletArabesqueBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const t = frame / (total - 1)
  const lean = Math.floor(3 * Math.sin(t * Math.PI))
  const bodyH = 18 - lean
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(10, 10 + lean, 12, bodyH)
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(13, 12 + lean, 6, bodyH - 4)
  ctx.fillStyle = '#FF9800'
  ctx.fillRect(14, 26 + lean, Math.min(2, 2), Math.min(2, 2))
  ctx.fillRect(18, 26 + lean, Math.min(2, 2), Math.min(2, 2))
  if (frame > 0) {
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(6, 18 + lean, 4, 3)
  }
}

function drawPenguinBalletBowBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const t = frame / (total - 1)
  const topTrim = Math.floor(8 * Math.sin(t * Math.PI))
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(10, 10 + topTrim, 12, 18 - topTrim)
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(13, 12 + topTrim, 6, 14 - topTrim)
  ctx.fillStyle = '#FF9800'
  ctx.fillRect(14, 26 + topTrim, 2, 2)
  ctx.fillRect(18, 26 + topTrim, 2, 2)
}

// ===== MOUSE BALLET OVERRIDE DRAWING FUNCTIONS =====

function drawMouseBalletPliéBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const t = frame / (total - 1)
  const compress = 1 - 0.12 * Math.sin(t * Math.PI)
  const widen = 1 + 0.06 * Math.sin(t * Math.PI)
  const bodyH = Math.floor(12 * compress)
  const bodyW = Math.floor(12 * widen)
  const dx = Math.floor((12 - bodyW) / 2)
  const dy = Math.floor((12 - bodyH) / 2)
  ctx.fillStyle = '#9E9E9E'
  ctx.fillRect(10 + dx, 14 + dy, bodyW, bodyH)
  ctx.fillStyle = '#E0E0E0'
  ctx.fillRect(13 + dx, 16 + dy, bodyW - 6, bodyH - 4)
  ctx.fillStyle = '#9E9E9E'
  const armOff = Math.floor(3 * Math.sin(t * Math.PI))
  ctx.fillRect(8 - armOff, 18 + dy, 3, 6)
  ctx.fillRect(21 + armOff, 18 + dy, 3, 6)
}

function drawMouseBalletRelevéBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const dy = -Math.floor(frame * 2 / (total - 1))
  ctx.fillStyle = '#9E9E9E'
  ctx.fillRect(10, 14 + dy, 12, 12)
  ctx.fillStyle = '#E0E0E0'
  ctx.fillRect(13, 16 + dy, 6, 8)
  ctx.fillStyle = '#9E9E9E'
  const armRise = Math.floor(frame * 4 / (total - 1))
  ctx.fillRect(8, 16 + dy - armRise, 3, 6 + armRise)
  ctx.fillRect(21, 16 + dy - armRise, 3, 6 + armRise)
}

function drawMouseBalletPirouetteBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const dx = frame === 0 ? 0 : frame === 1 ? 1 : 0
  ctx.fillStyle = '#9E9E9E'
  ctx.fillRect(10 + dx, 14, 12, 12)
  ctx.fillStyle = '#E0E0E0'
  ctx.fillRect(13 + dx, 16, 6, 8)
}

function drawMouseBalletArabesqueBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const t = frame / (total - 1)
  const lean = Math.floor(3 * Math.sin(t * Math.PI))
  const bodyH = 12 - lean
  ctx.fillStyle = '#9E9E9E'
  ctx.fillRect(10, 14 + lean, 12, bodyH)
  ctx.fillStyle = '#E0E0E0'
  ctx.fillRect(13, 16 + lean, 6, bodyH - 4)
  if (frame > 0) {
    ctx.fillStyle = '#9E9E9E'
    ctx.fillRect(6, 20 + lean, 4, 3)
  }
}

function drawMouseBalletBowBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const t = frame / (total - 1)
  const topTrim = Math.floor(8 * Math.sin(t * Math.PI))
  ctx.fillStyle = '#9E9E9E'
  ctx.fillRect(10, 14 + topTrim, 12, 12 - topTrim)
  ctx.fillStyle = '#E0E0E0'
  ctx.fillRect(13, 16 + topTrim, 6, 8 - topTrim)
}

// ===== BEAR BALLET OVERRIDE DRAWING FUNCTIONS =====

function drawBearBalletPliéBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const t = frame / (total - 1)
  const compress = 1 - 0.10 * Math.sin(t * Math.PI)
  const widen = 1 + 0.06 * Math.sin(t * Math.PI)
  const bodyH = Math.floor(18 * compress)
  const bodyW = Math.floor(20 * widen)
  const dx = Math.floor((20 - bodyW) / 2)
  const dy = Math.floor((18 - bodyH) / 2)
  ctx.fillStyle = '#8D6E63'
  ctx.fillRect(6 + dx, 10 + dy, bodyW, bodyH)
  ctx.fillStyle = '#A1887F'
  ctx.fillRect(13 + dx, 14 + dy, bodyW - 14, 5)
  ctx.fillStyle = '#8D6E63'
  const armOff = Math.floor(3 * Math.sin(t * Math.PI))
  ctx.fillRect(4 - armOff, 18 + dy, 4, 8)
  ctx.fillRect(24 + armOff, 18 + dy, 4, 8)
}

function drawBearBalletRelevéBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const dy = -Math.floor(frame * 2 / (total - 1))
  ctx.fillStyle = '#8D6E63'
  ctx.fillRect(6, 10 + dy, 20, 18)
  ctx.fillStyle = '#A1887F'
  ctx.fillRect(13, 14 + dy, 6, 5)
  ctx.fillStyle = '#8D6E63'
  const armRise = Math.floor(frame * 4 / (total - 1))
  ctx.fillRect(4, 16 + dy - armRise, 4, 8 + armRise)
  ctx.fillRect(24, 16 + dy - armRise, 4, 8 + armRise)
}

function drawBearBalletPirouetteBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const dx = frame === 0 ? 0 : frame === 1 ? 1 : 0
  ctx.fillStyle = '#8D6E63'
  ctx.fillRect(6 + dx, 10, 20, 18)
  ctx.fillStyle = '#A1887F'
  ctx.fillRect(13 + dx, 14, 6, 5)
}

function drawBearBalletArabesqueBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const t = frame / (total - 1)
  const lean = Math.floor(3 * Math.sin(t * Math.PI))
  const bodyH = 18 - lean
  ctx.fillStyle = '#8D6E63'
  ctx.fillRect(6, 10 + lean, 20, bodyH)
  ctx.fillStyle = '#A1887F'
  ctx.fillRect(13, 14 + lean, 6, 5)
  if (frame > 0) {
    ctx.fillStyle = '#8D6E63'
    ctx.fillRect(2, 18 + lean, 4, 4)
  }
}

function drawBearBalletBowBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const t = frame / (total - 1)
  const topTrim = Math.floor(8 * Math.sin(t * Math.PI))
  ctx.fillStyle = '#8D6E63'
  ctx.fillRect(6, 10 + topTrim, 20, 18 - topTrim)
  ctx.fillStyle = '#A1887F'
  ctx.fillRect(13, 14 + topTrim, 6, 5)
}

// ===== KOALA BALLET OVERRIDE DRAWING FUNCTIONS =====

function drawKoalaBalletPliéBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const t = frame / (total - 1)
  const compress = 1 - 0.12 * Math.sin(t * Math.PI)
  const widen = 1 + 0.06 * Math.sin(t * Math.PI)
  const bodyH = Math.floor(14 * compress)
  const bodyW = Math.floor(16 * widen)
  const dx = Math.floor((16 - bodyW) / 2)
  const dy = Math.floor((14 - bodyH) / 2)
  ctx.fillStyle = '#78909C'
  ctx.fillRect(8 + dx, 12 + dy, bodyW, bodyH)
  ctx.fillStyle = '#CFD8DC'
  ctx.fillRect(12 + dx, 16 + dy, bodyW - 8, bodyH - 4)
  ctx.fillStyle = '#78909C'
  const armOff = Math.floor(3 * Math.sin(t * Math.PI))
  ctx.fillRect(6 - armOff, 18 + dy, 3, 8)
  ctx.fillRect(23 + armOff, 18 + dy, 3, 8)
}

function drawKoalaBalletRelevéBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const dy = -Math.floor(frame * 2 / (total - 1))
  ctx.fillStyle = '#78909C'
  ctx.fillRect(8, 12 + dy, 16, 14)
  ctx.fillStyle = '#CFD8DC'
  ctx.fillRect(12, 16 + dy, 8, 8)
  ctx.fillStyle = '#78909C'
  const armRise = Math.floor(frame * 4 / (total - 1))
  ctx.fillRect(6, 16 + dy - armRise, 3, 8 + armRise)
  ctx.fillRect(23, 16 + dy - armRise, 3, 8 + armRise)
}

function drawKoalaBalletPirouetteBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const dx = frame === 0 ? 0 : frame === 1 ? 1 : 0
  ctx.fillStyle = '#78909C'
  ctx.fillRect(8 + dx, 12, 16, 14)
  ctx.fillStyle = '#CFD8DC'
  ctx.fillRect(12 + dx, 16, 8, 8)
}

function drawKoalaBalletArabesqueBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const t = frame / (total - 1)
  const lean = Math.floor(3 * Math.sin(t * Math.PI))
  const bodyH = 14 - lean
  ctx.fillStyle = '#78909C'
  ctx.fillRect(8, 12 + lean, 16, bodyH)
  ctx.fillStyle = '#CFD8DC'
  ctx.fillRect(12, 16 + lean, 8, bodyH - 4)
  if (frame > 0) {
    ctx.fillStyle = '#78909C'
    ctx.fillRect(4, 20 + lean, 4, 3)
  }
}

function drawKoalaBalletBowBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const t = frame / (total - 1)
  const topTrim = Math.floor(8 * Math.sin(t * Math.PI))
  ctx.fillStyle = '#78909C'
  ctx.fillRect(8, 12 + topTrim, 16, 14 - topTrim)
  ctx.fillStyle = '#CFD8DC'
  ctx.fillRect(12, 16 + topTrim, 8, 8 - topTrim)
}

// ===== OWL BALLET OVERRIDE DRAWING FUNCTIONS =====

function drawOwlBalletPliéBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const t = frame / (total - 1)
  const compress = 1 - 0.10 * Math.sin(t * Math.PI)
  const widen = 1 + 0.06 * Math.sin(t * Math.PI)
  const bodyH = Math.floor(18 * compress)
  const bodyW = Math.floor(16 * widen)
  const dx = Math.floor((16 - bodyW) / 2)
  const dy = Math.floor((18 - bodyH) / 2)
  ctx.fillStyle = '#795548'
  ctx.fillRect(8 + dx, 10 + dy, bodyW, bodyH)
  ctx.fillStyle = '#D7CCC8'
  ctx.fillRect(13 + dx, 16 + dy, bodyW - 6, bodyH - 6)
  ctx.fillStyle = '#5D4037'
  ctx.fillRect(8 + dx, 16 + dy, 2, bodyH - 6)
  ctx.fillRect(22 + dx, 16 + dy, 2, bodyH - 6)
  ctx.fillStyle = '#5D4037'
  const armOff = Math.floor(3 * Math.sin(t * Math.PI))
  ctx.fillRect(6 - armOff, 16 + dy, 2, 10)
  ctx.fillRect(24 + armOff, 16 + dy, 2, 10)
}

function drawOwlBalletRelevéBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const dy = -Math.floor(frame * 2 / (total - 1))
  ctx.fillStyle = '#795548'
  ctx.fillRect(8, 10 + dy, 16, 18)
  ctx.fillStyle = '#D7CCC8'
  ctx.fillRect(13, 16 + dy, 6, 8)
  ctx.fillStyle = '#5D4037'
  ctx.fillRect(8, 16 + dy, 2, 8)
  ctx.fillRect(22, 16 + dy, 2, 8)
  ctx.fillStyle = '#5D4037'
  const armRise = Math.floor(frame * 4 / (total - 1))
  ctx.fillRect(6, 14 + dy - armRise, 2, 10 + armRise)
  ctx.fillRect(24, 14 + dy - armRise, 2, 10 + armRise)
}

function drawOwlBalletPirouetteBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const dx = frame === 0 ? 0 : frame === 1 ? 1 : 0
  ctx.fillStyle = '#795548'
  ctx.fillRect(8 + dx, 10, 16, 18)
  ctx.fillStyle = '#D7CCC8'
  ctx.fillRect(13 + dx, 16, 6, 8)
  ctx.fillStyle = '#5D4037'
  ctx.fillRect(8 + dx, 16, 2, 8)
  ctx.fillRect(22 + dx, 16, 2, 8)
}

function drawOwlBalletArabesqueBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const t = frame / (total - 1)
  const lean = Math.floor(3 * Math.sin(t * Math.PI))
  const bodyH = 18 - lean
  ctx.fillStyle = '#795548'
  ctx.fillRect(8, 10 + lean, 16, bodyH)
  ctx.fillStyle = '#D7CCC8'
  ctx.fillRect(13, 16 + lean, 6, bodyH - 6)
  ctx.fillStyle = '#5D4037'
  ctx.fillRect(8, 16 + lean, 2, bodyH - 6)
  ctx.fillRect(22, 16 + lean, 2, bodyH - 6)
  if (frame > 0) {
    ctx.fillStyle = '#5D4037'
    ctx.fillRect(4, 18 + lean, 4, 3)
  }
}

function drawOwlBalletBowBody(ctx: OffscreenCanvasRenderingContext2D, s: number, frame: number, total: number): void {
  const t = frame / (total - 1)
  const topTrim = Math.floor(8 * Math.sin(t * Math.PI))
  ctx.fillStyle = '#795548'
  ctx.fillRect(8, 10 + topTrim, 16, 18 - topTrim)
  ctx.fillStyle = '#D7CCC8'
  ctx.fillRect(13, 16 + topTrim, 6, 8 - topTrim)
  ctx.fillStyle = '#5D4037'
  ctx.fillRect(8, 16 + topTrim, 2, Math.min(8, 8 - topTrim))
  ctx.fillRect(22, 16 + topTrim, 2, Math.min(8, 8 - topTrim))
}

// ===== NEW POSE DATA =====

function createSleepPoses(): PoseTemplate {
  return {
    action: 'sleep', resolution: 32,
    frames: [
      { index: 0, parts: { body: { dy: 2 }, eyes: { visible: false }, mouth: { dy: 1 } } },
      { index: 1, parts: { body: { dy: 1 }, eyes: { visible: false }, mouth: { dy: 1 } } },
      { index: 2, parts: { body: { dy: 0 }, eyes: { visible: false }, mouth: { dy: 0 } } },
      { index: 3, parts: { body: { dy: 1 }, eyes: { visible: false }, mouth: { dy: 1 } } },
      { index: 4, parts: { body: { dy: 2 }, eyes: { visible: false }, mouth: { dy: 1 } } },
      { index: 5, parts: { body: { dy: 1 }, eyes: { visible: false }, mouth: { dy: 0 } } }
    ]
  }
}

function createSitPoses(): PoseTemplate {
  return {
    action: 'sit', resolution: 32,
    frames: [
      { index: 0, parts: { body: { dy: 3 }, front_arm: { dy: 2 } } },
      { index: 1, parts: { body: { dy: 2 }, front_arm: { dy: 2 } } },
      { index: 2, parts: { body: { dy: 3 }, front_arm: { dy: 2 } } },
      { index: 3, parts: { body: { dy: 2 }, front_arm: { dy: 2 } } }
    ]
  }
}

function createEatPoses(): PoseTemplate {
  return {
    action: 'eat', resolution: 32,
    frames: [
      { index: 0, parts: { body: { dx: 0 }, front_arm: { dx: 1 }, mouth: { override: { layer: 'mouth', frame: 0 } } } },
      { index: 1, parts: { body: { dx: 0 }, front_arm: { dx: 1 }, mouth: { override: { layer: 'mouth', frame: 1 } } } },
      { index: 2, parts: { body: { dx: -1 }, front_arm: { dx: 1 }, mouth: { override: { layer: 'mouth', frame: 2 } } } },
      { index: 3, parts: { body: { dx: -1 }, front_arm: { dx: 1 }, mouth: { override: { layer: 'mouth', frame: 3 } } } },
      { index: 4, parts: { body: { dx: 0 }, front_arm: { dx: 0 }, mouth: { override: { layer: 'mouth', frame: 2 } } } },
      { index: 5, parts: { body: { dx: 0 }, front_arm: { dx: 0 }, mouth: { override: { layer: 'mouth', frame: 0 } } } }
    ]
  }
}

function createDancePoses(): PoseTemplate {
  return {
    action: 'dance', resolution: 32,
    frames: [
      { index: 0, parts: { body: { dx: 0 }, tail: { rotation: 0 }, front_arm: { dx: 0, override: { layer: 'front_arm', frame: 0 } } } },
      { index: 1, parts: { body: { dx: 1, dy: -1 }, tail: { rotation: 5 }, front_arm: { dx: 1, override: { layer: 'front_arm', frame: 1 } } } },
      { index: 2, parts: { body: { dx: 2 }, tail: { rotation: 10 }, front_arm: { dx: 1, override: { layer: 'front_arm', frame: 2 } } } },
      { index: 3, parts: { body: { dx: 1, dy: 1 }, tail: { rotation: 5 }, front_arm: { dx: 0, override: { layer: 'front_arm', frame: 3 } } } },
      { index: 4, parts: { body: { dx: 0 }, tail: { rotation: 0 }, front_arm: { dx: -1, override: { layer: 'front_arm', frame: 0 } } } },
      { index: 5, parts: { body: { dx: -1, dy: -1 }, tail: { rotation: -5 }, front_arm: { dx: -1, override: { layer: 'front_arm', frame: 1 } } } },
      { index: 6, parts: { body: { dx: -2 }, tail: { rotation: -10 }, front_arm: { dx: -1, override: { layer: 'front_arm', frame: 2 } } } },
      { index: 7, parts: { body: { dx: -1, dy: 1 }, tail: { rotation: -5 }, front_arm: { dx: 0, override: { layer: 'front_arm', frame: 3 } } } }
    ]
  }
}

function createSurprisePoses(): PoseTemplate {
  return {
    action: 'surprise', resolution: 32,
    frames: [
      { index: 0, parts: { body: { dy: 0 }, eyes: { override: { layer: 'eyes', frame: 0 } }, mouth: { dy: -1 } } },
      { index: 1, parts: { body: { dy: -2 }, eyes: { override: { layer: 'eyes', frame: 1 } }, mouth: { dy: -2 } } },
      { index: 2, parts: { body: { dy: -1 }, eyes: { override: { layer: 'eyes', frame: 2 } }, mouth: { dy: -1 } } }
    ]
  }
}

function createDodgePoses(): PoseTemplate {
  return {
    action: 'dodge', resolution: 32,
    frames: [
      { index: 0, parts: { body: { dx: 0 }, front_arm: { dx: 0 } } },
      { index: 1, parts: { body: { dx: 2, dy: -1 }, front_arm: { dx: 2 } } },
      { index: 2, parts: { body: { dx: 3, dy: -1 }, front_arm: { dx: 3 } } },
      { index: 3, parts: { body: { dx: 0 }, front_arm: { dx: 0 } } }
    ]
  }
}

// ===== BALLET POSE TEMPLATES =====

function createBalletPliéPoses(): PoseTemplate {
  return {
    action: 'plié', resolution: 32,
    frames: [
      { index: 0, parts: { body: { override: { layer: 'body', frame: 0 } } } },
      { index: 1, parts: { body: { override: { layer: 'body', frame: 1 } } } },
      { index: 2, parts: { body: { override: { layer: 'body', frame: 1 } }, tail: { rotation: -5 } } },
      { index: 3, parts: { body: { override: { layer: 'body', frame: 1 } }, tail: { rotation: 5 } } },
      { index: 4, parts: { body: { override: { layer: 'body', frame: 2 } } } },
      { index: 5, parts: { body: { override: { layer: 'body', frame: 0 } } } }
    ]
  }
}

function createBalletRelevéPoses(): PoseTemplate {
  return {
    action: 'relevé', resolution: 32,
    frames: [
      { index: 0, parts: { body: { override: { layer: 'body', frame: 0 } } } },
      { index: 1, parts: { body: { override: { layer: 'body', frame: 1 }, dy: -1 } } },
      { index: 2, parts: { body: { override: { layer: 'body', frame: 2 }, dy: -2 } } },
      { index: 3, parts: { body: { override: { layer: 'body', frame: 2 }, dy: -2 } } },
      { index: 4, parts: { body: { override: { layer: 'body', frame: 1 }, dy: -1 } } },
      { index: 5, parts: { body: { override: { layer: 'body', frame: 0 } } } }
    ]
  }
}

function createBalletPirouettePoses(): PoseTemplate {
  return {
    action: 'pirouette', resolution: 32,
    frames: [
      { index: 0, parts: { body: { override: { layer: 'body', frame: 0 } }, front_arm: { override: { layer: 'front_arm', frame: 0 } } } },
      { index: 1, parts: { body: { override: { layer: 'body', frame: 1 } }, front_arm: { override: { layer: 'front_arm', frame: 1 } } } },
      { index: 2, parts: { body: { override: { layer: 'body', frame: 2 } }, front_arm: { override: { layer: 'front_arm', frame: 1 } } } },
      { index: 3, parts: { body: { override: { layer: 'body', frame: 1 } }, front_arm: { override: { layer: 'front_arm', frame: 2 } } } },
      { index: 4, parts: { body: { override: { layer: 'body', frame: 0 } }, front_arm: { override: { layer: 'front_arm', frame: 0 } } } },
      { index: 5, parts: { body: { override: { layer: 'body', frame: 1 } }, front_arm: { override: { layer: 'front_arm', frame: 1 } } } },
      { index: 6, parts: { body: { override: { layer: 'body', frame: 0 } }, front_arm: { override: { layer: 'front_arm', frame: 0 } } } },
      { index: 7, parts: { body: { override: { layer: 'body', frame: 0 } } } }
    ]
  }
}

function createBalletArabesquePoses(): PoseTemplate {
  return {
    action: 'arabesque', resolution: 32,
    frames: [
      { index: 0, parts: { body: { override: { layer: 'body', frame: 0 } } } },
      { index: 1, parts: { body: { override: { layer: 'body', frame: 1 } } } },
      { index: 2, parts: { body: { override: { layer: 'body', frame: 2 } }, tail: { rotation: 5 } } },
      { index: 3, parts: { body: { override: { layer: 'body', frame: 2 } }, tail: { rotation: -5 } } },
      { index: 4, parts: { body: { override: { layer: 'body', frame: 1 } } } },
      { index: 5, parts: { body: { override: { layer: 'body', frame: 0 } } } }
    ]
  }
}

function createBalletBowPoses(): PoseTemplate {
  return {
    action: 'bow', resolution: 32,
    frames: [
      { index: 0, parts: { body: { override: { layer: 'body', frame: 0 } } } },
      { index: 1, parts: { body: { override: { layer: 'body', frame: 1 } }, tail: { rotation: 3 } } },
      { index: 2, parts: { body: { override: { layer: 'body', frame: 2 } }, tail: { rotation: 3 } } },
      { index: 3, parts: { body: { override: { layer: 'body', frame: 0 } }, tail: { rotation: 0 } } }
    ]
  }
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

// ===== RABBIT PALETTES =====

function createRabbitPalette(): PaletteDef {
  return {
    id: 'rabbit',
    name: 'Default Rabbit',
    mappings: [
      { from: [196, 168, 130], to: [196, 168, 130] },     // body beige (identity)
      { from: [232, 213, 183], to: [232, 213, 183] },     // belly (identity)
      { from: [245, 245, 245], to: [245, 245, 245] },     // white detail (identity)
      { from: [255, 105, 180], to: [255, 105, 180] },     // nose pink (identity)
      { from: [0, 0, 0], to: [0, 0, 0] }                  // black (identity)
    ]
  }
}

function createRabbitCottontailPalette(): PaletteDef {
  return {
    id: 'rabbit_cottontail',
    name: 'Cottontail Rabbit',
    mappings: [
      { from: [196, 168, 130], to: [160, 130, 90] },      // body → darker brown
      { from: [232, 213, 183], to: [210, 190, 160] },     // belly → tan
      { from: [245, 245, 245], to: [255, 255, 255] },     // white → pure white
      { from: [255, 105, 180], to: [255, 80, 160] },      // nose → deeper pink
      { from: [0, 0, 0], to: [20, 20, 20] }               // black → near-black
    ]
  }
}

function createRabbitSpottedPalette(): PaletteDef {
  return {
    id: 'rabbit_spotted',
    name: 'Spotted Rabbit',
    mappings: [
      { from: [196, 168, 130], to: [220, 200, 180] },     // body → cream
      { from: [232, 213, 183], to: [255, 255, 255] },     // belly → white
      { from: [245, 245, 245], to: [200, 200, 200] },     // white detail → gray
      { from: [255, 105, 180], to: [255, 130, 200] },     // nose → light pink
      { from: [0, 0, 0], to: [40, 40, 40] }               // black → dark gray
    ]
  }
}

// ===== PANDA PALETTES =====

function createPandaPalette(): PaletteDef {
  return {
    id: 'panda',
    name: 'Giant Panda',
    mappings: [
      { from: [255, 255, 255], to: [255, 255, 255] },     // white (identity)
      { from: [26, 26, 26], to: [26, 26, 26] },           // black (identity)
      { from: [0, 0, 0], to: [0, 0, 0] }                  // pure black (identity)
    ]
  }
}

function createPandaRedPalette(): PaletteDef {
  return {
    id: 'panda_red',
    name: 'Red Panda',
    mappings: [
      { from: [255, 255, 255], to: [212, 100, 58] },      // white → red fur
      { from: [26, 26, 26], to: [139, 69, 19] },          // black → brown
      { from: [0, 0, 0], to: [60, 40, 20] }               // pure black → dark brown
    ]
  }
}

// ===== FROG PALETTES =====

function createFrogPalette(): PaletteDef {
  return {
    id: 'frog',
    name: 'Green Frog',
    mappings: [
      { from: [76, 175, 80], to: [76, 175, 80] },         // green (identity)
      { from: [46, 125, 50], to: [46, 125, 50] },         // dark green (identity)
      { from: [200, 230, 201], to: [200, 230, 201] },     // light belly (identity)
      { from: [211, 47, 47], to: [211, 47, 47] },         // mouth red (identity)
      { from: [0, 0, 0], to: [0, 0, 0] }                  // black (identity)
    ]
  }
}

function createFrogBluePalette(): PaletteDef {
  return {
    id: 'frog_blue',
    name: 'Blue Dart Frog',
    mappings: [
      { from: [76, 175, 80], to: [33, 150, 243] },        // green → blue
      { from: [46, 125, 50], to: [21, 101, 192] },        // dark green → dark blue
      { from: [200, 230, 201], to: [187, 222, 251] },     // belly → light blue
      { from: [211, 47, 47], to: [255, 235, 59] },        // mouth → yellow
      { from: [0, 0, 0], to: [30, 30, 30] }               // black → dark
    ]
  }
}

// ===== PENGUIN PALETTES =====

function createPenguinPalette(): PaletteDef {
  return {
    id: 'penguin',
    name: 'Emperor Penguin',
    mappings: [
      { from: [26, 26, 26], to: [26, 26, 26] },           // black (identity)
      { from: [255, 255, 255], to: [255, 255, 255] },     // white (identity)
      { from: [255, 152, 0], to: [255, 152, 0] },         // orange (identity)
      { from: [0, 0, 0], to: [0, 0, 0] }                  // black detail (identity)
    ]
  }
}

function createPenguinKingPalette(): PaletteDef {
  return {
    id: 'penguin_king',
    name: 'King Penguin',
    mappings: [
      { from: [26, 26, 26], to: [40, 40, 50] },           // black → dark blue-gray
      { from: [255, 255, 255], to: [255, 255, 255] },     // white stays white
      { from: [255, 152, 0], to: [255, 193, 7] },         // orange → amber
      { from: [0, 0, 0], to: [30, 30, 40] }               // black → dark navy
    ]
  }
}

// ===== MOUSE PALETTES =====

function createMousePalette(): PaletteDef {
  return {
    id: 'mouse',
    name: 'Gray Mouse',
    mappings: [
      { from: [158, 158, 158], to: [158, 158, 158] },     // gray (identity)
      { from: [224, 224, 224], to: [224, 224, 224] },     // light gray (identity)
      { from: [255, 205, 210], to: [255, 205, 210] },     // pink ear (identity)
      { from: [244, 143, 177], to: [244, 143, 177] },     // pink nose (identity)
      { from: [0, 0, 0], to: [0, 0, 0] }                  // black (identity)
    ]
  }
}

function createMouseWhitePalette(): PaletteDef {
  return {
    id: 'mouse_white',
    name: 'White Mouse',
    mappings: [
      { from: [158, 158, 158], to: [245, 245, 245] },     // gray → white
      { from: [224, 224, 224], to: [255, 255, 255] },     // light gray → pure white
      { from: [255, 205, 210], to: [255, 180, 190] },     // pink ear → softer pink
      { from: [244, 143, 177], to: [255, 150, 180] },     // pink nose → light pink
      { from: [0, 0, 0], to: [80, 80, 80] }               // black → dark gray
    ]
  }
}

// ===== BEAR PALETTES =====

function createBearPalette(): PaletteDef {
  return {
    id: 'bear',
    name: 'Brown Bear',
    mappings: [
      { from: [141, 110, 99], to: [141, 110, 99] },       // brown (identity)
      { from: [161, 136, 127], to: [161, 136, 127] },     // light brown (identity)
      { from: [62, 39, 35], to: [62, 39, 35] },           // dark brown (identity)
      { from: [0, 0, 0], to: [0, 0, 0] }                  // black (identity)
    ]
  }
}

function createBearPolarPalette(): PaletteDef {
  return {
    id: 'bear_polar',
    name: 'Polar Bear',
    mappings: [
      { from: [141, 110, 99], to: [236, 239, 241] },      // brown → white
      { from: [161, 136, 127], to: [255, 255, 255] },     // light brown → pure white
      { from: [62, 39, 35], to: [176, 190, 197] },        // dark brown → light gray
      { from: [0, 0, 0], to: [60, 70, 80] }               // black → dark gray-blue
    ]
  }
}

// ===== KOALA PALETTES =====

function createKoalaPalette(): PaletteDef {
  return {
    id: 'koala',
    name: 'Gray Koala',
    mappings: [
      { from: [120, 144, 156], to: [120, 144, 156] },     // gray (identity)
      { from: [207, 216, 220], to: [207, 216, 220] },     // light belly (identity)
      { from: [26, 26, 26], to: [26, 26, 26] },           // black nose (identity)
      { from: [0, 0, 0], to: [0, 0, 0] }                  // black (identity)
    ]
  }
}

function createKoalaGoldenPalette(): PaletteDef {
  return {
    id: 'koala_golden',
    name: 'Golden Koala',
    mappings: [
      { from: [120, 144, 156], to: [255, 183, 77] },      // gray → golden
      { from: [207, 216, 220], to: [255, 224, 178] },     // belly → light gold
      { from: [26, 26, 26], to: [245, 124, 0] },          // black nose → dark orange
      { from: [0, 0, 0], to: [80, 50, 20] }               // black → brown
    ]
  }
}

// ===== OWL PALETTES =====

function createOwlPalette(): PaletteDef {
  return {
    id: 'owl',
    name: 'Brown Owl',
    mappings: [
      { from: [121, 85, 72], to: [121, 85, 72] },         // brown (identity)
      { from: [93, 64, 55], to: [93, 64, 55] },           // dark brown (identity)
      { from: [215, 204, 200], to: [215, 204, 200] },     // belly cream (identity)
      { from: [255, 193, 7], to: [255, 193, 7] },         // yellow eyes (identity)
      { from: [255, 152, 0], to: [255, 152, 0] },         // orange beak (identity)
      { from: [0, 0, 0], to: [0, 0, 0] }                  // black (identity)
    ]
  }
}

function createOwlSnowPalette(): PaletteDef {
  return {
    id: 'owl_snow',
    name: 'Snow Owl',
    mappings: [
      { from: [121, 85, 72], to: [236, 239, 241] },       // brown → white
      { from: [93, 64, 55], to: [200, 210, 215] },        // dark brown → gray
      { from: [215, 204, 200], to: [255, 255, 255] },     // belly → pure white
      { from: [255, 193, 7], to: [255, 235, 59] },        // eyes → bright yellow
      { from: [255, 152, 0], to: [255, 200, 100] },       // beak → light orange
      { from: [0, 0, 0], to: [60, 70, 80] }               // black → dark gray-blue
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
  poses.set('plié', createBalletPliéPoses())
  poses.set('relevé', createBalletRelevéPoses())
  poses.set('pirouette', createBalletPirouettePoses())
  poses.set('arabesque', createBalletArabesquePoses())
  poses.set('bow', createBalletBowPoses())

  const overrides = new Map<string, Map<number, ImageBitmap>>()
  overrides.set('wave_front_arm', createScaledSpritesheet(4, drawRaccoonWaveFrontArm, resolution))
  overrides.set('jump_body', createScaledSpritesheet(5, drawRaccoonJumpBody, resolution))
  overrides.set('plié_body', createScaledSpritesheet(3, drawRaccoonBalletPliéBody, resolution))
  overrides.set('relevé_body', createScaledSpritesheet(3, drawRaccoonBalletRelevéBody, resolution))
  overrides.set('pirouette_body', createScaledSpritesheet(3, drawRaccoonBalletPirouetteBody, resolution))
  overrides.set('arabesque_body', createScaledSpritesheet(3, drawRaccoonBalletArabesqueBody, resolution))
  overrides.set('bow_body', createScaledSpritesheet(3, drawRaccoonBalletBowBody, resolution))

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
  poses.set('plié', createBalletPliéPoses())
  poses.set('relevé', createBalletRelevéPoses())
  poses.set('pirouette', createBalletPirouettePoses())
  poses.set('arabesque', createBalletArabesquePoses())
  poses.set('bow', createBalletBowPoses())

  const overrides = new Map<string, Map<number, ImageBitmap>>()
  overrides.set('wave_front_arm', createScaledSpritesheet(4, drawCatWaveFrontArm, resolution))
  overrides.set('jump_body', createScaledSpritesheet(5, drawCatJumpBody, resolution))
  overrides.set('plié_body', createScaledSpritesheet(3, drawCatBalletPliéBody, resolution))
  overrides.set('relevé_body', createScaledSpritesheet(3, drawCatBalletRelevéBody, resolution))
  overrides.set('pirouette_body', createScaledSpritesheet(3, drawCatBalletPirouetteBody, resolution))
  overrides.set('arabesque_body', createScaledSpritesheet(3, drawCatBalletArabesqueBody, resolution))
  overrides.set('bow_body', createScaledSpritesheet(3, drawCatBalletBowBody, resolution))

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
  poses.set('plié', createBalletPliéPoses())
  poses.set('relevé', createBalletRelevéPoses())
  poses.set('pirouette', createBalletPirouettePoses())
  poses.set('arabesque', createBalletArabesquePoses())
  poses.set('bow', createBalletBowPoses())

  const overrides = new Map<string, Map<number, ImageBitmap>>()
  overrides.set('wave_front_arm', createScaledSpritesheet(4, drawFoxWaveFrontArm, resolution))
  overrides.set('jump_body', createScaledSpritesheet(5, drawFoxJumpBody, resolution))
  overrides.set('plié_body', createScaledSpritesheet(3, drawFoxBalletPliéBody, resolution))
  overrides.set('relevé_body', createScaledSpritesheet(3, drawFoxBalletRelevéBody, resolution))
  overrides.set('pirouette_body', createScaledSpritesheet(3, drawFoxBalletPirouetteBody, resolution))
  overrides.set('arabesque_body', createScaledSpritesheet(3, drawFoxBalletArabesqueBody, resolution))
  overrides.set('bow_body', createScaledSpritesheet(3, drawFoxBalletBowBody, resolution))

  const palettes: PaletteDef[] = [
    createFoxPalette(),
    createFoxArcticPalette()
  ]

  return { parts, poses, overrides, palettes }
}

// ===== NEW FACTORIES =====

function createRabbitAssets(resolution: number): TestAssets {
  const parts = new Map<string, ImageBitmap>()
  parts.set('shadow', createScaled(drawRabbitShadow, resolution))
  parts.set('tail', createScaled(drawRabbitTail, resolution))
  parts.set('body', createScaled(drawRabbitBody, resolution))
  parts.set('ears', createScaled(drawRabbitEars, resolution))
  parts.set('front_arm', createScaled(drawRabbitFrontArm, resolution))
  parts.set('eyes', createScaled(drawRabbitEyes, resolution))
  parts.set('mouth', createScaled(drawRabbitMouth, resolution))
  parts.set('accessory_hat', createScaled(drawTopHat, resolution))
  parts.set('accessory_glasses', createScaled(drawGlasses, resolution))

  const poses = new Map<string, PoseTemplate>()
  poses.set('idle', createIdlePoses())
  poses.set('jump', createJumpPoses())
  poses.set('wave', createWavePoses())
  poses.set('walk', createWalkPoses())
  poses.set('sleep', createSleepPoses())
  poses.set('sit', createSitPoses())
  poses.set('eat', createEatPoses())
  poses.set('dance', createDancePoses())
  poses.set('surprise', createSurprisePoses())
  poses.set('dodge', createDodgePoses())
  poses.set('plié', createBalletPliéPoses())
  poses.set('relevé', createBalletRelevéPoses())
  poses.set('pirouette', createBalletPirouettePoses())
  poses.set('arabesque', createBalletArabesquePoses())
  poses.set('bow', createBalletBowPoses())

  const overrides = new Map<string, Map<number, ImageBitmap>>()
  overrides.set('wave_front_arm', createScaledSpritesheet(4, drawRabbitWaveFrontArm, resolution))
  overrides.set('jump_body', createScaledSpritesheet(5, drawRabbitJumpBody, resolution))
  overrides.set('eat_mouth', createScaledSpritesheet(4, drawRabbitEatMouth, resolution))
  overrides.set('surprise_eyes', createScaledSpritesheet(3, drawRabbitSurpriseEyes, resolution))
  overrides.set('dance_front_arm', createScaledSpritesheet(4, drawRabbitDanceArms, resolution))
  overrides.set('plié_body', createScaledSpritesheet(3, drawRabbitBalletPliéBody, resolution))
  overrides.set('relevé_body', createScaledSpritesheet(3, drawRabbitBalletRelevéBody, resolution))
  overrides.set('pirouette_body', createScaledSpritesheet(3, drawRabbitBalletPirouetteBody, resolution))
  overrides.set('arabesque_body', createScaledSpritesheet(3, drawRabbitBalletArabesqueBody, resolution))
  overrides.set('bow_body', createScaledSpritesheet(3, drawRabbitBalletBowBody, resolution))

  const palettes: PaletteDef[] = [
    createRabbitPalette(),
    createRabbitCottontailPalette(),
    createRabbitSpottedPalette()
  ]

  return { parts, poses, overrides, palettes }
}

function createPandaAssets(resolution: number): TestAssets {
  const parts = new Map<string, ImageBitmap>()
  parts.set('shadow', createScaled(drawPandaShadow, resolution))
  parts.set('tail', createScaled(drawPandaTail, resolution))
  parts.set('body', createScaled(drawPandaBody, resolution))
  parts.set('ears', createScaled(drawPandaEars, resolution))
  parts.set('front_arm', createScaled(drawPandaFrontArm, resolution))
  parts.set('eyes', createScaled(drawPandaEyes, resolution))
  parts.set('mouth', createScaled(drawPandaMouth, resolution))
  parts.set('accessory_hat', createScaled(drawTopHat, resolution))
  parts.set('accessory_glasses', createScaled(drawGlasses, resolution))

  const poses = new Map<string, PoseTemplate>()
  poses.set('idle', createIdlePoses())
  poses.set('jump', createJumpPoses())
  poses.set('wave', createWavePoses())
  poses.set('walk', createWalkPoses())
  poses.set('sleep', createSleepPoses())
  poses.set('sit', createSitPoses())
  poses.set('eat', createEatPoses())
  poses.set('dance', createDancePoses())
  poses.set('surprise', createSurprisePoses())
  poses.set('dodge', createDodgePoses())
  poses.set('plié', createBalletPliéPoses())
  poses.set('relevé', createBalletRelevéPoses())
  poses.set('pirouette', createBalletPirouettePoses())
  poses.set('arabesque', createBalletArabesquePoses())
  poses.set('bow', createBalletBowPoses())

  const overrides = new Map<string, Map<number, ImageBitmap>>()
  overrides.set('wave_front_arm', createScaledSpritesheet(4, drawPandaWaveFrontArm, resolution))
  overrides.set('jump_body', createScaledSpritesheet(5, drawPandaJumpBody, resolution))
  overrides.set('eat_mouth', createScaledSpritesheet(4, drawPandaEatMouth, resolution))
  overrides.set('surprise_eyes', createScaledSpritesheet(3, drawPandaSurpriseEyes, resolution))
  overrides.set('dance_front_arm', createScaledSpritesheet(4, drawPandaDanceArms, resolution))
  overrides.set('plié_body', createScaledSpritesheet(3, drawPandaBalletPliéBody, resolution))
  overrides.set('relevé_body', createScaledSpritesheet(3, drawPandaBalletRelevéBody, resolution))
  overrides.set('pirouette_body', createScaledSpritesheet(3, drawPandaBalletPirouetteBody, resolution))
  overrides.set('arabesque_body', createScaledSpritesheet(3, drawPandaBalletArabesqueBody, resolution))
  overrides.set('bow_body', createScaledSpritesheet(3, drawPandaBalletBowBody, resolution))

  const palettes: PaletteDef[] = [
    createPandaPalette(),
    createPandaRedPalette()
  ]

  return { parts, poses, overrides, palettes }
}

function createFrogAssets(resolution: number): TestAssets {
  const parts = new Map<string, ImageBitmap>()
  parts.set('shadow', createScaled(drawFrogShadow, resolution))
  parts.set('tail', createScaled(drawFrogTail, resolution))
  parts.set('body', createScaled(drawFrogBody, resolution))
  parts.set('ears', createScaled(drawFrogEars, resolution))
  parts.set('front_arm', createScaled(drawFrogFrontArm, resolution))
  parts.set('eyes', createScaled(drawFrogEyes, resolution))
  parts.set('mouth', createScaled(drawFrogMouth, resolution))
  parts.set('accessory_hat', createScaled(drawTopHat, resolution))
  parts.set('accessory_glasses', createScaled(drawGlasses, resolution))

  const poses = new Map<string, PoseTemplate>()
  poses.set('idle', createIdlePoses())
  poses.set('jump', createJumpPoses())
  poses.set('wave', createWavePoses())
  poses.set('walk', createWalkPoses())
  poses.set('sleep', createSleepPoses())
  poses.set('sit', createSitPoses())
  poses.set('eat', createEatPoses())
  poses.set('dance', createDancePoses())
  poses.set('surprise', createSurprisePoses())
  poses.set('dodge', createDodgePoses())
  poses.set('plié', createBalletPliéPoses())
  poses.set('relevé', createBalletRelevéPoses())
  poses.set('pirouette', createBalletPirouettePoses())
  poses.set('arabesque', createBalletArabesquePoses())
  poses.set('bow', createBalletBowPoses())

  const overrides = new Map<string, Map<number, ImageBitmap>>()
  overrides.set('wave_front_arm', createScaledSpritesheet(4, drawFrogWaveFrontArm, resolution))
  overrides.set('jump_body', createScaledSpritesheet(5, drawFrogJumpBody, resolution))
  overrides.set('eat_mouth', createScaledSpritesheet(4, drawFrogEatMouth, resolution))
  overrides.set('surprise_eyes', createScaledSpritesheet(3, drawFrogSurpriseEyes, resolution))
  overrides.set('dance_front_arm', createScaledSpritesheet(4, drawFrogDanceArms, resolution))
  overrides.set('plié_body', createScaledSpritesheet(3, drawFrogBalletPliéBody, resolution))
  overrides.set('relevé_body', createScaledSpritesheet(3, drawFrogBalletRelevéBody, resolution))
  overrides.set('pirouette_body', createScaledSpritesheet(3, drawFrogBalletPirouetteBody, resolution))
  overrides.set('arabesque_body', createScaledSpritesheet(3, drawFrogBalletArabesqueBody, resolution))
  overrides.set('bow_body', createScaledSpritesheet(3, drawFrogBalletBowBody, resolution))

  const palettes: PaletteDef[] = [
    createFrogPalette(),
    createFrogBluePalette()
  ]

  return { parts, poses, overrides, palettes }
}

function createPenguinAssets(resolution: number): TestAssets {
  const parts = new Map<string, ImageBitmap>()
  parts.set('shadow', createScaled(drawPenguinShadow, resolution))
  parts.set('tail', createScaled(drawPenguinTail, resolution))
  parts.set('body', createScaled(drawPenguinBody, resolution))
  parts.set('ears', createScaled(drawPenguinEars, resolution))
  parts.set('front_arm', createScaled(drawPenguinFrontArm, resolution))
  parts.set('eyes', createScaled(drawPenguinEyes, resolution))
  parts.set('mouth', createScaled(drawPenguinMouth, resolution))
  parts.set('accessory_hat', createScaled(drawTopHat, resolution))
  parts.set('accessory_glasses', createScaled(drawGlasses, resolution))

  const poses = new Map<string, PoseTemplate>()
  poses.set('idle', createIdlePoses())
  poses.set('jump', createJumpPoses())
  poses.set('wave', createWavePoses())
  poses.set('walk', createWalkPoses())
  poses.set('sleep', createSleepPoses())
  poses.set('sit', createSitPoses())
  poses.set('eat', createEatPoses())
  poses.set('dance', createDancePoses())
  poses.set('surprise', createSurprisePoses())
  poses.set('dodge', createDodgePoses())
  poses.set('plié', createBalletPliéPoses())
  poses.set('relevé', createBalletRelevéPoses())
  poses.set('pirouette', createBalletPirouettePoses())
  poses.set('arabesque', createBalletArabesquePoses())
  poses.set('bow', createBalletBowPoses())

  const overrides = new Map<string, Map<number, ImageBitmap>>()
  overrides.set('wave_front_arm', createScaledSpritesheet(4, drawPenguinWaveFrontArm, resolution))
  overrides.set('jump_body', createScaledSpritesheet(5, drawPenguinJumpBody, resolution))
  overrides.set('eat_mouth', createScaledSpritesheet(4, drawPenguinEatMouth, resolution))
  overrides.set('surprise_eyes', createScaledSpritesheet(3, drawPenguinSurpriseEyes, resolution))
  overrides.set('dance_front_arm', createScaledSpritesheet(4, drawPenguinDanceArms, resolution))
  overrides.set('plié_body', createScaledSpritesheet(3, drawPenguinBalletPliéBody, resolution))
  overrides.set('relevé_body', createScaledSpritesheet(3, drawPenguinBalletRelevéBody, resolution))
  overrides.set('pirouette_body', createScaledSpritesheet(3, drawPenguinBalletPirouetteBody, resolution))
  overrides.set('arabesque_body', createScaledSpritesheet(3, drawPenguinBalletArabesqueBody, resolution))
  overrides.set('bow_body', createScaledSpritesheet(3, drawPenguinBalletBowBody, resolution))

  const palettes: PaletteDef[] = [
    createPenguinPalette(),
    createPenguinKingPalette()
  ]

  return { parts, poses, overrides, palettes }
}

function createMouseAssets(resolution: number): TestAssets {
  const parts = new Map<string, ImageBitmap>()
  parts.set('shadow', createScaled(drawMouseShadow, resolution))
  parts.set('tail', createScaled(drawMouseTail, resolution))
  parts.set('body', createScaled(drawMouseBody, resolution))
  parts.set('ears', createScaled(drawMouseEars, resolution))
  parts.set('front_arm', createScaled(drawMouseFrontArm, resolution))
  parts.set('eyes', createScaled(drawMouseEyes, resolution))
  parts.set('mouth', createScaled(drawMouseMouth, resolution))
  parts.set('accessory_hat', createScaled(drawTopHat, resolution))
  parts.set('accessory_glasses', createScaled(drawGlasses, resolution))

  const poses = new Map<string, PoseTemplate>()
  poses.set('idle', createIdlePoses())
  poses.set('jump', createJumpPoses())
  poses.set('wave', createWavePoses())
  poses.set('walk', createWalkPoses())
  poses.set('sleep', createSleepPoses())
  poses.set('sit', createSitPoses())
  poses.set('eat', createEatPoses())
  poses.set('dance', createDancePoses())
  poses.set('surprise', createSurprisePoses())
  poses.set('dodge', createDodgePoses())
  poses.set('plié', createBalletPliéPoses())
  poses.set('relevé', createBalletRelevéPoses())
  poses.set('pirouette', createBalletPirouettePoses())
  poses.set('arabesque', createBalletArabesquePoses())
  poses.set('bow', createBalletBowPoses())

  const overrides = new Map<string, Map<number, ImageBitmap>>()
  overrides.set('wave_front_arm', createScaledSpritesheet(4, drawMouseWaveFrontArm, resolution))
  overrides.set('jump_body', createScaledSpritesheet(5, drawMouseJumpBody, resolution))
  overrides.set('eat_mouth', createScaledSpritesheet(4, drawMouseEatMouth, resolution))
  overrides.set('surprise_eyes', createScaledSpritesheet(3, drawMouseSurpriseEyes, resolution))
  overrides.set('dance_front_arm', createScaledSpritesheet(4, drawMouseDanceArms, resolution))
  overrides.set('plié_body', createScaledSpritesheet(3, drawMouseBalletPliéBody, resolution))
  overrides.set('relevé_body', createScaledSpritesheet(3, drawMouseBalletRelevéBody, resolution))
  overrides.set('pirouette_body', createScaledSpritesheet(3, drawMouseBalletPirouetteBody, resolution))
  overrides.set('arabesque_body', createScaledSpritesheet(3, drawMouseBalletArabesqueBody, resolution))
  overrides.set('bow_body', createScaledSpritesheet(3, drawMouseBalletBowBody, resolution))

  const palettes: PaletteDef[] = [
    createMousePalette(),
    createMouseWhitePalette()
  ]

  return { parts, poses, overrides, palettes }
}

function createBearAssets(resolution: number): TestAssets {
  const parts = new Map<string, ImageBitmap>()
  parts.set('shadow', createScaled(drawBearShadow, resolution))
  parts.set('tail', createScaled(drawBearTail, resolution))
  parts.set('body', createScaled(drawBearBody, resolution))
  parts.set('ears', createScaled(drawBearEars, resolution))
  parts.set('front_arm', createScaled(drawBearFrontArm, resolution))
  parts.set('eyes', createScaled(drawBearEyes, resolution))
  parts.set('mouth', createScaled(drawBearMouth, resolution))
  parts.set('accessory_hat', createScaled(drawTopHat, resolution))
  parts.set('accessory_glasses', createScaled(drawGlasses, resolution))

  const poses = new Map<string, PoseTemplate>()
  poses.set('idle', createIdlePoses())
  poses.set('jump', createJumpPoses())
  poses.set('wave', createWavePoses())
  poses.set('walk', createWalkPoses())
  poses.set('sleep', createSleepPoses())
  poses.set('sit', createSitPoses())
  poses.set('eat', createEatPoses())
  poses.set('dance', createDancePoses())
  poses.set('surprise', createSurprisePoses())
  poses.set('dodge', createDodgePoses())
  poses.set('plié', createBalletPliéPoses())
  poses.set('relevé', createBalletRelevéPoses())
  poses.set('pirouette', createBalletPirouettePoses())
  poses.set('arabesque', createBalletArabesquePoses())
  poses.set('bow', createBalletBowPoses())

  const overrides = new Map<string, Map<number, ImageBitmap>>()
  overrides.set('wave_front_arm', createScaledSpritesheet(4, drawBearWaveFrontArm, resolution))
  overrides.set('jump_body', createScaledSpritesheet(5, drawBearJumpBody, resolution))
  overrides.set('eat_mouth', createScaledSpritesheet(4, drawBearEatMouth, resolution))
  overrides.set('surprise_eyes', createScaledSpritesheet(3, drawBearSurpriseEyes, resolution))
  overrides.set('dance_front_arm', createScaledSpritesheet(4, drawBearDanceArms, resolution))
  overrides.set('plié_body', createScaledSpritesheet(3, drawBearBalletPliéBody, resolution))
  overrides.set('relevé_body', createScaledSpritesheet(3, drawBearBalletRelevéBody, resolution))
  overrides.set('pirouette_body', createScaledSpritesheet(3, drawBearBalletPirouetteBody, resolution))
  overrides.set('arabesque_body', createScaledSpritesheet(3, drawBearBalletArabesqueBody, resolution))
  overrides.set('bow_body', createScaledSpritesheet(3, drawBearBalletBowBody, resolution))

  const palettes: PaletteDef[] = [
    createBearPalette(),
    createBearPolarPalette()
  ]

  return { parts, poses, overrides, palettes }
}

function createKoalaAssets(resolution: number): TestAssets {
  const parts = new Map<string, ImageBitmap>()
  parts.set('shadow', createScaled(drawKoalaShadow, resolution))
  parts.set('tail', createScaled(drawKoalaTail, resolution))
  parts.set('body', createScaled(drawKoalaBody, resolution))
  parts.set('ears', createScaled(drawKoalaEars, resolution))
  parts.set('front_arm', createScaled(drawKoalaFrontArm, resolution))
  parts.set('eyes', createScaled(drawKoalaEyes, resolution))
  parts.set('mouth', createScaled(drawKoalaMouth, resolution))
  parts.set('accessory_hat', createScaled(drawTopHat, resolution))
  parts.set('accessory_glasses', createScaled(drawGlasses, resolution))

  const poses = new Map<string, PoseTemplate>()
  poses.set('idle', createIdlePoses())
  poses.set('jump', createJumpPoses())
  poses.set('wave', createWavePoses())
  poses.set('walk', createWalkPoses())
  poses.set('sleep', createSleepPoses())
  poses.set('sit', createSitPoses())
  poses.set('eat', createEatPoses())
  poses.set('dance', createDancePoses())
  poses.set('surprise', createSurprisePoses())
  poses.set('dodge', createDodgePoses())
  poses.set('plié', createBalletPliéPoses())
  poses.set('relevé', createBalletRelevéPoses())
  poses.set('pirouette', createBalletPirouettePoses())
  poses.set('arabesque', createBalletArabesquePoses())
  poses.set('bow', createBalletBowPoses())

  const overrides = new Map<string, Map<number, ImageBitmap>>()
  overrides.set('wave_front_arm', createScaledSpritesheet(4, drawKoalaWaveFrontArm, resolution))
  overrides.set('jump_body', createScaledSpritesheet(5, drawKoalaJumpBody, resolution))
  overrides.set('eat_mouth', createScaledSpritesheet(4, drawKoalaEatMouth, resolution))
  overrides.set('surprise_eyes', createScaledSpritesheet(3, drawKoalaSurpriseEyes, resolution))
  overrides.set('dance_front_arm', createScaledSpritesheet(4, drawKoalaDanceArms, resolution))
  overrides.set('plié_body', createScaledSpritesheet(3, drawKoalaBalletPliéBody, resolution))
  overrides.set('relevé_body', createScaledSpritesheet(3, drawKoalaBalletRelevéBody, resolution))
  overrides.set('pirouette_body', createScaledSpritesheet(3, drawKoalaBalletPirouetteBody, resolution))
  overrides.set('arabesque_body', createScaledSpritesheet(3, drawKoalaBalletArabesqueBody, resolution))
  overrides.set('bow_body', createScaledSpritesheet(3, drawKoalaBalletBowBody, resolution))

  const palettes: PaletteDef[] = [
    createKoalaPalette(),
    createKoalaGoldenPalette()
  ]

  return { parts, poses, overrides, palettes }
}

function createOwlAssets(resolution: number): TestAssets {
  const parts = new Map<string, ImageBitmap>()
  parts.set('shadow', createScaled(drawOwlShadow, resolution))
  parts.set('tail', createScaled(drawOwlTail, resolution))
  parts.set('body', createScaled(drawOwlBody, resolution))
  parts.set('ears', createScaled(drawOwlEars, resolution))
  parts.set('front_arm', createScaled(drawOwlFrontArm, resolution))
  parts.set('eyes', createScaled(drawOwlEyes, resolution))
  parts.set('mouth', createScaled(drawOwlMouth, resolution))
  parts.set('accessory_hat', createScaled(drawTopHat, resolution))
  parts.set('accessory_glasses', createScaled(drawGlasses, resolution))

  const poses = new Map<string, PoseTemplate>()
  poses.set('idle', createIdlePoses())
  poses.set('jump', createJumpPoses())
  poses.set('wave', createWavePoses())
  poses.set('walk', createWalkPoses())
  poses.set('sleep', createSleepPoses())
  poses.set('sit', createSitPoses())
  poses.set('eat', createEatPoses())
  poses.set('dance', createDancePoses())
  poses.set('surprise', createSurprisePoses())
  poses.set('dodge', createDodgePoses())
  poses.set('plié', createBalletPliéPoses())
  poses.set('relevé', createBalletRelevéPoses())
  poses.set('pirouette', createBalletPirouettePoses())
  poses.set('arabesque', createBalletArabesquePoses())
  poses.set('bow', createBalletBowPoses())

  const overrides = new Map<string, Map<number, ImageBitmap>>()
  overrides.set('wave_front_arm', createScaledSpritesheet(4, drawOwlWaveFrontArm, resolution))
  overrides.set('jump_body', createScaledSpritesheet(5, drawOwlJumpBody, resolution))
  overrides.set('eat_mouth', createScaledSpritesheet(4, drawOwlEatMouth, resolution))
  overrides.set('surprise_eyes', createScaledSpritesheet(3, drawOwlSurpriseEyes, resolution))
  overrides.set('dance_front_arm', createScaledSpritesheet(4, drawOwlDanceArms, resolution))
  overrides.set('plié_body', createScaledSpritesheet(3, drawOwlBalletPliéBody, resolution))
  overrides.set('relevé_body', createScaledSpritesheet(3, drawOwlBalletRelevéBody, resolution))
  overrides.set('pirouette_body', createScaledSpritesheet(3, drawOwlBalletPirouetteBody, resolution))
  overrides.set('arabesque_body', createScaledSpritesheet(3, drawOwlBalletArabesqueBody, resolution))
  overrides.set('bow_body', createScaledSpritesheet(3, drawOwlBalletBowBody, resolution))

  const palettes: PaletteDef[] = [
    createOwlPalette(),
    createOwlSnowPalette()
  ]

  return { parts, poses, overrides, palettes }
}

// ===== ANIMAL FACTORIES LOOKUP =====

export const ANIMAL_FACTORIES: Record<string, (resolution: number) => TestAssets> = {
  raccoon: createRaccoonAssets,
  cat: createCatAssets,
  fox: createFoxAssets,
  rabbit: createRabbitAssets,
  panda: createPandaAssets,
  frog: createFrogAssets,
  penguin: createPenguinAssets,
  mouse: createMouseAssets,
  bear: createBearAssets,
  koala: createKoalaAssets,
  owl: createOwlAssets
}

// ===== LEGACY EXPORT (kept for backward compatibility) =====

export function createTestAssets(): TestAssets {
  return createRaccoonAssets(32)
}
