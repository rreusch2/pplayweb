// ChatKit type definitions for ParleyApp

export interface ChatKitSession {
  id: string
  client_secret: string
  user_preferences?: UserPreferences
}

export interface UserPreferences {
  sports?: string[]
  riskTolerance?: 'conservative' | 'medium' | 'aggressive'
  bettingStyle?: 'balanced' | 'value' | 'favorites' | 'underdogs'
}

export interface SportsPick {
  id: string
  match_teams: string
  pick: string
  odds: string
  confidence: number
  sport: string
  bet_type: 'moneyline' | 'spread' | 'total' | 'player_prop'
  reasoning: string
  value_percentage?: number
  roi_estimate?: number
  player_name?: string
  prop_type?: string
  line?: number
}

export interface ParlayLeg {
  id: string
  match: string
  pick: string
  odds: string
}

export interface ParlayBet {
  legs: ParlayLeg[]
  totalOdds: string
  stake?: number
  potentialPayout?: number
}

export interface GameAnalysis {
  awayTeam: string
  homeTeam: string
  awayRecord: string
  homeRecord: string
  awayML: string
  homeML: string
  spread: string
  total: string
  analysis?: string
  recommendation?: string
}

export interface BettingTrend {
  player: string
  stat: string
  trend: 'HOT' | 'COLD'
  value: string
  positive: boolean
}

export interface OddsMovement {
  game: string
  oldLine: string
  newLine: string
  favorable: boolean
}

// Widget action types
export type WidgetActionType = 
  | 'add_to_betslip'
  | 'place_parlay'
  | 'clear_parlay'
  | 'view_trend_details'
  | 'analyze_game'
  | 'build_parlay'
  | 'get_player_props'

export interface WidgetAction {
  type: WidgetActionType
  payload: Record<string, any>
}

// Chat message types
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata?: {
    widgets?: any[]
    tools?: string[]
  }
}

// Tool definitions for ChatKit
export interface ChatKitTool {
  id: string
  label: string
  shortLabel?: string
  placeholderOverride?: string
  icon?: string
  pinned?: boolean
}

// Prompt suggestions
export interface ChatKitPrompt {
  icon?: string
  label: string
  prompt: string
}
