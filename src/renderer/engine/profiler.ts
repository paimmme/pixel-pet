export interface Profiler {
  /** Record frame time (ms) */
  tick(dt: number): void
  /** Track cache stats */
  recordCacheHit(cacheName: string): void
  recordCacheMiss(cacheName: string): void
  /** Track composition time */
  recordComposeTime(ms: number): void
  /** Get latest report */
  snapshot(): ProfilerSnapshot
  /** Log to console */
  log(): void
  /** Toggle on/off */
  setEnabled(v: boolean): void
  destroy(): void
}

export interface ProfilerSnapshot {
  avgFrameMs: number
  minFrameMs: number
  maxFrameMs: number
  avgComposeMs: number | null
  cacheStats: Record<string, { hits: number; misses: number; rate: number }>
}

export function createProfiler(): Profiler {
  let enabled = true
  let destroyed = false

  const frameTimes: number[] = []
  const composeTimes: number[] = []
  const cacheStats: Record<string, { hits: number; misses: number }> = {}

  let logTimer = 0

  function tick(dt: number): void {
    if (!enabled || destroyed) return
    frameTimes.push(dt)
    if (frameTimes.length > 600) frameTimes.shift() // keep last 10s at 60fps

    logTimer += dt
    if (logTimer >= 10_000) {
      logTimer = 0
      log()
    }
  }

  function recordCacheHit(name: string): void {
    if (!enabled) return
    if (!cacheStats[name]) cacheStats[name] = { hits: 0, misses: 0 }
    cacheStats[name].hits++
  }

  function recordCacheMiss(name: string): void {
    if (!enabled) return
    if (!cacheStats[name]) cacheStats[name] = { hits: 0, misses: 0 }
    cacheStats[name].misses++
  }

  function recordComposeTime(ms: number): void {
    if (!enabled) return
    composeTimes.push(ms)
    if (composeTimes.length > 120) composeTimes.shift()
  }

  function snapshot(): ProfilerSnapshot {
    const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
    const min = (arr: number[]) => arr.length > 0 ? Math.min(...arr) : 0
    const max = (arr: number[]) => arr.length > 0 ? Math.max(...arr) : 0

    const cacheStatsOut: Record<string, { hits: number; misses: number; rate: number }> = {}
    for (const [k, v] of Object.entries(cacheStats)) {
      const total = v.hits + v.misses
      cacheStatsOut[k] = { ...v, rate: total > 0 ? v.hits / total : 0 }
    }

    return {
      avgFrameMs: avg(frameTimes),
      minFrameMs: min(frameTimes),
      maxFrameMs: max(frameTimes),
      avgComposeMs: composeTimes.length > 0 ? avg(composeTimes) : null,
      cacheStats: cacheStatsOut,
    }
  }

  function log(): void {
    const s = snapshot()
    const comp = s.avgComposeMs !== null ? `, composeAvg=${s.avgComposeMs.toFixed(1)}ms` : ''
    let cacheLine = ''
    for (const [k, v] of Object.entries(s.cacheStats)) {
      cacheLine += ` | ${k}: ${(v.rate * 100).toFixed(0)}% (${v.hits}/${v.hits + v.misses})`
    }
    console.log(`[perf] frame=${s.avgFrameMs.toFixed(1)}ms (min=${s.minFrameMs.toFixed(1)} max=${s.maxFrameMs.toFixed(1)})${comp}${cacheLine}`)
  }

  function setEnabled(v: boolean): void {
    enabled = v
  }

  function destroy(): void {
    destroyed = true
    frameTimes.length = 0
    composeTimes.length = 0
  }

  return { tick, recordCacheHit, recordCacheMiss, recordComposeTime, snapshot, log, setEnabled, destroy }
}
