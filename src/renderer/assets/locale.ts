/**
 * PixelPet i18n — minimal locale system.
 * Defaults to user browser/system language or saved preference.
 */

export type Locale = 'zh' | 'en'

const STORAGE_KEY = 'pixelpet-locale'

const messages: Record<string, Record<Locale, string>> = {
  // Settings panel
  'settings.title': { zh: '设置', en: 'Settings' },
  'settings.character': { zh: '角色', en: 'Character' },
  'settings.animal': { zh: '宠物', en: 'Animal' },
  'settings.palette': { zh: '配色', en: 'Palette' },
  'settings.resolution': { zh: '分辨率', en: 'Resolution' },
  'settings.toggle': { zh: '切换', en: 'Toggle' },
  'settings.appearance': { zh: '外观', en: 'Appearance' },
  'settings.lightmode': { zh: '浅色模式', en: 'Light mode' },
  'settings.autostart': { zh: '开机自启动', en: 'Auto-start on login' },
  'settings.language': { zh: '语言', en: 'Language' },
  'settings.diagnostics': { zh: '诊断信息', en: 'Diagnostics' },
  'settings.packs': { zh: '资源包', en: 'Packs' },
  'settings.importpack': { zh: '导入资源包', en: 'Import Pack' },
  'settings.remove': { zh: '删除', en: 'Remove' },
  'settings.edit': { zh: '编辑', en: 'Edit' },
  'settings.openpacksdir': { zh: '打开资源包文件夹', en: 'Open Packs Folder' },
  'settings.noimports': { zh: '暂无导入的资源包', en: 'No packs imported' },
  'settings.importeditors': { zh: '导入错误', en: 'Import errors' },
  'settings.nocharacters': { zh: '无角色数据', en: 'No characters' },
  // AI generation
  'settings.aicharacter': { zh: 'AI 角色生成', en: 'AI Character' },
  'settings.characterprompt': { zh: '角色描述（可选）', en: 'Character prompt (optional)' },
  'settings.generate': { zh: '生成', en: 'Generate' },
  'settings.generating': { zh: '生成中…', en: 'Generating…' },
  'settings.cancel': { zh: '取消', en: 'Cancel' },
  'settings.selectimage': { zh: '选择参考图', en: 'Select reference image' },
  // AI Action generation
  'settings.aiaction': { zh: 'AI 动作生成', en: 'AI Action' },
  'settings.actionprompt': { zh: '描述动作（如 "喝咖啡"）', en: 'Describe the action (e.g. "coffee sip")' },
  'settings.genaction': { zh: '生成动作', en: 'Generate Action' },
  'settings.generatingaction': { zh: '生成动作中…', en: 'Generating action…' },
  'settings.actionhint': { zh: '生成后右键宠物即可在菜单中找到', en: 'Right-click your pet to find it in the menu' },
  // Action packs
  'settings.actions': { zh: '动作包', en: 'Actions' },
  'settings.menu': { zh: '菜单', en: 'Menu' },
  'settings.preview': { zh: '预览', en: 'Preview' },
  'settings.noactions': { zh: '暂无动作包', en: 'No action packs imported' },
  // Welcome screen
  'welcome.title': { zh: 'PixelPet', en: 'PixelPet' },
  'welcome.subtitle': { zh: '选择你的新伙伴', en: 'Pick your new companion' },
  'welcome.start': { zh: '开始', en: 'Start' },
  // Pack editor
  'editor.save': { zh: '保存', en: 'Save' },
  'editor.close': { zh: '关闭', en: 'Close' },
  'editor.layers': { zh: '图层', en: 'Layers' },
  'editor.palettes': { zh: '调色板', en: 'Palettes' },
  'editor.preview': { zh: '合成预览', en: 'Composite Preview' },
  'editor.replacelayer': { zh: '替换图层', en: 'Replace layer' },
  'editor.unsaved': { zh: '未保存的更改将丢失。确定关闭？', en: 'Unsaved changes will be lost. Close anyway?' },
}

export function getLocale(): Locale {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'en' || saved === 'zh') return saved
  // Fall back to browser language
  if (navigator.language.startsWith('zh')) return 'zh'
  return 'en'
}

export function setLocale(locale: Locale): void {
  localStorage.setItem(STORAGE_KEY, locale)
  // Dispatch a custom event so active UI can refresh
  window.dispatchEvent(new CustomEvent('localechange', { detail: locale }))
}

let cachedLocale = getLocale()

export function t(key: string): string {
  const entry = messages[key]
  if (!entry) return key // fallback: show the key itself
  return entry[cachedLocale] ?? entry.en ?? key
}

export function refreshLocale(): void {
  cachedLocale = getLocale()
  window.dispatchEvent(new CustomEvent('localechange', { detail: cachedLocale }))
}
