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

    // 1) Try to REUSE a recent session for this user to avoid duplicates from Strict Mode double-invocation
    const reuseWindowMinutes = 10
    const cutoff = new Date(Date.now() - reuseWindowMinutes * 60 * 1000).toISOString()

    const { data: existingSessions, error: existingErr } = await supabase
      .from('chatkit_sessions')
      .select('session_id, client_secret, created_at, metadata')
      .eq('user_id', user.id)
      .gte('created_at', cutoff)
      .contains('metadata', { server_type: 'professor_lock_custom' })
      .order('created_at', { ascending: false })
      .limit(1)

    if (!existingErr && existingSessions && existingSessions.length > 0) {
      const existing = existingSessions[0]
      return NextResponse.json({
        client_secret: existing.client_secret,
        session_id: existing.session_id,
        server_type: 'professor_lock_custom',
        user_preferences: {
          sports: profile?.preferred_sports,
          riskTolerance: profile?.risk_tolerance,
          bettingStyle: profile?.betting_style
        },
        features: {
          advanced_widgets: true,
          betting_analysis: true,
          statmuse_integration: true,
          parlay_builder: true,
          live_odds: true
        },
        reused: true,
      })
    }

    // 2) No recent session. Create a new session with your custom Professor Lock ChatKit server
    const customServerUrl = process.env.PROFESSOR_LOCK_SERVER_URL || 'http://localhost:8000'
    
    const response = await fetch(`${customServerUrl}/create-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': user.id,
        'X-User-Email': user.email || '',
        'X-User-Tier': profile?.subscription_tier || 'free'
      },
      body: JSON.stringify({
        user_id: user.id,
        user_email: user.email,
        tier: profile?.subscription_tier || 'free',
        preferences: {
          sports: profile?.preferred_sports || [],
          risk_tolerance: profile?.risk_tolerance || 'medium',
          betting_style: profile?.betting_style || 'balanced'
        }
      }),
    })

    if (!response.ok) {
      console.error('Professor Lock server session creation failed:', await response.text())
      throw new Error('Failed to create Professor Lock session')
    }

    const sessionData = await response.json()

    // Store session in database for tracking
    await supabase
      .from('chatkit_sessions')
      .insert({
        user_id: user.id,
        session_id: sessionData.session_id,
        client_secret: sessionData.client_secret,
        tier: profile?.subscription_tier || 'free',
        metadata: {
          server_type: 'professor_lock_custom',
          server_url: customServerUrl,
          user_preferences: {
            sports: profile?.preferred_sports,
            risk_tolerance: profile?.risk_tolerance,
            betting_style: profile?.betting_style
          }
        },
        created_at: new Date().toISOString()
      })

    return NextResponse.json({
      client_secret: sessionData.client_secret,
      session_id: sessionData.session_id,
      server_type: 'professor_lock_custom',
      user_preferences: {
        sports: profile?.preferred_sports,
        riskTolerance: profile?.risk_tolerance,
        bettingStyle: profile?.betting_style
      },
      features: {
        advanced_widgets: true,
        betting_analysis: true,
        statmuse_integration: true,
        parlay_builder: true,
        live_odds: true
      }
    })
  } catch (error) {
    console.error('ChatKit custom session error:', error)
    return NextResponse.json(
      { error: 'Failed to create Professor Lock session' },
      { status: 500 }
    )
  }
}
