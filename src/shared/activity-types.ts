export type ActivityType = 'coding' | 'browsing' | 'gaming' | 'media' | 'chatting' | 'idle' | 'other'

export interface ActivityInfo {
  type: ActivityType
  appName: string
}
