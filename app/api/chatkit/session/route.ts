import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const WORKFLOW_ID = process.env.OPENAI_WORKFLOW_ID || 'asst_abc123'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('Supabase service role environment variables are missing. Session API will not be able to read/write to DB securely.')
}

export async function POST(request: NextRequest) {
  try {
    const { tier, preferences, sessionId, userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    // Admin client (service role) to bypass RLS for server-side verification and inserts
    const admin = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
      ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
      : null

    // Verify user exists and get profile
    let profile: any = null
    if (admin) {
      const { data } = await admin
        .from('profiles')
        .select('id, subscription_tier, sport_preferences, risk_tolerance, username')
        .eq('id', userId)
        .single()
      profile = data
    }

    // If sessionId provided, try to return existing client_secret from DB
    if (admin && sessionId) {
      const { data: existing } = await admin
        .from('chatkit_sessions')
        .select('client_secret, session_id')
        .eq('session_id', sessionId)
        .eq('user_id', userId)
        .single()
      if (existing?.client_secret) {
        return NextResponse.json({
          client_secret: existing.client_secret,
          session_id: existing.session_id,
          tier: tier || profile?.subscription_tier || 'free',
          cached: true,
        })
      }
    }

    // Create ChatKit session using OpenAI API
    const response = await fetch('https://api.openai.com/v1/chatkit/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'chatkit-v1',
      },
      body: JSON.stringify({
        workflow: { id: WORKFLOW_ID },
        user: userId,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI ChatKit API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      })
      return NextResponse.json({ 
        error: 'Failed to create session',
        details: errorText 
      }, { status: response.status })
    }

    const session = await response.json()

    // Store session info
    if (admin) {
      try {
        await admin.from('chatkit_sessions').upsert({
          user_id: userId,
          session_id: session.id,
          client_secret: session.client_secret,
          tier: tier || profile?.subscription_tier || 'free',
          metadata: {
            ...preferences,
            created: new Date().toISOString(),
          }
        })
      } catch (dbError) {
        console.warn('Failed to store session in database:', dbError)
      }
    }

    return NextResponse.json({
      client_secret: session.client_secret,
      session_id: session.id,
      tier: tier || profile?.subscription_tier || 'free',
    })
  } catch (error) {
    console.error('Session creation error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET endpoint to retrieve most recent session for a user
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { data: session } = await admin
      .from('chatkit_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (session) return NextResponse.json(session)
    return NextResponse.json({ error: 'No active session' }, { status: 404 })
  } catch (error) {
    console.error('Session retrieval error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
