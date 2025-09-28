import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get('sessionId')

  if (!sessionId) {
    return new Response('sessionId is required', { status: 400 })
  }

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()
      const send = (event: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
      }

      send({ type: 'heartbeat', sessionId, message: 'SSE placeholder active' })

      const interval = setInterval(() => {
        send({ type: 'keepalive', sessionId, timestamp: new Date().toISOString() })
      }, 25000)

      controller.enqueue(encoder.encode(': stream open\n\n'))

      const close = () => {
        clearInterval(interval)
        controller.enqueue(encoder.encode('event: end\ndata: {}\n\n'))
        controller.close()
      }

      // Automatically close after 5 minutes for now
      const timeout = setTimeout(close, 5 * 60 * 1000)

      req.signal.addEventListener('abort', () => {
        clearTimeout(timeout)
        close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
