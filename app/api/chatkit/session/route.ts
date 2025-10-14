import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

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

    // Create ChatKit session with OpenAI
    const session = await openai.beta.chatkit.sessions.create({
      workflow: { 
        id: process.env.OPENAI_WORKFLOW_ID || 'wf_sports_betting_agent' 
      },
      user: userId,
      metadata: {
        tier: tier || profile?.subscription_tier || 'free',
        sportPreferences: profile?.sport_preferences || { mlb: true, wnba: false, ufc: false },
        riskTolerance: profile?.risk_tolerance || 'medium',
        bettingStyle: profile?.betting_style || 'balanced',
        ...preferences,
      },
      context: {
        // Pass recent predictions and insights for context
        recentPicks: await getRecentPicks(userId),
        userStats: await getUserStats(userId),
      },
    })

    // Store session in database for tracking
    await supabaseAdmin
      .from('chatkit_sessions')
      .insert({
        user_id: userId,
        session_id: session.id,
        client_secret: session.client_secret,
        tier: tier || profile?.subscription_tier || 'free',
        metadata: session.metadata,
      })

    return NextResponse.json({ 
      client_secret: session.client_secret,
      session_id: session.id,
    })
  } catch (error) {
    console.error('Failed to create ChatKit session:', error)
    return NextResponse.json(
      { error: 'Failed to create session' }, 
      { status: 500 }
    )
  }
}

async function getRecentPicks(userId: string) {
  const { data } = await supabaseAdmin
    .from('ai_predictions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10)

  return data || []
}

async function getUserStats(userId: string) {
  const { data } = await supabaseAdmin
    .from('user_betting_stats')
    .select('*')
    .eq('user_id', userId)
    .single()

  return data || {
    total_bets: 0,
    win_rate: 0,
    roi: 0,
    favorite_sports: [],
  }
}
