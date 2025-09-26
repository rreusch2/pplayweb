import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { stripeSubscriptionService, SubscriptionInfo } from '@/lib/stripe-subscription-service'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface UseSubscriptionReturn {
  subscription: SubscriptionInfo | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  createCheckoutSession: (priceId: string, tier: 'pro' | 'elite', planId: string) => Promise<{ sessionId?: string; error?: string }>
  manageSubscription: () => Promise<{ url?: string; error?: string }>
  checkFeatureAccess: (feature: string) => boolean
  isProUser: boolean
  isEliteUser: boolean
  isPaidUser: boolean
}

/**
 * React hook for managing Stripe subscriptions
 * Provides real-time subscription status and management functions
 */
export function useSubscription(): UseSubscriptionReturn {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch subscription data
  const fetchSubscription = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setSubscription({
          tier: 'free',
          status: 'inactive',
          maxDailyPicks: 2,
          isActive: false
        })
        setLoading(false)
        return
      }

      const subscriptionData = await stripeSubscriptionService.getUserSubscription(user.id)
      setSubscription(subscriptionData)
      setError(null)
    } catch (err) {
      console.error('Error fetching subscription:', err)
      setError('Failed to load subscription data')
      setSubscription({
        tier: 'free',
        status: 'inactive',
        maxDailyPicks: 2,
        isActive: false
      })
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchSubscription()
  }, [fetchSubscription])

  // Real-time subscription updates
  useEffect(() => {
    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      // Subscribe to profile changes for real-time updates
      const subscription = supabase
        .channel('subscription-updates')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`,
          },
          (payload) => {
            console.log('🔄 Subscription updated via realtime:', payload.new)
            
            // Update subscription state with new data
            const newData = payload.new
            setSubscription({
              tier: newData.subscription_tier || 'free',
              status: newData.subscription_status || 'inactive',
              planType: newData.subscription_plan_type,
              expiresAt: newData.subscription_expires_at,
              maxDailyPicks: newData.max_daily_picks || 2,
              isActive: newData.subscription_status === 'active'
            })
          }
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }

    setupRealtimeSubscription()
  }, [])

  // Create checkout session
  const createCheckoutSession = useCallback(async (priceId: string, tier: 'pro' | 'elite', planId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return { error: 'User not authenticated' }
      }

      return await stripeSubscriptionService.createCheckoutSession({
        priceId,
        userId: user.id,
        planId,
        tier
      })
    } catch (error) {
      console.error('Error creating checkout session:', error)
      return { error: 'Failed to create checkout session' }
    }
  }, [])

  // Manage subscription (customer portal)
  const manageSubscription = useCallback(async () => {
    return await stripeSubscriptionService.manageSubscription()
  }, [])

  // Check feature access
  const checkFeatureAccess = useCallback((feature: string) => {
    if (!subscription) return false
    return stripeSubscriptionService.checkFeatureAccess(subscription, feature)
  }, [subscription])

  // Computed properties
  const isProUser = subscription?.tier === 'pro' && subscription?.isActive
  const isEliteUser = subscription?.tier === 'elite' && subscription?.isActive
  const isPaidUser = (subscription?.tier === 'pro' || subscription?.tier === 'elite') && subscription?.isActive

  return {
    subscription,
    loading,
    error,
    refetch: fetchSubscription,
    createCheckoutSession,
    manageSubscription,
    checkFeatureAccess,
    isProUser,
    isEliteUser,
    isPaidUser
  }
}
