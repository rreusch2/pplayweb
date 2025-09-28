type EnqueuePayload = {
  sessionId: string
  userId: string
  tier: string
  preferences?: Record<string, unknown> | null
}

export async function enqueueProfessorLockSession(payload: EnqueuePayload) {
  console.log('[ProfessorLockQueue] enqueue requested', payload)
  // TODO: replace with Redis/Upstash enqueue once infrastructure is ready
  return { enqueued: true }
}
