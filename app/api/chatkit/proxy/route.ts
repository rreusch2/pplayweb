import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { headers as nextHeaders } from 'next/headers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const hdrs = await nextHeaders()
    const authorization = hdrs.get('authorization')

    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const token = authorization.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 })
    }

    const customServerUrl = process.env.PROFESSOR_LOCK_SERVER_URL || 'http://localhost:8000'

    // Forward the request body and stream the response back to the client
    const upstream = await fetch(`${customServerUrl}/chatkit`, {
      method: 'POST',
      headers: {
        // Preserve content type for streaming
        'Content-Type': hdrs.get('content-type') || 'application/json',
        'Accept': hdrs.get('accept') || 'text/event-stream',
        // Pass user identity via headers for server context
        'X-User-Id': user.id,
        'X-User-Email': user.email || '',
        'X-User-Tier': (await getUserTier(user.id)) || 'free',
        // Optionally forward a session id if the client provided one
        'X-Session-Id': hdrs.get('x-session-id') || '',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
      body: req.body,
    })

    const responseHeaders = new Headers(upstream.headers)
    // Ensure correct streaming headers
    if (responseHeaders.get('content-type')?.includes('text/event-stream')) {
      responseHeaders.set('Cache-Control', 'no-cache')
      responseHeaders.set('Connection', 'keep-alive')
    }

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    })
  } catch (e) {
    console.error('ChatKit proxy error:', e)
    return NextResponse.json({ error: 'Proxy failed' }, { status: 500 })
  }
}

async function getUserTier(userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .single()
    if (error) return null
    return data?.subscription_tier || null
  } catch {
    return null
  }
}
