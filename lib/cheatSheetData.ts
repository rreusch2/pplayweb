// Data composition service for cheat sheets
// Pulls real picks and trends from Supabase

import { supabase } from './supabase'
import { supabaseAdmin } from './supabaseAdmin'

export interface CheatSheetPick {
  id: string
  match_teams: string
  pick: string
  odds: string
  confidence: number
  sport: string
  event_time: string
  reasoning?: string
  bet_type: string
  value_percentage?: number
}

export interface CheatSheetTrend {
  id: string
  trend_text: string
  confidence_score: string
  sport: string
  trend_type: string
  chart_data?: any
}

export interface DailyDigestContent {
  title: string
  summary: string
  sport: string
  picks: CheatSheetPick[]
  topPick: CheatSheetPick | null
  confidenceDistribution: { range: string; count: number }[]
  avgConfidence: number
  totalValue: number
  sportsBreakdown: { sport: string; count: number }[]
  generatedAt: string
}

/**
 * Fetch top AI picks for daily digest
 */
export async function fetchTopPicks(
  limit: number = 10,
  sports?: string[],
  minConfidence?: number
): Promise<CheatSheetPick[]> {
  let query = supabase
    .from('ai_predictions')
    .select('*')
    .eq('status', 'pending')
    .gte('event_time', new Date().toISOString())
    .order('confidence', { ascending: false })
    .order('value_percentage', { ascending: false })
    .limit(limit)

  if (sports && sports.length > 0) {
    query = query.in('sport', sports)
  }

  if (minConfidence) {
    query = query.gte('confidence', minConfidence)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching picks:', error)
    return []
  }

  return (data || []) as CheatSheetPick[]
}

/**
 * Fetch relevant trends
 */
export async function fetchRelevantTrends(
  sport?: string,
  limit: number = 5
): Promise<CheatSheetTrend[]> {
  let query = supabase
    .from('ai_trends')
    .select('*')
    .eq('is_global', true)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (sport) {
    query = query.eq('sport', sport)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching trends:', error)
    return []
  }

  return (data || []) as CheatSheetTrend[]
}

/**
 * Compose Daily Digest content
 */
export async function composeDailyDigest(
  userId: string,
  options: {
    sports?: string[]
    picksLimit?: number
    minConfidence?: number
  } = {}
): Promise<DailyDigestContent> {
  const { sports, picksLimit = 10, minConfidence = 60 } = options

  // Fetch picks
  const picks = await fetchTopPicks(picksLimit, sports, minConfidence)

  // Calculate stats
  const topPick = picks.length > 0 ? picks[0] : null
  const avgConfidence = picks.length > 0
    ? Math.round(picks.reduce((sum, p) => sum + (p.confidence || 0), 0) / picks.length)
    : 0
  const totalValue = picks.reduce((sum, p) => sum + (p.value_percentage || 0), 0)

  // Confidence distribution
  const confidenceRanges = [
    { range: '80-100%', min: 80, max: 100 },
    { range: '70-79%', min: 70, max: 79 },
    { range: '60-69%', min: 60, max: 69 },
    { range: '<60%', min: 0, max: 59 },
  ]
  const confidenceDistribution = confidenceRanges.map(({ range, min, max }) => ({
    range,
    count: picks.filter(p => (p.confidence || 0) >= min && (p.confidence || 0) <= max).length,
  }))

  // Sports breakdown
  const sportsCounts = picks.reduce((acc, pick) => {
    acc[pick.sport] = (acc[pick.sport] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  const sportsBreakdown = Object.entries(sportsCounts).map(([sport, count]) => ({
    sport,
    count,
  }))

  const title = `Daily Picks Digest - ${new Date().toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric' 
  })}`
  
  const summary = `${picks.length} AI-powered picks with ${avgConfidence}% avg confidence across ${sportsBreakdown.length} sports`

  return {
    title,
    summary,
    sport: sports && sports.length === 1 ? sports[0] : 'Multi-Sport',
    picks,
    topPick,
    confidenceDistribution,
    avgConfidence,
    totalValue: Math.round(totalValue * 10) / 10,
    sportsBreakdown,
    generatedAt: new Date().toISOString(),
  }
}

/**
 * Compose Player Prop Snapshot (Phase 2)
 */
export async function composePlayerPropSnapshot(
  playerId: string,
  propType: string
): Promise<any> {
  // TODO: Phase 2 - implement player prop snapshot
  throw new Error('Player prop snapshot not yet implemented')
}

/**
 * Get user's daily cheat sheet count (for tier gating)
 */
export async function getUserDailySheetCount(userId: string): Promise<number> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { count, error } = await supabase
    .from('cheat_sheets')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', today.toISOString())

  if (error) {
    console.error('Error fetching sheet count:', error)
    return 0
  }

  return count || 0
}

/**
 * Check if user can generate a cheat sheet based on tier
 */
export async function canUserGenerateSheet(
  userId: string,
  tier: string
): Promise<{ allowed: boolean; reason?: string }> {
  const dailyCount = await getUserDailySheetCount(userId)

  switch (tier.toLowerCase()) {
    case 'free':
      if (dailyCount >= 1) {
        return { 
          allowed: false, 
          reason: 'Free tier limited to 1 cheat sheet per day. Upgrade to Pro for unlimited sheets!' 
        }
      }
      return { allowed: true }
    
    case 'pro':
    case 'elite':
      return { allowed: true }
    
    default:
      return { 
        allowed: false, 
        reason: 'Invalid subscription tier' 
      }
  }
}
