import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const WORKFLOW_ID = process.env.OPENAI_WORKFLOW_ID || 'asst_abc123'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tier, preferences, sessionId } = await request.json()
    
    // If sessionId provided, try to get existing session first
    if (sessionId) {
      const { data: existingSession } = await supabase
        .from('chatkit_sessions')
        .select('client_secret, session_id')
        .eq('session_id', sessionId)
        .eq('user_id', user.id)
        .single()

      if (existingSession?.client_secret) {
        return NextResponse.json({
          client_secret: existingSession.client_secret,
          session_id: existingSession.session_id,
          tier: tier || 'free',
          cached: true,
        })
      }
    }

    // Get user profile for additional context
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier, sport_preferences, risk_tolerance, username')
      .eq('id', user.id)
      .single()

    const workflowId = WORKFLOW_ID
    const userId = user.id

    // Create ChatKit session using OpenAI API
    // IMPORTANT: Using the correct ChatKit API endpoint
    const response = await fetch('https://api.openai.com/v1/chatkit/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'chatkit-v1', // Required header for ChatKit API
      },
      body: JSON.stringify({
        workflow: { 
          id: workflowId 
        },
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

    const sessionData = await response.json()
    
    // Store session info in database
    try {
      await supabase.from('chatkit_sessions').upsert({
        user_id: user.id,
        session_id: sessionData.id,
        client_secret: sessionData.client_secret,
        tier: tier || profile?.subscription_tier || 'free',
        metadata: {
          ...preferences,
          created: new Date().toISOString(),
        }
      })
    } catch (dbError) {
      // Don't fail if database insert fails
      console.warn('Failed to store session in database:', dbError)
    }

    return NextResponse.json({
      client_secret: sessionData.client_secret,
      session_id: sessionData.id,
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

// GET endpoint to retrieve existing sessions
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get most recent active session
    const { data: session } = await supabase
      .from('chatkit_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (session) {
      return NextResponse.json(session)
    }

    return NextResponse.json({ error: 'No active session' }, { status: 404 })
  } catch (error) {
    console.error('Session retrieval error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
