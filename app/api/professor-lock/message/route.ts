import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { publish } from '@/lib/professorLockBus'

interface PostBody {
  sessionId?: string
  userId?: string
  message?: string
  role?: 'user' | 'assistant' | 'system'
  metadata?: Record<string, unknown>
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as PostBody
    const { sessionId, userId, message, role = 'user', metadata } = body

    if (!sessionId || !userId || !message) {
      return NextResponse.json({ error: 'sessionId, userId, and message are required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin.from('professor_lock_messages').insert({
      session_id: sessionId,
      role,
      content: message,
      model: metadata ?? null,
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error('Failed to persist Professor Lock message', error)
      return NextResponse.json({ error: 'Failed to persist message' }, { status: 500 })
    }

    // Forward to Agent Service for processing if a user message and service is configured
    try {
      const base = process.env.AGENT_SERVICE_URL
      if (role === 'user' && base) {
        await fetch(`${base.replace(/\/$/, '')}/session/message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, userId, message }),
          cache: 'no-store',
        })
      }
    } catch (err) {
      console.error('Failed to forward message to Agent Service', err)
      // Do not fail the API; message is already persisted
    }

    // Publish non-user messages to SSE bus so UI updates live
    if (role !== 'user') {
      publish(sessionId, {
        type: 'chat_message',
        id: crypto.randomUUID(),
        role,
        content: message,
        timestamp: new Date().toISOString(),
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Professor Lock message error', error)
    return NextResponse.json({ error: 'Unexpected error persisting message' }, { status: 500 })
  }
}
