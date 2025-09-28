import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

interface PostBody {
  sessionId?: string
  userId?: string
  message?: string
  metadata?: Record<string, unknown>
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as PostBody
    const { sessionId, userId, message, metadata } = body

    if (!sessionId || !userId || !message) {
      return NextResponse.json({ error: 'sessionId, userId, and message are required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin.from('professor_lock_messages').insert({
      session_id: sessionId,
      role: 'user',
      content: message,
      model: metadata ?? null,
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error('Failed to persist Professor Lock message', error)
      return NextResponse.json({ error: 'Failed to persist message' }, { status: 500 })
    }

    // TODO: enqueue message for agent processing / streaming

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Professor Lock message error', error)
    return NextResponse.json({ error: 'Unexpected error persisting message' }, { status: 500 })
  }
}
