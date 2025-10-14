import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(req: NextRequest) {
  try {
    const { userId, tier, preferences } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Verify OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not configured')
      return NextResponse.json(
        { error: 'OpenAI API key not configured' }, 
        { status: 500 }
      )
    }

    // Get user profile for personalization
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    // Create ChatKit session using the correct API endpoint
    const workflowId = process.env.OPENAI_WORKFLOW_ID || 'wf_sports_betting_agent'
    
    const response = await fetch('https://api.openai.com/v1/chatkit/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'chatkit_beta=v1',
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
      console.error('OpenAI ChatKit API error:', response.status, errorText)
      
      // Return more helpful error for debugging
      return NextResponse.json(
        { 
          error: 'Failed to create ChatKit session',
          details: response.status === 404 
            ? 'Workflow not found. Please create an Agent Builder workflow first.'
            : response.status === 401
              ? 'Invalid OpenAI API key'
              : errorText
        }, 
        { status: response.status }
      )
    }

    const session = await response.json()

    // Store session in database for tracking (optional)
    try {
      await supabaseAdmin
        .from('chatkit_sessions')
        .insert({
          user_id: userId,
          session_id: session.id,
          client_secret: session.client_secret,
          tier: tier || profile?.subscription_tier || 'free',
          metadata: {
            tier: tier || profile?.subscription_tier || 'free',
            sportPreferences: profile?.sport_preferences || { mlb: true, wnba: false, ufc: false },
            riskTolerance: profile?.risk_tolerance || 'medium',
            ...preferences,
          },
        })
    } catch (dbError) {
      // Don't fail if database insert fails
      console.warn('Failed to store session in database:', dbError)
    }

    return NextResponse.json({ 
      client_secret: session.client_secret,
      session_id: session.id,
    })
  } catch (error) {
    console.error('Failed to create ChatKit session:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create session',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}
