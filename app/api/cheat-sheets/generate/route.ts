import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import {
  composeDailyDigest,
  canUserGenerateSheet,
  type DailyDigestContent,
} from '@/lib/cheatSheetData'

// Initialize Supabase client with service role for secure operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface GenerateRequest {
  sheet_type: 'daily_digest' | 'player_prop' | 'game_matchup' | 'parlay_blueprint'
  sports?: string[]
  picks_limit?: number
  min_confidence?: number
  theme?: 'dark_glass' | 'blue_blaze' | 'team_colors'
}

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
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 })
    }

    // Get user profile to determine tier
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single()

    const tier = profile?.subscription_tier || 'free'

    // Check if user can generate a sheet based on tier
    const { allowed, reason } = await canUserGenerateSheet(user.id, tier)

    if (!allowed) {
      return NextResponse.json({ error: reason }, { status: 403 })
    }

    // Parse request body
    const body: GenerateRequest = await req.json()
    const {
      sheet_type,
      sports,
      picks_limit = 10,
      min_confidence = 60,
      theme = 'dark_glass',
    } = body

    // Validate sheet type access by tier
    if (sheet_type !== 'daily_digest' && tier === 'free') {
      return NextResponse.json(
        { error: 'Upgrade to Pro to unlock Player Prop and Game Matchup sheets' },
        { status: 403 }
      )
    }

    if (sheet_type === 'parlay_blueprint' && tier !== 'elite') {
      return NextResponse.json(
        { error: 'Parlay Blueprint is exclusive to Elite tier' },
        { status: 403 }
      )
    }

    // Validate theme access
    if (theme !== 'dark_glass' && tier !== 'elite') {
      return NextResponse.json(
        { error: 'Custom themes are exclusive to Elite tier' },
        { status: 403 }
      )
    }

    // Compose content based on sheet type
    let content: any
    let title: string
    let summary: string
    let sport: string

    switch (sheet_type) {
      case 'daily_digest':
        content = await composeDailyDigest(user.id, {
          sports,
          picksLimit: picks_limit,
          minConfidence: min_confidence,
        })
        title = content.title
        summary = content.summary
        sport = content.sport
        break

      case 'player_prop':
        return NextResponse.json(
          { error: 'Player prop sheets coming in Phase 2' },
          { status: 501 }
        )

      case 'game_matchup':
        return NextResponse.json(
          { error: 'Game matchup sheets coming in Phase 3' },
          { status: 501 }
        )

      case 'parlay_blueprint':
        return NextResponse.json(
          { error: 'Parlay blueprint sheets coming in Phase 3' },
          { status: 501 }
        )

      default:
        return NextResponse.json({ error: 'Invalid sheet type' }, { status: 400 })
    }

    // Store the cheat sheet in database
    const { data: cheatSheet, error: insertError } = await supabase
      .from('cheat_sheets')
      .insert({
        user_id: user.id,
        title,
        theme,
        data: content, // Store as JSONB (legacy column name)
        content_json: content, // New column for clarity
        sheet_type,
        summary,
        sport,
        template: 'modern', // Legacy column
      })
      .select('id, share_id')
      .single()

    if (insertError) {
      console.error('Error inserting cheat sheet:', insertError)
      return NextResponse.json(
        { error: 'Failed to save cheat sheet' },
        { status: 500 }
      )
    }

    // Generate share URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://predictiveplay.app'
    const shareUrl = `${baseUrl}/cheat-sheets/${cheatSheet.share_id}`

    return NextResponse.json({
      success: true,
      sheet_id: cheatSheet.id,
      share_id: cheatSheet.share_id,
      share_url: shareUrl,
      title,
      summary,
      content,
    })
  } catch (error) {
    console.error('Cheat sheet generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate cheat sheet' },
      { status: 500 }
    )
  }
}
