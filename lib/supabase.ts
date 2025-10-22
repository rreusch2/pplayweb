import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables', { supabaseUrl: !!supabaseUrl, supabaseAnonKey: !!supabaseAnonKey });
}

// Custom storage implementation with better error handling and debugging
const createSafeStorage = (): Storage | undefined => {
  if (typeof window === 'undefined') {
    console.log('[Auth] Running on server, no storage available')
    return undefined
  }

  try {
    const storage = window.localStorage
    const testKey = '__supabase_test__'
    
    // Test if we can actually use localStorage
    storage.setItem(testKey, '1')
    storage.removeItem(testKey)
    
    console.log('[Auth] localStorage is available and working')
    
    // Return wrapped storage with error handling
    return {
      getItem: (key: string) => {
        try {
          return storage.getItem(key)
        } catch (error) {
          console.error('[Auth] Error reading from localStorage:', error)
          return null
        }
      },
      setItem: (key: string, value: string) => {
        try {
          storage.setItem(key, value)
        } catch (error) {
          console.error('[Auth] Error writing to localStorage:', error)
          // If quota exceeded or other error, try to clear old data
          if (error instanceof DOMException && error.name === 'QuotaExceededError') {
            console.warn('[Auth] localStorage quota exceeded, clearing auth data')
            try {
              Object.keys(storage)
                .filter(k => k.startsWith('sb-'))
                .forEach(k => storage.removeItem(k))
              // Try again
              storage.setItem(key, value)
            } catch (retryError) {
              console.error('[Auth] Failed to write even after clearing:', retryError)
            }
          }
        }
      },
      removeItem: (key: string) => {
        try {
          storage.removeItem(key)
        } catch (error) {
          console.error('[Auth] Error removing from localStorage:', error)
        }
      },
      clear: () => {
        try {
          // Only clear Supabase keys, not everything
          Object.keys(storage)
            .filter(k => k.startsWith('sb-'))
            .forEach(k => storage.removeItem(k))
        } catch (error) {
          console.error('[Auth] Error clearing localStorage:', error)
        }
      },
      get length() {
        return storage.length
      },
      key: (index: number) => {
        return storage.key(index)
      }
    }
  } catch (error) {
    console.warn('[Auth] localStorage unavailable (Safari private mode or blocked):', error)
    return undefined
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: createSafeStorage(),
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false, // Prevents issues with email confirmation links
    flowType: 'pkce',
    // Add debug logging in development
    debug: process.env.NODE_ENV === 'development',
  }
})

// Helper function to check if storage is working
export const isStorageAvailable = (): boolean => {
  if (typeof window === 'undefined') return false
  
  try {
    const test = '__storage_test__'
    window.localStorage.setItem(test, test)
    window.localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

// Helper to clear all auth data (useful for debugging/recovery)
export const clearAuthStorage = () => {
  if (typeof window === 'undefined') return
  
  try {
    const storage = window.localStorage
    Object.keys(storage)
      .filter(k => k.startsWith('sb-'))
      .forEach(k => storage.removeItem(k))
    console.log('[Auth] Cleared all auth storage')
  } catch (error) {
    console.error('[Auth] Failed to clear auth storage:', error)
  }
}

console.log('[Auth] Supabase client initialized with URL:', supabaseUrl)
console.log('[Auth] Storage available:', isStorageAvailable())

// Types matching your existing React Native app
export interface UserProfile {
  id: string
  username?: string
  email?: string
  avatar_url?: string
  created_at: string
  updated_at: string
  risk_tolerance: 'low' | 'medium' | 'high'
  favorite_teams: string[]
  favorite_players: string[]
  preferred_bet_types: string[]
  preferred_sports: string[]
  preferred_bookmakers: string[]
  subscription_tier: 'free' | 'pro' | 'elite'
  is_active: boolean
  welcome_bonus_claimed: boolean
  welcome_bonus_expires_at?: string
  push_token?: string
  admin_role: boolean
  notification_settings: any
  subscription_status: 'active' | 'inactive' | 'cancelled' | 'expired' | 'past_due'
  subscription_expires_at?: string
  apple_receipt_data?: string
  google_purchase_token?: string
  sport_preferences: any
  subscription_plan_type?: 'weekly' | 'monthly' | 'yearly' | 'lifetime'
  revenuecat_customer_id?: string
  subscription_product_id?: string
  subscription_started_at?: string
  betting_style?: 'conservative' | 'balanced' | 'aggressive'
}

export interface AIPrediction {
  id: string
  user_id: string
  match_teams: string
  pick: string
  odds: string
  confidence?: number
  sport: string
  event_time: string
  reasoning?: string
  value_percentage?: number
  roi_estimate?: number
  status: 'pending' | 'won' | 'lost' | 'cancelled'
  game_id?: string
  metadata?: any
  created_at: string
  updated_at: string
  bet_type: string
  player_id?: string
  prop_market_type?: string
  line_value?: number
  prediction_value?: number
  is_parlay_leg: boolean
  parlay_id?: string
  kelly_stake?: number
  expected_value?: number
  risk_level?: string
  implied_probability?: number
  fair_odds?: string
  key_factors?: any
}

export interface UserStats {
  todayPicks: number
  winRate: string
  roi: string
  streak: number
  totalBets: number
  profitLoss: string
}
