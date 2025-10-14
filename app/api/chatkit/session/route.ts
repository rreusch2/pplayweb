import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(req: NextRequest) {
  try {
    const { userId, tier, preferences } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Get user profile for personalization
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    // Create ChatKit session by calling OpenAI API directly
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview-2024-12-17',
        voice: 'alloy',
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('OpenAI API error:', error)
      throw new Error('Failed to create OpenAI session')
    }

    const session = await response.json()

    // Generate a simple client secret (in production, use proper session management)
    const clientSecret = `cs_${userId}_${Date.now()}_${Math.random().toString(36).substring(7)}`

    // Store session in database for tracking
    await supabaseAdmin
      .from('chatkit_sessions')
      .insert({
        user_id: userId,
        session_id: session.id || clientSecret,
        client_secret: clientSecret,
        tier: tier || profile?.subscription_tier || 'free',
        metadata: {
          tier: tier || profile?.subscription_tier || 'free',
          sportPreferences: profile?.sport_preferences || { mlb: true, wnba: false, ufc: false },
          riskTolerance: profile?.risk_tolerance || 'medium',
          ...preferences,
        },
      })

    return NextResponse.json({ 
      client_secret: clientSecret,
      session_id: session.id || clientSecret,
    })
  } catch (error) {
    console.error('Failed to create ChatKit session:', error)
    return NextResponse.json(
      { error: 'Failed to create session' }, 
      { status: 500 }
    )
  }
}
