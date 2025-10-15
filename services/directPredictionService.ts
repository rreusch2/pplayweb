// Direct Supabase prediction service - matches mobile app architecture
import { supabase } from '@/lib/supabase'

export interface AIPrediction {
  id: string
  match: string
  pick: string
  odds: string
  confidence: number
  sport: string
  eventTime: string
  reasoning: string
  value?: number
  value_percentage?: number
  roi_estimate?: number
  kelly_stake?: number
  expected_value?: number
  risk_level?: string
  implied_probability?: number
  fair_odds?: string
  key_factors?: string[]
  status?: 'pending' | 'won' | 'lost' | 'cancelled'
  created_at?: string
  match_teams?: string
  bet_type?: string
  actual_result?: string
  profit_loss?: number
  league?: string
  game_id?: string
  metadata?: any
}

class DirectPredictionService {
  // Get predictions based on user's subscription tier
  async getPredictions(userId: string, subscriptionTier: string = 'free'): Promise<AIPrediction[]> {
    try {
      // First check for welcome bonus
      const { data: profile } = await supabase
        .from('profiles')
        .select('welcome_bonus_claimed, welcome_bonus_expires_at, created_at')
        .eq('id', userId)
        .single()
      
      // Check if in welcome bonus period (24 hours)
      const isWelcomeBonus = profile?.welcome_bonus_claimed === false && 
        profile?.welcome_bonus_expires_at && 
        new Date(profile.welcome_bonus_expires_at) > new Date()
      
      // Determine pick limits based on tier (matching mobile app)
      let pickLimit = 2 // Free tier default
      
      if (subscriptionTier === 'elite') {
        pickLimit = 30 // Elite: 30 picks (15 team, 15 props)
      } else if (subscriptionTier === 'pro') {
        pickLimit = 20 // Pro: 20 picks
      } else if (isWelcomeBonus) {
        pickLimit = 5 // Free with welcome bonus: 5 picks
      }
      
      console.log(`🎯 Fetching ${pickLimit} picks for ${subscriptionTier} user (welcome bonus: ${isWelcomeBonus})`)
      
      // Fetch predictions directly from Supabase
      let query = supabase
        .from('ai_predictions')
        .select('*')
        .order('created_at', { ascending: false })
      
      // For Elite users, get a mix of team and prop picks
      if (subscriptionTier === 'elite') {
        // Fetch team picks
        const { data: teamPicks } = await supabase
          .from('ai_predictions')
          .select('*')
          .in('bet_type', ['moneyline', 'spread', 'total'])
          .order('created_at', { ascending: false })
          .limit(15)
        
        // Fetch prop picks
        const { data: propPicks } = await supabase
          .from('ai_predictions')
          .select('*')
          .eq('bet_type', 'player_prop')
          .order('created_at', { ascending: false })
          .limit(15)
        
        const allPicks = [...(teamPicks || []), ...(propPicks || [])]
        
        return this.transformPredictions(allPicks)
      } else {
        // For Free and Pro users, just get the most recent picks
        query = query.limit(pickLimit)
        
        const { data, error } = await query
        
        if (error) {
          console.error('Error fetching predictions:', error)
          return []
        }
        
        return this.transformPredictions(data || [])
      }
    } catch (error) {
      console.error('Error in getPredictions:', error)
      return []
    }
  }
  
  // Transform database records to AIPrediction interface
  private transformPredictions(data: any[]): AIPrediction[] {
    return data.map(pred => ({
      id: pred.id,
      match: pred.match_teams || 'Game Details',
      pick: pred.pick,
      odds: pred.odds,
      confidence: pred.confidence,
      sport: pred.sport || 'MLB',
      eventTime: pred.event_time || pred.created_at,
      reasoning: pred.reasoning || '',
      value_percentage: pred.value_percentage,
      roi_estimate: pred.roi_estimate,
      kelly_stake: pred.kelly_stake,
      expected_value: pred.expected_value,
      risk_level: pred.risk_level,
      implied_probability: pred.implied_probability,
      fair_odds: pred.fair_odds,
      key_factors: pred.key_factors,
      status: pred.status || 'pending',
      created_at: pred.created_at,
      match_teams: pred.match_teams,
      bet_type: pred.bet_type,
      actual_result: pred.actual_result,
      profit_loss: pred.profit_loss,
      league: pred.sport,
      game_id: pred.game_id,
      metadata: pred.metadata
    }))
  }
  
  // Get predictions by sport (for filtering)
  async getPredictionsBySport(sport: string, limit: number = 10): Promise<AIPrediction[]> {
    try {
      const { data, error } = await supabase
        .from('ai_predictions')
        .select('*')
        .eq('sport', sport.toUpperCase())
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (error) {
        console.error('Error fetching predictions by sport:', error)
        return []
      }
      
      return this.transformPredictions(data || [])
    } catch (error) {
      console.error('Error in getPredictionsBySport:', error)
      return []
    }
  }
  
  // Get high confidence picks (for Pro/Elite users)
  async getHighConfidencePicks(limit: number = 5): Promise<AIPrediction[]> {
    try {
      const { data, error } = await supabase
        .from('ai_predictions')
        .select('*')
        .gte('confidence', 85)
        .order('confidence', { ascending: false })
        .limit(limit)
      
      if (error) {
        console.error('Error fetching high confidence picks:', error)
        return []
      }
      
      return this.transformPredictions(data || [])
    } catch (error) {
      console.error('Error in getHighConfidencePicks:', error)
      return []
    }
  }
  
  // Get Lock of the Day (highest confidence pick)
  async getLockOfTheDay(): Promise<AIPrediction | null> {
    try {
      const { data, error } = await supabase
        .from('ai_predictions')
        .select('*')
        .order('confidence', { ascending: false })
        .limit(1)
        .single()
      
      if (error) {
        console.error('Error fetching Lock of the Day:', error)
        return null
      }
      
      const transformed = this.transformPredictions([data])
      return transformed[0] || null
    } catch (error) {
      console.error('Error in getLockOfTheDay:', error)
      return null
    }
  }
}

export const predictionService = new DirectPredictionService()
