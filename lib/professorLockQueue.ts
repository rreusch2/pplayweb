type EnqueuePayload = {
  sessionId: string
  userId: string
  tier: string
  preferences?: Record<string, unknown> | null
}

export async function enqueueProfessorLockSession(payload: EnqueuePayload) {
  const base = process.env.AGENT_SERVICE_URL
  if (!base) {
    console.warn('[ProfessorLockQueue] Missing AGENT_SERVICE_URL env. Skipping enqueue.', {
      hasUrl: !!base,
    })
    return { enqueued: false, reason: 'AGENT_SERVICE_URL not set' }
  }

  try {
    const res = await fetch(`${base.replace(/\/$/, '')}/session/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      // Do not cache; this is a control-plane call
      cache: 'no-store' as RequestCache,
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      console.error('[ProfessorLockQueue] Agent enqueue failed', res.status, text)
      return { enqueued: false, status: res.status, error: text }
    }
    const data = await res.json().catch(() => ({ ok: true }))
    return { enqueued: true, ...data }
  } catch (err) {
    console.error('[ProfessorLockQueue] Failed to contact Agent Service', err)
    return { enqueued: false, error: String(err) }
  }
}
