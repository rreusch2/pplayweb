// Utility functions for ChatKit integration

import { 
  createPlayerPropWidget, 
  createParlayWidget, 
  createGameAnalysisWidget,
  createTrendsWidget,
  createOddsMovementWidget 
} from './chatkit-widgets'
import type { SportsPick, ParlayBet, GameAnalysis } from '@/types/chatkit'

/**
 * Convert AI predictions to ChatKit widgets
 */
export function convertPicksToWidgets(picks: SportsPick[]): any[] {
  return picks.map(pick => {
    if (pick.bet_type === 'player_prop' && pick.player_name) {
      return createPlayerPropWidget({
        playerName: pick.player_name,
        team: pick.match_teams.split(' @ ')[0], // Extract team from match
        propType: pick.prop_type || 'Unknown',
        line: String(pick.line || 0),
        odds: pick.odds,
        confidence: pick.confidence,
        reasoning: pick.reasoning
      })
    }
    
    // Return as text if not a player prop
    return {
      type: 'Card',
      children: [
        {
          type: 'Title',
          value: pick.match_teams,
          size: 'md'
        },
        {
          type: 'Text',
          value: `${pick.pick} @ ${pick.odds}`,
          weight: 'semibold'
        },
        {
          type: 'Badge',
          label: `${pick.confidence}% Confidence`,
          color: pick.confidence >= 70 ? 'success' : 'warning'
        },
        {
          type: 'Text',
          value: pick.reasoning,
          size: 'sm'
        }
      ]
    }
  })
}

/**
 * Build a smart parlay widget from picks
 */
export function buildParlayFromPicks(picks: SportsPick[], stake?: number): any {
  const legs = picks.map(pick => ({
    id: pick.id,
    match: pick.match_teams,
    pick: pick.pick,
    odds: pick.odds
  }))

  // Calculate parlay odds (simplified)
  const totalOdds = calculateParlayOdds(legs.map(l => l.odds))
  const potentialPayout = stake ? calculatePayout(stake, totalOdds) : undefined

  return createParlayWidget({
    legs,
    totalOdds,
    stake,
    potentialPayout
  })
}

/**
 * Calculate combined parlay odds from American odds
 */
export function calculateParlayOdds(odds: string[]): string {
  let decimalProduct = 1

  for (const odd of odds) {
    const decimal = americanToDecimal(odd)
    decimalProduct *= decimal
  }

  return decimalToAmerican(decimalProduct)
}

/**
 * Convert American odds to decimal
 */
export function americanToDecimal(american: string): number {
  const num = parseInt(american.replace(/[+\-]/, ''))
  
  if (american.startsWith('+')) {
    return (num / 100) + 1
  } else {
    return (100 / num) + 1
  }
}

/**
 * Convert decimal odds to American
 */
export function decimalToAmerican(decimal: number): string {
  if (decimal >= 2) {
    const american = Math.round((decimal - 1) * 100)
    return `+${american}`
  } else {
    const american = Math.round(-100 / (decimal - 1))
    return `${american}`
  }
}

/**
 * Calculate payout from stake and odds
 */
export function calculatePayout(stake: number, odds: string): number {
  const decimal = americanToDecimal(odds)
  return Math.round(stake * decimal * 100) / 100
}

/**
 * Format game data for analysis widget
 */
export function formatGameForAnalysis(game: any): GameAnalysis {
  return {
    awayTeam: game.away_team,
    homeTeam: game.home_team,
    awayRecord: game.away_record || 'N/A',
    homeRecord: game.home_record || 'N/A',
    awayML: game.away_ml || 'N/A',
    homeML: game.home_ml || 'N/A',
    spread: game.spread || 'N/A',
    total: game.total || 'N/A',
    analysis: game.analysis,
    recommendation: game.recommendation
  }
}

/**
 * Parse trending data for widget
 */
export function parseTrendsData(trends: any[]): any {
  return trends.map(trend => ({
    player: trend.player_name,
    stat: trend.stat_type,
    trend: trend.is_hot ? 'HOT' : 'COLD',
    value: `${trend.current_value} (L${trend.games_tracked})`,
    positive: trend.is_positive
  }))
}

/**
 * Track odds movements for display
 */
export function trackOddsMovements(movements: any[]): any[] {
  return movements.map(move => ({
    game: move.game_name,
    oldLine: move.previous_line,
    newLine: move.current_line,
    favorable: move.is_favorable
  }))
}

/**
 * Generate a greeting based on time of day
 */
export function getTimeBasedGreeting(): string {
  const hour = new Date().getHours()
  
  if (hour < 12) {
    return "Good morning! Let's find some early value 🌅"
  } else if (hour < 17) {
    return "Afternoon games looking good! 🏆"
  } else if (hour < 20) {
    return "Prime time picks ready! 🎯"
  } else {
    return "Late night locks incoming! 🌙"
  }
}

/**
 * Format confidence level for display
 */
export function formatConfidence(confidence: number): string {
  if (confidence >= 80) {
    return '🔥 LOCK'
  } else if (confidence >= 70) {
    return '💪 Strong Play'
  } else if (confidence >= 60) {
    return '✅ Solid Pick'
  } else if (confidence >= 50) {
    return '📊 Value Play'
  } else {
    return '🎲 Risky'
  }
}

/**
 * Validate user has required tier for feature
 */
export function canAccessFeature(feature: string, tier: string): boolean {
  const features: Record<string, string[]> = {
    'basic_picks': ['free', 'pro', 'elite'],
    'parlays': ['pro', 'elite'],
    'player_props': ['pro', 'elite'],
    'advanced_analytics': ['elite'],
    'live_betting': ['elite'],
    'vip_picks': ['elite']
  }

  const allowedTiers = features[feature] || []
  return allowedTiers.includes(tier.toLowerCase())
}

/**
 * Format sports for display
 */
export function formatSport(sport: string): string {
  const sportMap: Record<string, string> = {
    'MLB': '⚾ MLB',
    'WNBA': '🏀 WNBA',
    'UFC': '🥊 UFC',
    'NFL': '🏈 NFL',
    'NBA': '🏀 NBA',
    'NHL': '🏒 NHL'
  }
  
  return sportMap[sport] || sport
}

/**
 * Generate session metadata for ChatKit
 */
export function generateSessionMetadata(user: any, profile: any): Record<string, any> {
  return {
    userId: user.id,
    email: user.email,
    tier: profile?.subscription_tier || 'free',
    sports: profile?.preferred_sports || ['MLB', 'WNBA'],
    riskTolerance: profile?.risk_tolerance || 'medium',
    bettingStyle: profile?.betting_style || 'balanced',
    sessionTime: new Date().toISOString(),
    platform: 'web'
  }
}
