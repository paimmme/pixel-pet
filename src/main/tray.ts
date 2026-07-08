import { app, BrowserWindow, Menu, nativeImage, screen, Tray } from 'electron'

let tray: Tray | null = null

function createTrayIcon(): Electron.NativeImage {
  const size = 16
  // Raw RGBA bitmap — use createFromBitmap (available since Electron 29)
  const buffer = Buffer.alloc(size * size * 4)

  // Paw print mask: 1 = paw, 0 = transparent
  const pawMask: number[][] = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 0, 0],
    [0, 0, 0, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 0, 0, 0],
    [0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  ]

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4
      if (pawMask[y][x]) {
        // Solid black — template images use luminance; macOS will colorize
        buffer[idx] = 0      // R
        buffer[idx + 1] = 0  // G
        buffer[idx + 2] = 0  // B
        buffer[idx + 3] = 255 // A
      } else {
        buffer[idx] = 0
        buffer[idx + 1] = 0
        buffer[idx + 2] = 0
        buffer[idx + 3] = 0 // fully transparent
      }
    }
  }

  const image = nativeImage.createFromBitmap(buffer, { width: size, height: size })

  // macOS: mark as template for automatic dark/light mode adaptation
  if (process.platform === 'darwin') {
    image.setTemplateImage(true)
  }

  return image
}

export function createTray(win: BrowserWindow): Tray {
  const trayIcon = createTrayIcon()
  tray = new Tray(trayIcon)

  // macOS: prevent double-click toggling menu
  if (process.platform === 'darwin') {
    tray.setIgnoreDoubleClickEvents(true)
  }

  function buildMenu(): Electron.Menu {
    return Menu.buildFromTemplate([
      {
        label: 'PixelPet',
        enabled: false,
        id: 'title'
      },
      { type: 'separator' },
      {
        label: 'Idle 🐾',
        click: () => {
          if (win && !win.isDestroyed()) {
            win.webContents.send('action', 'idle')
          }
        }
      },
      {
        label: 'Jump',
        click: () => {
          if (win && !win.isDestroyed()) {
            win.webContents.send('action', 'jump')
          }
        }
      },
      {
        label: 'Wave',
        click: () => {
          if (win && !win.isDestroyed()) {
            win.webContents.send('action', 'wave')
          }
        }
      },
      { type: 'separator' },
      {
        label: '重新居中',
        click: () => {
          if (win && !win.isDestroyed()) {
            const cursorPoint = screen.getCursorScreenPoint()
            const display = screen.getDisplayNearestPoint(cursorPoint)
            const bounds = win.getBounds()
            const x = Math.round(display.workArea.x + (display.workArea.width - bounds.width) / 2)
            const y = Math.round(display.workArea.y + (display.workArea.height - bounds.height) / 2)
            win.setBounds({ x, y, width: bounds.width, height: bounds.height })
          }
        }
      },
      { type: 'separator' },
      {
        label: '退出',
        click: () => {
          app.quit()
        }
      }
    ])
  }

  tray.setToolTip('PixelPet')
  tray.setContextMenu(buildMenu())

  // Click toggles the window visibility
  tray.on('click', () => {
    if (win && !win.isDestroyed()) {
      if (win.isVisible()) {
        win.hide()
      } else {
        win.show()
        win.focus()
      }
    }
  })

  return tray
}
