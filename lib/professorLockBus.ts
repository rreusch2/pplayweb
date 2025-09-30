// Simple in-memory pub/sub for Professor Lock SSE
// Note: Works on Node.js runtime instances while warm. For multi-instance scale,
// consider Redis pub/sub. This is sufficient for initial deployment.

export type BusCallback = (data: any) => void

const subscribers = new Map<string, Set<BusCallback>>()

export function subscribe(sessionId: string, cb: BusCallback) {
  const set = subscribers.get(sessionId) ?? new Set<BusCallback>()
  set.add(cb)
  subscribers.set(sessionId, set)
  return () => {
    const cur = subscribers.get(sessionId)
    if (!cur) return
    cur.delete(cb)
    if (cur.size === 0) subscribers.delete(sessionId)
  }
}

export function publish(sessionId: string, data: any) {
  const set = subscribers.get(sessionId)
  if (!set) return
  set.forEach((cb) => {
    try {
      cb(data)
    } catch (e) {
      console.error('[ProfessorLockBus] subscriber error', e)
    }
  })
}
