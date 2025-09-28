import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

type EventPhase = 'thinking' | 'tool_invocation' | 'result' | 'completed'

type ArtifactPayload = {
  storagePath: string
  contentType?: string
  caption?: string
}

type EventPayload = {
  agentEventId: string
  phase: EventPhase
  tool?: string
  title?: string
  message?: string
  payload?: Record<string, unknown> | null
  timestamp?: string
  artifacts?: ArtifactPayload[]
}

interface PostBody {
  sessionId?: string
  events?: EventPayload[]
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as PostBody
    const { sessionId, events } = body

    if (!sessionId || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: 'sessionId and events array are required' }, { status: 400 })
    }

    const results = [] as { eventId: string; agentEventId: string }[]

    for (const event of events) {
      if (!event.agentEventId || !event.phase) {
        continue
      }

      const { data: insertedEvent, error: eventError } = await supabaseAdmin
        .from('professor_lock_events')
        .insert({
          session_id: sessionId,
          agent_event_id: event.agentEventId,
          phase: event.phase,
          tool: event.tool ?? null,
          title: event.title ?? null,
          message: event.message ?? null,
          payload: event.payload ?? null,
          created_at: event.timestamp ?? new Date().toISOString(),
        })
        .select('id, agent_event_id')
        .single()

      if (eventError || !insertedEvent) {
        console.error('Failed to persist Professor Lock event', eventError)
        continue
      }

      results.push(insertedEvent)

      if (Array.isArray(event.artifacts) && event.artifacts.length > 0) {
        const artifactsToInsert = event.artifacts
          .filter(artifact => artifact.storagePath)
          .map(artifact => ({
            session_id: sessionId,
            event_id: insertedEvent.id,
            storage_path: artifact.storagePath,
            content_type: artifact.contentType ?? null,
            caption: artifact.caption ?? null,
            created_at: new Date().toISOString(),
          }))

        if (artifactsToInsert.length > 0) {
          const { error: artifactError } = await supabaseAdmin
            .from('professor_lock_artifacts')
            .insert(artifactsToInsert)

          if (artifactError) {
            console.error('Failed to persist Professor Lock artifacts', artifactError)
          }
        }
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error('Professor Lock events error', error)
    return NextResponse.json({ error: 'Unexpected error persisting events' }, { status: 500 })
  }
}
