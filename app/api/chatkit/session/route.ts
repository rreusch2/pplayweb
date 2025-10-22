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

    // Generate self-hosted session (no OpenAI call needed)
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const clientSecret = `cs_self_${user.id}_${Math.random().toString(36).substr(2, 16)}`

    console.log('✅ Created self-hosted ChatKit session for user:', user.id)
    console.log('Session ID:', sessionId)

    return NextResponse.json({
      client_secret: clientSecret,
      session_id: sessionId,
      self_hosted: true,
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
