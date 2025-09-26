import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export interface SubscriptionStatus {
  isActive: boolean
  tier: 'free' | 'pro' | 'elite'
  planType?: string
  expiresAt?: string
  status?: string
  lastChecked: string
}

export class SubscriptionChecker {
  
  /**
   * Check user's subscription status directly from Stripe
   */
  static async checkUserSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
    try {
      console.log(`🔍 Checking subscription status for user: ${userId}`)

      // Get user's profile from Supabase
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select(`
          id,
          email,
          subscription_tier,
          subscription_status,
          subscription_expires_at,
          subscription_plan_type,
          subscription_source,
          revenuecat_customer_id
        `)
        .eq('id', userId)
        .single()

      if (profileError || !profile) {
        console.error('❌ User profile not found:', profileError)
        return {
          isActive: false,
          tier: 'free',
          lastChecked: new Date().toISOString()
        }
      }

      // If user has RevenueCat subscription (mobile app), don't override with Stripe
      if (profile.subscription_source === 'revenuecat' && profile.subscription_tier !== 'free') {
        console.log('ℹ️ User has RevenueCat subscription, skipping Stripe check')
        return {
          isActive: profile.subscription_tier !== 'free',
          tier: profile.subscription_tier as 'free' | 'pro' | 'elite',
          planType: profile.subscription_plan_type,
          expiresAt: profile.subscription_expires_at,
          status: profile.subscription_status,
          lastChecked: new Date().toISOString()
        }
      }

      // Check if user has expired subscription in database
      if (profile.subscription_expires_at) {
        const expiresAt = new Date(profile.subscription_expires_at)
        const now = new Date()
        
        if (now > expiresAt && profile.subscription_tier !== 'free') {
          console.log('⏰ Subscription expired, downgrading user to free')
          await this.updateUserSubscription(userId, {
            subscription_tier: 'free',
            subscription_status: 'expired',
            subscription_expires_at: now.toISOString()
          })
          
          return {
            isActive: false,
            tier: 'free',
            status: 'expired',
            lastChecked: new Date().toISOString()
          }
        }
      }

      // If user has email, check for active Stripe subscriptions
      if (profile.email) {
        const stripeStatus = await this.checkStripeSubscriptions(profile.email)
        
        // If Stripe shows active subscription but database doesn't match, update database
        if (stripeStatus.isActive && profile.subscription_tier === 'free') {
          console.log('🔄 Found active Stripe subscription, updating database')
          await this.updateUserSubscription(userId, {
            subscription_tier: stripeStatus.tier,
            subscription_status: 'active',
            subscription_plan_type: stripeStatus.planType,
            subscription_expires_at: stripeStatus.expiresAt,
            subscription_source: 'stripe_web'
          })
          
          return stripeStatus
        }
        
        // If database shows active but Stripe doesn't, downgrade database
        if (!stripeStatus.isActive && profile.subscription_tier !== 'free') {
          console.log('⬇️ No active Stripe subscription found, downgrading database')
          await this.updateUserSubscription(userId, {
            subscription_tier: 'free',
            subscription_status: 'canceled',
            subscription_expires_at: new Date().toISOString()
          })
          
          return {
            isActive: false,
            tier: 'free',
            status: 'canceled',
            lastChecked: new Date().toISOString()
          }
        }
      }

      // Return current database status
      return {
        isActive: profile.subscription_tier !== 'free',
        tier: profile.subscription_tier as 'free' | 'pro' | 'elite',
        planType: profile.subscription_plan_type,
        expiresAt: profile.subscription_expires_at,
        status: profile.subscription_status,
        lastChecked: new Date().toISOString()
      }

    } catch (error) {
      console.error('❌ Error checking subscription status:', error)
      return {
        isActive: false,
        tier: 'free',
        lastChecked: new Date().toISOString()
      }
    }
  }

  /**
   * Check Stripe for active subscriptions by customer email
   */
  private static async checkStripeSubscriptions(email: string): Promise<SubscriptionStatus> {
    try {
      // Find customer by email
      const customers = await stripe.customers.list({
        email: email,
        limit: 1
      })

      if (customers.data.length === 0) {
        console.log('ℹ️ No Stripe customer found for email')
        return {
          isActive: false,
          tier: 'free',
          lastChecked: new Date().toISOString()
        }
      }

      const customer = customers.data[0]
      
      // Get active subscriptions for customer
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        status: 'active',
        limit: 10
      })

      if (subscriptions.data.length === 0) {
        console.log('ℹ️ No active Stripe subscriptions found')
        return {
          isActive: false,
          tier: 'free',
          lastChecked: new Date().toISOString()
        }
      }

      // Get the most recent active subscription
      const subscription = subscriptions.data[0]
      const priceId = subscription.items.data[0]?.price?.id
      const interval = subscription.items.data[0]?.price?.recurring?.interval
      const expiresAt = new Date(subscription.current_period_end * 1000).toISOString()

      // Determine tier from price ID or subscription metadata
      let tier: 'pro' | 'elite' = 'pro'
      if (subscription.metadata?.subscription_type?.startsWith('elite') || 
          priceId?.includes('elite') || 
          priceId?.includes('allstar')) {
        tier = 'elite'
      }

      console.log('✅ Found active Stripe subscription:', {
        subscriptionId: subscription.id,
        status: subscription.status,
        tier,
        interval,
        expiresAt
      })

      return {
        isActive: true,
        tier,
        planType: interval || 'month',
        expiresAt,
        status: subscription.status,
        lastChecked: new Date().toISOString()
      }

    } catch (error) {
      console.error('❌ Error checking Stripe subscriptions:', error)
      return {
        isActive: false,
        tier: 'free',
        lastChecked: new Date().toISOString()
      }
    }
  }

  /**
   * Update user subscription in database
   */
  private static async updateUserSubscription(userId: string, updateData: any) {
    try {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) {
        console.error('❌ Failed to update user subscription:', error)
        throw error
      }

      console.log('✅ Updated user subscription in database')
    } catch (error) {
      console.error('❌ Error updating user subscription:', error)
      throw error
    }
  }

  /**
   * Batch check multiple users (for cron job)
   */
  static async batchCheckSubscriptions(userIds?: string[]): Promise<void> {
    try {
      console.log('🔄 Starting batch subscription check...')

      let query = supabaseAdmin
        .from('profiles')
        .select('id, email, subscription_tier, subscription_expires_at, subscription_source')

      // If specific user IDs provided, filter by them
      if (userIds && userIds.length > 0) {
        query = query.in('id', userIds)
      } else {
        // Otherwise, check users with active subscriptions or those that expire soon
        const threeDaysFromNow = new Date()
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
        
        query = query.or(`subscription_tier.neq.free,subscription_expires_at.lt.${threeDaysFromNow.toISOString()}`)
      }

      const { data: profiles, error } = await query.limit(100) // Limit to prevent timeout

      if (error) {
        console.error('❌ Error fetching profiles for batch check:', error)
        return
      }

      console.log(`📊 Checking ${profiles?.length || 0} user subscriptions...`)

      if (profiles) {
        const promises = profiles.map(profile => 
          this.checkUserSubscriptionStatus(profile.id).catch(error => {
            console.error(`❌ Error checking subscription for user ${profile.id}:`, error)
            return null
          })
        )

        await Promise.all(promises)
      }

      console.log('✅ Batch subscription check completed')

    } catch (error) {
      console.error('❌ Error in batch subscription check:', error)
    }
  }

  /**
   * Check and fix subscription inconsistencies
   */
  static async fixSubscriptionInconsistencies(): Promise<{
    checked: number
    fixed: number
    errors: number
  }> {
    let checked = 0
    let fixed = 0
    let errors = 0

    try {
      console.log('🔧 Starting subscription inconsistency fix...')

      // Get users who might have inconsistencies
      const { data: profiles, error } = await supabaseAdmin
        .from('profiles')
        .select('id, email, subscription_tier, subscription_status, subscription_expires_at')
        .neq('subscription_tier', 'free')
        .limit(50)

      if (error) {
        console.error('❌ Error fetching profiles:', error)
        return { checked: 0, fixed: 0, errors: 1 }
      }

      if (!profiles || profiles.length === 0) {
        console.log('ℹ️ No active subscriptions to check')
        return { checked: 0, fixed: 0, errors: 0 }
      }

      for (const profile of profiles) {
        try {
          checked++
          const currentStatus = await this.checkUserSubscriptionStatus(profile.id)
          
          // If status changed, it was automatically fixed by checkUserSubscriptionStatus
          if (currentStatus.tier !== profile.subscription_tier) {
            fixed++
            console.log(`🔧 Fixed inconsistency for user ${profile.id}: ${profile.subscription_tier} → ${currentStatus.tier}`)
          }

        } catch (error) {
          errors++
          console.error(`❌ Error fixing subscription for user ${profile.id}:`, error)
        }
      }

      console.log(`✅ Subscription fix completed: ${checked} checked, ${fixed} fixed, ${errors} errors`)
      return { checked, fixed, errors }

    } catch (error) {
      console.error('❌ Error in fixSubscriptionInconsistencies:', error)
      return { checked, fixed, errors: errors + 1 }
    }
  }
}

export default SubscriptionChecker
