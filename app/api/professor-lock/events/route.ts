import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { publish } from '@/lib/professorLockBus'

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

    const results: { eventId: string; agentEventId: string }[] = []

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

      results.push({
        eventId: insertedEvent.id as string,
        agentEventId: insertedEvent.agent_event_id as string,
      })

      if (Array.isArray(event.artifacts) && event.artifacts.length > 0) {
        const artifactsToInsert = event.artifacts
          .filter((artifact: ArtifactPayload) => artifact.storagePath)
          .map((artifact: ArtifactPayload) => ({
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

      // Broadcast this event on SSE bus for live UI updates
      publish(sessionId, {
        type: 'tool_event',
        id: insertedEvent.id,
        agentEventId: insertedEvent.agent_event_id,
        phase: event.phase,
        tool: event.tool,
        title: event.title,
        message: event.message,
        payload: event.payload ?? undefined,
        artifacts: event.artifacts?.map(a => ({
          storagePath: a.storagePath,
          contentType: a.contentType,
          caption: a.caption,
          // pass through signedUrl if the agent provided one
          // @ts-ignore
          signedUrl: (a as any).signedUrl,
        })),
        timestamp: event.timestamp || new Date().toISOString(),
      })
    }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error('Professor Lock events error', error)
    return NextResponse.json({ error: 'Unexpected error persisting events' }, { status: 500 })
  }
}
