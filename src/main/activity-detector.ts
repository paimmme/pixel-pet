import { BrowserWindow } from 'electron'
import { execSync } from 'child_process'
import type { ActivityType, ActivityInfo } from '../shared/activity-types'

const POLL_INTERVAL = 3000  // 3 seconds

const CODING_APPS = [
  'Code', 'Cursor', 'Terminal', 'iTerm2', 'Warp', 'Ghostty', 'Alacritty',
  'IntelliJ IDEA', 'WebStorm', 'PyCharm', 'GoLand', 'CLion', 'Android Studio',
  'Xcode', 'VSCodium', 'Nova', 'BBEdit', 'Sublime Text', 'Neovide', 'Zed'
]

const BROWSING_APPS = [
  'Safari', 'Google Chrome', 'Arc', 'Firefox', 'Edge', 'Brave',
  'Opera', 'Vivaldi', 'Tor Browser', 'Chromium', 'Zen Browser', 'Orion'
]

const GAMING_APPS = [
  'Steam', 'Steam Helper', 'Minecraft', 'Roblox', 'Battle.net',
  'Epic Games Launcher', 'Heroic Games Launcher', 'Prism Launcher'
]

const MEDIA_APPS = [
  'IINA', 'VLC', 'QuickTime Player', 'Spotify', 'QQMusic', 'Netflix',
  'Plex', 'Infuse', 'Movist Pro', 'OBS Studio'
]

const CHAT_APPS = [
  'WeChat', 'Telegram', 'Slack', 'Discord', 'WhatsApp',
  'Messenger', 'Skype', 'Zoom', 'Teams', 'Signal', 'LINE'
]

function classifyActivity(appName: string): ActivityType {
  if (CODING_APPS.includes(appName)) return 'coding'
  if (BROWSING_APPS.includes(appName)) return 'browsing'
  if (GAMING_APPS.includes(appName)) return 'gaming'
  if (MEDIA_APPS.includes(appName)) return 'media'
  if (CHAT_APPS.includes(appName)) return 'chatting'
  return 'other'
}

function pollFrontmostApp(): ActivityInfo {
  try {
    const result = execSync(
      `osascript -e 'tell application "System Events" to get name of first application process whose frontmost is true'`,
      { encoding: 'utf8', timeout: 2000 }
    ).trim()
    return {
      appName: result,
      type: classifyActivity(result)
    }
  } catch {
    return { appName: 'unknown', type: 'other' }
  }
}

export function startActivityDetection(win: BrowserWindow): () => void {
  let lastActivity = ''

  const interval = setInterval(() => {
    try {
      if (win.isDestroyed()) return
      const info = pollFrontmostApp()
      if (info.appName !== lastActivity) {
        lastActivity = info.appName
        win.webContents.send('activity-changed', info)
      }
    } catch {
      // silently ignore polling errors
    }
  }, POLL_INTERVAL)

  // Fire initial detection immediately
  try {
    const initial = pollFrontmostApp()
    lastActivity = initial.appName
    if (!win.isDestroyed()) {
      win.webContents.send('activity-changed', initial)
    }
  } catch {
    // ignore
  }

  return () => {
    clearInterval(interval)
  }
}
