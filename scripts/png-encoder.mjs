/**
 * Minimal PNG encoder using only Node.js built-in zlib.
 * No external dependencies needed.
 * Generates valid RGBA PNG files.
 */
import { deflateSync } from 'zlib'

// CRC32 lookup table
const CRC_TABLE = new Uint32Array(256)
for (let i = 0; i < 256; i++) {
  let c = i
  for (let j = 0; j < 8; j++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
  }
  CRC_TABLE[i] = c
}

function crc32(buf) {
  let crc = 0xFFFFFFFF
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8)
  }
  return (crc ^ 0xFFFFFFFF) >>> 0
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const typeB = Buffer.from(type, 'ascii')
  const crcInput = Buffer.concat([typeB, data])
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(crcInput))
  return Buffer.concat([len, typeB, data, crcBuf])
}

/**
 * Create a valid PNG from raw RGBA pixel data.
 * @param {number} width
 * @param {number} height
 * @param {Uint8Array} pixels - RGBA pixel values, length = width * height * 4
 * @returns {Buffer} Complete PNG file as Buffer
 */
export function createPNG(width, height, pixels) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  // IHDR
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8   // bit depth
  ihdr[9] = 6   // color type: RGBA (truecolor with alpha)
  ihdr[10] = 0  // compression: deflate
  ihdr[11] = 0  // filter: adaptive
  ihdr[12] = 0  // interlace: none

  // IDAT: filter byte (None=0) + scanlines
  const rowSize = 1 + width * 4
  const rawData = Buffer.alloc(height * rowSize)
  for (let y = 0; y < height; y++) {
    rawData[y * rowSize] = 0 // filter: None
    const rowStart = y * width * 4
    for (let x = 0; x < width * 4; x++) {
      rawData[y * rowSize + 1 + x] = pixels[rowStart + x]
    }
  }
  const compressed = deflateSync(rawData, { level: 6 })

  return Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

/**
 * Create a solid-color placeholder PNG.
 */
export function createSolidPNG(width, height, r, g, b, a = 255) {
  const pixels = new Uint8Array(width * height * 4)
  for (let i = 0; i < width * height; i++) {
    const off = i * 4
    pixels[off] = r
    pixels[off + 1] = g
    pixels[off + 2] = b
    pixels[off + 3] = a
  }
  return createPNG(width, height, pixels)
}

/**
 * Create a placeholder PNG with a circle drawn on transparent background.
 */
export function createCirclePNG(width, height, cx, cy, radius, r, g, b, a = 255) {
  const pixels = new Uint8Array(width * height * 4)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const off = (y * width + x) * 4
      const dx = x - cx
      const dy = y - cy
      if (dx * dx + dy * dy <= radius * radius) {
        pixels[off] = r
        pixels[off + 1] = g
        pixels[off + 2] = b
        pixels[off + 3] = a
      } else {
        pixels[off + 3] = 0 // transparent
      }
    }
  }
  return createPNG(width, height, pixels)
}

/**
 * Create a placeholder PNG with a horizontal oval (ellipse) shape.
 */
export function createOvalPNG(width, height, cx, cy, rx, ry, r, g, b, a = 255) {
  const pixels = new Uint8Array(width * height * 4)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const off = (y * width + x) * 4
      const dx = (x - cx) / rx
      const dy = (y - cy) / ry
      if (dx * dx + dy * dy <= 1) {
        pixels[off] = r
        pixels[off + 1] = g
        pixels[off + 2] = b
        pixels[off + 3] = a
      } else {
        pixels[off + 3] = 0
      }
    }
  }
  return createPNG(width, height, pixels)
}

/**
 * Create a character body silhouette with basic shape.
 */
export function createBodyPNG(width, height, bodyColor, earColor, eyeColor, mouthColor, shadowColor) {
  const [br, bg, bb] = bodyColor
  const [er, eg, eb] = earColor
  const [eyr, eyg, eyb] = eyeColor
  const [mr, mg, mb] = mouthColor
  const [sr, sg, sb] = shadowColor
  const pixels = new Uint8Array(width * height * 4)

  const cx = Math.floor(width / 2)
  const cy = Math.floor(height / 2)
  const bodyR = Math.floor(width * 0.3)
  const earR = Math.floor(width * 0.12)
  const eyeR = Math.max(1, Math.floor(width * 0.06))

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const off = (y * width + x) * 4

      // Shadow at bottom (subtle gradient)
      if (y > height * 0.7 && y < height) {
        const distFromBottom = (height - y) / (height * 0.3)
        pixels[off] = sr
        pixels[off + 1] = sg
        pixels[off + 2] = sb
        pixels[off + 3] = Math.floor(80 * distFromBottom)
        continue
      }

      // Body (large oval)
      const dxBody = (x - cx) / bodyR
      const dyBody = (y - cy - 1) / (bodyR * 1.3)
      if (dxBody * dxBody + dyBody * dyBody <= 1) {
        pixels[off] = br
        pixels[off + 1] = bg
        pixels[off + 2] = bb
        pixels[off + 3] = 255
        continue
      }

      // Ears (two small circles)
      for (const [ex, ey] of [[cx - Math.floor(width * 0.2), Math.floor(height * 0.15)], [cx + Math.floor(width * 0.2), Math.floor(height * 0.15)]]) {
        const de = (x - ex) * (x - ex) + (y - ey) * (y - ey)
        if (de <= earR * earR) {
          pixels[off] = er
          pixels[off + 1] = eg
          pixels[off + 2] = eb
          pixels[off + 3] = 255
        }
      }

      // Eyes (two tiny dots)
      if (eyeR > 0) {
        for (const [ex, ey] of [[cx - Math.floor(width * 0.15), Math.floor(height * 0.3)], [cx + Math.floor(width * 0.15), Math.floor(height * 0.3)]]) {
          const de = (x - ex) * (x - ex) + (y - ey) * (y - ey)
          if (de <= eyeR * eyeR) {
            pixels[off] = eyr
            pixels[off + 1] = eyg
            pixels[off + 2] = eyb
            pixels[off + 3] = 255
          }
        }
      }

      // Mouth (small smile)
      const mouthY = Math.floor(height * 0.45)
      const mouthX = cx
      const mouthRadius = Math.floor(width * 0.08)
      const dm = (x - mouthX) * (x - mouthX) + (y - mouthY) * (y - mouthY)
      if (dm <= mouthRadius * mouthRadius && y > mouthY) {
        pixels[off] = mr
        pixels[off + 1] = mg
        pixels[off + 2] = mb
        pixels[off + 3] = 255
      }
    }
  }
  return createPNG(width, height, pixels)
}
