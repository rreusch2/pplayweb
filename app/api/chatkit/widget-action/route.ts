import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'

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
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    const { action, itemId } = await req.json()

    // Handle different widget actions
    switch (action.type) {
      case 'add_to_betslip':
        // Store pick in user's betslip
        const { error: betslipError } = await supabase
          .from('user_betslip')
          .insert({
            user_id: user.id,
            player_name: action.payload.playerName,
            prop_type: action.payload.propType,
            line: action.payload.line,
            odds: action.payload.odds,
            created_at: new Date().toISOString()
          })

        if (betslipError) {
          console.error('Betslip error:', betslipError)
          throw new Error('Failed to add to betslip')
        }

        return NextResponse.json({
          success: true,
          message: 'Added to betslip'
        })

      case 'place_parlay':
        // Store parlay bet
        const { error: parlayError } = await supabase
          .from('user_parlays')
          .insert({
            user_id: user.id,
            legs: action.payload.legs,
            total_odds: action.payload.totalOdds,
            stake: action.payload.stake,
            status: 'pending',
            created_at: new Date().toISOString()
          })

        if (parlayError) {
          console.error('Parlay error:', parlayError)
          throw new Error('Failed to place parlay')
        }

        return NextResponse.json({
          success: true,
          message: 'Parlay placed successfully'
        })

      case 'clear_parlay':
        // Clear user's current parlay builder
        return NextResponse.json({
          success: true,
          message: 'Parlay cleared'
        })

      case 'view_trend_details':
        // Log trend view for analytics
        await supabase
          .from('analytics_events')
          .insert({
            user_id: user.id,
            event_type: 'trend_view',
            metadata: {
              player: action.payload.player,
              stat: action.payload.stat
            },
            created_at: new Date().toISOString()
          })

        return NextResponse.json({
          success: true,
          data: {
            player: action.payload.player,
            stat: action.payload.stat
          }
        })

      default:
        // Log unknown actions for debugging
        console.log('Unknown widget action:', action.type, action.payload)
        
        return NextResponse.json({
          success: true,
          message: 'Action received'
        })
    }
  } catch (error) {
    console.error('Widget action error:', error)
    return NextResponse.json(
      { error: 'Failed to process action' },
      { status: 500 }
    )
  }
}
