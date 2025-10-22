import { supabase } from '@/lib/supabase'

// Use shared browser Supabase client to keep auth/session consistent across app

export interface SubscriptionInfo {
  tier: 'free' | 'pro' | 'elite'
  status: string
  planType?: string
  expiresAt?: string
  maxDailyPicks: number
  isActive: boolean
}

export interface CreateCheckoutSessionParams {
  priceId: string
  userId: string
  planId: string
  tier: 'pro' | 'elite'
  successUrl?: string
  cancelUrl?: string
}

/**
 * Comprehensive Stripe Subscription Service
 * Single source of truth for subscription management in the web app
 */
export class StripeSubscriptionService {
  
  /**
   * Get current user's subscription status from database
   */
  async getUserSubscription(userId: string): Promise<SubscriptionInfo> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('subscription_tier, subscription_status, subscription_plan_type, subscription_expires_at, max_daily_picks')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user subscription:', error)
        return this.getDefaultSubscription()
      }

      const now = new Date()
      const expiresAt = profile.subscription_expires_at ? new Date(profile.subscription_expires_at) : null
      const isExpired = expiresAt && now > expiresAt
      
      // If subscription is expired, treat as free
      if (isExpired && profile.subscription_tier !== 'free') {
        console.log('Subscription expired, treating as free')
        return {
          tier: 'free',
          status: 'expired',
          maxDailyPicks: 2,
          isActive: false
        }
      }

      return {
        tier: profile.subscription_tier || 'free',
        status: profile.subscription_status || 'inactive',
        planType: profile.subscription_plan_type,
        expiresAt: profile.subscription_expires_at,
        maxDailyPicks: profile.max_daily_picks || 2,
        isActive: profile.subscription_status === 'active' && !isExpired
      }
    } catch (error) {
      console.error('Error in getUserSubscription:', error)
      return this.getDefaultSubscription()
    }
  }

  /**
   * Create Stripe checkout session
   */
  async createCheckoutSession(params: CreateCheckoutSessionParams): Promise<{ sessionId?: string; error?: string }> {
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: params.priceId,
          userId: params.userId,
          successUrl: params.successUrl || `${window.location.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: params.cancelUrl || `${window.location.origin}/dashboard`,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        return { error: errorData.error || 'Failed to create checkout session' }
      }

      const { sessionId } = await response.json()
      return { sessionId }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      return { error: 'Network error creating checkout session' }
    }
  }

  /**
   * Check if user can access feature based on subscription tier
   */
  checkFeatureAccess(subscription: SubscriptionInfo, feature: string): boolean {
    if (!subscription.isActive && subscription.tier !== 'free') {
      return false // Expired subscription
    }

    switch (feature) {
      case 'unlimited_picks':
        return subscription.tier === 'pro' || subscription.tier === 'elite'
      
      case 'advanced_analytics':
        return subscription.tier === 'elite'
      
      case 'professor_lock_unlimited':
        return subscription.tier === 'pro' || subscription.tier === 'elite'
      
      case 'advanced_professor_lock':
        return subscription.tier === 'elite'
      
      case 'play_of_the_day':
        return subscription.tier === 'pro' || subscription.tier === 'elite'
      
      case 'custom_filters':
        return subscription.tier === 'elite'
      
      default:
        return true // Free features
    }
  }

  /**
   * Get subscription tier limits
   */
  getTierLimits(tier: 'free' | 'pro' | 'elite') {
    switch (tier) {
      case 'free':
        return {
          dailyPicks: 2,
          insights: 2,
          chatMessages: 3,
          features: ['basic_picks', 'limited_chat']
        }
      case 'pro':
        return {
          dailyPicks: 20,
          insights: 8,
          chatMessages: 'unlimited',
          features: ['unlimited_picks', 'professor_lock_unlimited', 'play_of_the_day', 'advanced_analytics']
        }
      case 'elite':
        return {
          dailyPicks: 30,
          insights: 12,
          chatMessages: 'unlimited',
          features: ['unlimited_picks', 'professor_lock_unlimited', 'advanced_professor_lock', 'play_of_the_day', 'advanced_analytics', 'custom_filters', 'priority_support']
        }
    }
  }

  /**
   * Handle subscription status changes (called by webhooks or manual sync)
   */
  async syncSubscriptionStatus(userId: string): Promise<SubscriptionInfo> {
    // This would typically be called after webhook events
    // For now, just fetch current status
    return this.getUserSubscription(userId)
  }

  /**
   * Cancel subscription (redirect to customer portal)
   */
  async manageSubscription(): Promise<{ url?: string; error?: string }> {
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        return { error: errorData.error || 'Failed to create portal session' }
      }

      const { url } = await response.json()
      return { url }
    } catch (error) {
      console.error('Error creating portal session:', error)
      return { error: 'Network error accessing customer portal' }
    }
  }

  /**
   * Get price mapping for tiers
   */
  getPriceIds() {
    return {
      pro: {
        weekly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_WEEKLY!,
        monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY!,
        yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY!,
        daypass: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_DAYPASS!,
        lifetime: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_LIFETIME!,
      },
      elite: {
        weekly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ELITE_WEEKLY!,
        monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ELITE_MONTHLY!,
        yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ELITE_YEARLY!,
        daypass: process.env.NEXT_PUBLIC_STRIPE_PRICE_ELITE_DAYPASS!,
        lifetime: process.env.NEXT_PUBLIC_STRIPE_PRICE_ELITE_LIFETIME!,
      }
    }
  }

  /**
   * Default subscription for errors/fallbacks
   */
  private getDefaultSubscription(): SubscriptionInfo {
    return {
      tier: 'free',
      status: 'inactive',
      maxDailyPicks: 2,
      isActive: false
    }
  }
}

// Export singleton instance
export const stripeSubscriptionService = new StripeSubscriptionService()
