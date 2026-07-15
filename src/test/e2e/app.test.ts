/**
 * Electron E2E smoke test — launches the built app and verifies the main window
 * renders a canvas. Requires the app to be built first (npm run build).
 */

import { _electron as electron } from 'playwright'
import { test, expect } from 'vitest'
import { resolve } from 'path'

const MAIN_JS = resolve(__dirname, '../../../out/main/index.js')
const PROJECT_ROOT = resolve(__dirname, '../../..')

test('app launches and renders canvas', async () => {
  const app = await electron.launch({
    args: [MAIN_JS],
    // Run in the project root so relative paths (userData, resources/) resolve
    cwd: PROJECT_ROOT,
    env: {
      ...process.env,
      NODE_ENV: 'test',
    },
  })

  const window = await app.firstWindow()

  // Wait for the window to be fully loaded
  await window.waitForLoadState('domcontentloaded')

  // The Electron window should be visible
  expect(await window.title()).toBe('PixelPet')

  // The canvas should exist (pet rendering surface)
  const canvas = await window.$('canvas')
  expect(canvas).toBeTruthy()

  // Canvas should have non-zero dimensions
  const size = await canvas!.boundingBox()
  expect(size).toBeTruthy()
  expect(size!.width).toBeGreaterThan(0)
  expect(size!.height).toBeGreaterThan(0)

  // Take a screenshot for visual verification
  await window.screenshot({ path: resolve(__dirname, '../../test-results/e2e-smoke.png') })

  await app.close()
}, 30000) // 30s timeout for Electron startup
