/**
 * ChatKit Widget Actions Handler
 * Processes widget actions from the Professor Lock assistant
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { WidgetService } from '@/services/chatkit/widgetService';

export async function POST(request: NextRequest) {
  try {
    const { action, itemId, sessionId } = await request.json();
    
    const supabase = await createServerClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validate session belongs to user
    const { data: session } = await supabase
      .from('chatkit_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (!session) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 403 }
      );
    }

    // Handle different widget actions
    switch (action.type) {
      case 'toggle_parlay_pick':
        return handleParlayToggle(supabase, user.id, action);
      
      case 'place_parlay':
        return handlePlaceParlay(supabase, user.id, action);
      
      case 'clear_parlay':
        return handleClearParlay(supabase, user.id);
      
      case 'select_prop':
        return handleSelectProp(supabase, user.id, action);
      
      case 'view_details':
        return handleViewDetails(supabase, action);
      
      default:
        // Store generic action in session metadata
        await supabase
          .from('chatkit_sessions')
          .update({
            metadata: {
              ...session.metadata,
              lastAction: action,
              lastActionTime: new Date().toISOString()
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId);
        
        return NextResponse.json({ 
          success: true,
          action: action.type 
        });
    }
  } catch (error) {
    console.error('Widget action error:', error);
    return NextResponse.json(
      { error: 'Failed to process widget action' },
      { status: 500 }
    );
  }
}

async function handleParlayToggle(supabase: any, userId: string, action: any) {
  // Get or create user's active parlay
  const { data: parlay, error } = await supabase
    .from('user_parlays')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'building')
    .single();

  if (!parlay) {
    // Create new parlay
    await supabase
      .from('user_parlays')
      .insert({
        user_id: userId,
        picks: [action.pickId],
        status: 'building',
        created_at: new Date().toISOString()
      });
  } else {
    // Toggle pick in existing parlay
    const picks = parlay.picks || [];
    const index = picks.indexOf(action.pickId);
    
    if (index > -1) {
      picks.splice(index, 1);
    } else {
      picks.push(action.pickId);
    }
    
    await supabase
      .from('user_parlays')
      .update({ 
        picks,
        updated_at: new Date().toISOString() 
      })
      .eq('id', parlay.id);
  }

  return NextResponse.json({ success: true });
}

async function handlePlaceParlay(supabase: any, userId: string, action: any) {
  // Get active parlay
  const { data: parlay } = await supabase
    .from('user_parlays')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'building')
    .single();

  if (!parlay) {
    return NextResponse.json(
      { error: 'No active parlay found' },
      { status: 400 }
    );
  }

  // Update parlay status to placed
  await supabase
    .from('user_parlays')
    .update({
      status: 'placed',
      placed_at: new Date().toISOString()
    })
    .eq('id', parlay.id);

  // Get the picks data to calculate odds
  const { data: picks } = await supabase
    .from('ai_predictions')
    .select('*')
    .in('id', action.picks);

  // Calculate combined odds and potential payout
  let totalOdds = 1;
  picks?.forEach((pick: any) => {
    const odds = parseFloat(pick.odds?.replace('+', '') || '100') / 100;
    totalOdds *= (1 + odds);
  });

  return NextResponse.json({ 
    success: true,
    parlayId: parlay.id,
    totalOdds: `+${Math.round((totalOdds - 1) * 100)}`,
    pickCount: action.picks.length
  });
}

async function handleClearParlay(supabase: any, userId: string) {
  // Delete active parlay
  await supabase
    .from('user_parlays')
    .delete()
    .eq('user_id', userId)
    .eq('status', 'building');

  return NextResponse.json({ success: true });
}

async function handleSelectProp(supabase: any, userId: string, action: any) {
  // Store selected prop for user
  const { error } = await supabase
    .from('user_prop_selections')
    .upsert({
      user_id: userId,
      player: action.player,
      market: action.market,
      selection: action.selection,
      odds: action.odds,
      created_at: new Date().toISOString()
    });

  if (error) {
    return NextResponse.json(
      { error: 'Failed to save prop selection' },
      { status: 500 }
    );
  }

  return NextResponse.json({ 
    success: true,
    prop: {
      player: action.player,
      market: action.market,
      selection: action.selection
    }
  });
}

async function handleViewDetails(supabase: any, action: any) {
  // This would typically fetch more detailed data
  // For now, just return success
  return NextResponse.json({ 
    success: true,
    details: action.payload 
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const widgetType = searchParams.get('type');
  const params = searchParams.get('params');

  try {
    let widget;
    const parsedParams = params ? JSON.parse(params) : {};

    switch (widgetType) {
      case 'search_progress':
        widget = WidgetService.createSearchProgressWidget(parsedParams);
        break;
      case 'parlay_builder':
        widget = WidgetService.createParlayBuilderWidget(parsedParams);
        break;
      case 'odds_table':
        widget = WidgetService.createOddsTableWidget(parsedParams);
        break;
      case 'player_card':
        widget = WidgetService.createPlayerCardWidget(parsedParams);
        break;
      case 'live_picks':
        widget = WidgetService.createLivePicksTrackerWidget(parsedParams);
        break;
      case 'insights':
        widget = WidgetService.createInsightsWidget(parsedParams);
        break;
      default:
        return NextResponse.json(
          { error: 'Unknown widget type' },
          { status: 400 }
        );
    }

    return NextResponse.json({ widget });
  } catch (error) {
    console.error('Widget generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate widget' },
      { status: 500 }
    );
  }
}
