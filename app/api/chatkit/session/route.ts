import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'

// Initialize Supabase client with service role for secure operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const headersList = await headers()
    const authorization = headersList.get('authorization')
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const token = authorization.replace('Bearer ', '')
    
    // Verify the user's JWT token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    // Get user profile to determine tier and preferences
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier, preferred_sports, risk_tolerance, betting_style')
      .eq('id', user.id)
      .single()

    // Create ChatKit session with OpenAI
    const response = await fetch('https://api.openai.com/v1/chatkit/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'chatkit_beta=v1',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        workflow: { 
          id: process.env.OPENAI_WORKFLOW_ID || 'wf_placeholder' // You'll need to add your workflow ID
        },
        user: user.id
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('OpenAI ChatKit session creation failed:', error)
      throw new Error('Failed to create ChatKit session')
    }

    const sessionData = await response.json()

    // Store session in database for tracking
    await supabase
      .from('chatkit_sessions')
      .insert({
        id: sessionData.id,
        user_id: user.id,
        created_at: new Date().toISOString(),
        metadata: {
          workflow_id: process.env.OPENAI_WORKFLOW_ID,
          tier: profile?.subscription_tier
        }
      })

    return NextResponse.json({
      client_secret: sessionData.client_secret,
      session_id: sessionData.id,
      user_preferences: {
        sports: profile?.preferred_sports,
        riskTolerance: profile?.risk_tolerance,
        bettingStyle: profile?.betting_style
      }
    })
  } catch (error) {
    console.error('ChatKit session error:', error)
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    )
  }
}
