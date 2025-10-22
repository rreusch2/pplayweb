import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Secure Supabase client (service role) for server-side validation/logging
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type ToggleParlayPick = { type: 'toggle_parlay_pick', payload: { pickId: string } }
type PlaceParlay = { type: 'place_parlay', payload: { picks: string[] } }
type ClearParlay = { type: 'clear_parlay', payload: Record<string, never> }
type SelectProp = { type: 'select_prop', payload: { player: string, market: string, selection: 'over' | 'under', odds: string } }

type WidgetAction = ToggleParlayPick | PlaceParlay | ClearParlay | SelectProp

export async function POST(req: NextRequest) {
  try {
    const authorization = req.headers.get('authorization')
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 })
    }

    const token = authorization.replace('Bearer ', '')

    // Validate user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 })
    }

    const { action, itemId } = await req.json() as { action: WidgetAction, itemId?: string }
    if (!action || typeof action.type !== 'string') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Best-effort logging (ignore if table absent)
    try {
      await supabase
        .from('widget_action_events')
        .insert({
          user_id: user.id,
          action_type: action.type,
          payload: action.payload ?? {},
          item_id: itemId ?? null,
          created_at: new Date().toISOString(),
        })
    } catch (_) {
      // No-op if table doesn't exist
    }

    switch (action.type) {
      case 'toggle_parlay_pick': {
        const ok = !!action.payload?.pickId
        return NextResponse.json({ ok, toggled: action.payload?.pickId ?? null })
      }
      case 'place_parlay': {
        const picks = Array.isArray(action.payload?.picks) ? action.payload.picks : []
        return NextResponse.json({ ok: picks.length > 0, placed: true, picks })
      }
      case 'clear_parlay': {
        return NextResponse.json({ ok: true, cleared: true })
      }
      case 'select_prop': {
        const { player, market, selection, odds } = action.payload || {}
        const ok = !!player && !!market && (selection === 'over' || selection === 'under') && !!odds
        return NextResponse.json({ ok, selected: { player, market, selection, odds } })
      }
      default:
        return NextResponse.json({ ok: false, error: 'Unknown action type' }, { status: 400 })
    }
  } catch (error) {
    console.error('widget-action error:', error)
    return NextResponse.json({ error: 'Failed to process widget action' }, { status: 500 })
  }
}
