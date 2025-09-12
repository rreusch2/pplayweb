import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const trendId = searchParams.get('trendId');

  if (!trendId) {
    return NextResponse.json({ error: 'Trend ID is required' }, { status: 400 });
  }

  try {
    const { data: trend, error: trendError } = await supabase
      .from('ai_trends')
      .select('*')
      .eq('id', trendId)
      .single();

    if (trendError) {
      throw trendError;
    }

    if (!trend) {
      return NextResponse.json({ error: 'Trend not found' }, { status: 404 });
    }

    // Resolve prop_type_id from metadata or by mapping a prop key/name
    const meta = trend.metadata || {};
    const isUuid = (v?: string | null) => !!v && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

    let propTypeId: string | null = null;
    if (isUuid(meta?.prop_type_id)) {
      propTypeId = meta.prop_type_id as string;
    } else {
      // Attempt to derive prop_key from chart/metadata fields
      const raw = (meta?.prop_type || trend.chart_data?.prop_type || meta?.chart_type || '').toString();
      const norm = raw.toLowerCase().replace(/\s+/g, '_');
      const keyMap: Record<string, string> = {
        hits: 'batter_hits',
        home_runs: 'batter_home_runs',
        rbis: 'batter_rbis',
        runs: 'batter_runs_scored',
        runs_scored: 'batter_runs_scored',
        total_bases: 'batter_total_bases',
        points: 'player_points',
        rebounds: 'player_rebounds',
        assists: 'player_assists',
        three_pointers: 'three_pointers',
        threes: 'three_pointers',
        strikeouts: 'pitcher_strikeouts',
      };
      const propKey = keyMap[norm] || norm;
      if (propKey) {
        const { data: pt } = await supabase
          .from('player_prop_types')
          .select('id')
          .eq('prop_key', propKey)
          .limit(1);
        if (pt && pt.length > 0) propTypeId = pt[0].id as string;
      }
    }

    // Fetch most recent line for this player and prop type
    let propData: any = null;
    if (propTypeId) {
      const eventId = meta?.event_id;
      if (isUuid(eventId)) {
        const { data: eventScoped } = await supabase
          .from('player_props_odds')
          .select('line, over_odds, under_odds, event_id, prop_type_id, last_update')
          .eq('player_id', trend.player_id)
          .eq('prop_type_id', propTypeId)
          .eq('event_id', eventId as string)
          .order('last_update', { ascending: false })
          .limit(1);
        if (eventScoped && eventScoped.length > 0) {
          propData = eventScoped[0];
        }
      }

      if (!propData) {
        const { data: latestAny } = await supabase
          .from('player_props_odds')
          .select('line, over_odds, under_odds, event_id, prop_type_id, last_update')
          .eq('player_id', trend.player_id)
          .eq('prop_type_id', propTypeId)
          .order('last_update', { ascending: false })
          .limit(1);
        if (latestAny && latestAny.length > 0) {
          propData = latestAny[0];
        }
      }
    }

    // Fetch event details if event_id available
    let eventData: any = null;
    if (isUuid(meta?.event_id)) {
      const { data: ev } = await supabase
        .from('sports_events')
        .select('home_team, away_team, start_time')
        .eq('id', meta.event_id as string)
        .limit(1);
      if (ev && ev.length > 0) eventData = ev[0];
    }

    return NextResponse.json({
      ...trend,
      prop_line: propData?.line ?? null,
      over_odds: propData?.over_odds ?? null,
      under_odds: propData?.under_odds ?? null,
      event_details: eventData
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
