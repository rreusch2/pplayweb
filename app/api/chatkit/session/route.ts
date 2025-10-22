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

    // Create ChatKit session with YOUR Python server on Railway
    const railwayUrl = process.env.CHATKIT_SERVER_URL || 'https://pykit-production.up.railway.app';
    const response = await fetch(`${railwayUrl}/create-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, // Your Python server will use this for OpenAI
      },
      body: JSON.stringify({
        user_id: user.id,
        user_preferences: {
          subscription_tier: profile?.subscription_tier,
          preferred_sports: profile?.preferred_sports,
          risk_tolerance: profile?.risk_tolerance,
          betting_style: profile?.betting_style
        }
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
          server: 'python_chatkit_railway',
          server_url: railwayUrl,
          tier: profile?.subscription_tier,
          preferences: {
            sports: profile?.preferred_sports,
            risk: profile?.risk_tolerance,
            style: profile?.betting_style
          }
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
