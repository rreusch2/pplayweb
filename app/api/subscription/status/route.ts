import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import SubscriptionChecker from '../../../lib/subscriptionChecker'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const forceCheck = searchParams.get('forceCheck') === 'true'

    // Get user from auth header if no userId provided
    let targetUserId = userId
    if (!targetUserId) {
      const authHeader = request.headers.get('authorization')
      if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: 'Authorization required' },
          { status: 401 }
        )
      }

      const token = authHeader.replace('Bearer ', '')
      const { data: { user }, error } = await supabase.auth.getUser(token)
      
      if (error || !user) {
        return NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        )
      }

      targetUserId = user.id
    }

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      )
    }

    // Force check against Stripe or use cached database values
    let subscriptionStatus
    if (forceCheck) {
      subscriptionStatus = await SubscriptionChecker.checkUserSubscriptionStatus(targetUserId)
    } else {
      // Get current status from database
      const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .select(`
          subscription_tier,
          subscription_status,
          subscription_plan_type,
          subscription_expires_at,
          subscription_started_at,
          subscription_source,
          max_daily_picks,
          updated_at
        `)
        .eq('id', targetUserId)
        .single()

      if (error || !profile) {
        return NextResponse.json(
          { error: 'User profile not found' },
          { status: 404 }
        )
      }

      // Check if subscription is expired
      const now = new Date()
      const isExpired = profile.subscription_expires_at && 
                       now > new Date(profile.subscription_expires_at) &&
                       profile.subscription_tier !== 'free'

      subscriptionStatus = {
        isActive: profile.subscription_tier !== 'free' && !isExpired,
        tier: isExpired ? 'free' : profile.subscription_tier,
        planType: profile.subscription_plan_type,
        expiresAt: profile.subscription_expires_at,
        startedAt: profile.subscription_started_at,
        status: isExpired ? 'expired' : profile.subscription_status,
        source: profile.subscription_source,
        maxDailyPicks: profile.max_daily_picks || (profile.subscription_tier === 'elite' ? 30 : profile.subscription_tier === 'pro' ? 20 : 2),
        lastChecked: profile.updated_at
      }

      // If expired, update database
      if (isExpired) {
        await supabaseAdmin
          .from('profiles')
          .update({
            subscription_tier: 'free',
            subscription_status: 'expired',
            max_daily_picks: 2,
            updated_at: new Date().toISOString()
          })
          .eq('id', targetUserId)
      }
    }

    return NextResponse.json({
      userId: targetUserId,
      ...subscriptionStatus,
      features: getFeaturesByTier(subscriptionStatus.tier)
    })

  } catch (error) {
    console.error('Subscription status API error:', error)
    return NextResponse.json(
      { error: 'Failed to get subscription status' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, userId } = body

    if (!action) {
      return NextResponse.json(
        { error: 'action parameter required' },
        { status: 400 }
      )
    }

    let result: any = { action, timestamp: new Date().toISOString() }

    switch (action) {
      case 'refresh':
        if (!userId) {
          return NextResponse.json(
            { error: 'userId required for refresh' },
            { status: 400 }
          )
        }

        const refreshedStatus = await SubscriptionChecker.checkUserSubscriptionStatus(userId)
        result.subscriptionStatus = {
          ...refreshedStatus,
          features: getFeaturesByTier(refreshedStatus.tier)
        }
        break

      case 'batch_check':
        const { userIds } = body
        await SubscriptionChecker.batchCheckSubscriptions(userIds)
        result.message = `Batch check completed for ${userIds?.length || 'all'} users`
        break

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Subscription status POST error:', error)
    return NextResponse.json(
      { error: 'Action failed' },
      { status: 500 }
    )
  }
}

function getFeaturesByTier(tier: string) {
  switch (tier) {
    case 'elite':
      return {
        dailyPicks: 30,
        dailyInsights: 12,
        chatMessages: 'unlimited',
        playOfTheDay: true,
        advancedProfessorLock: true,
        premiumAnalytics: true,
        prioritySupport: true
      }
    case 'pro':
      return {
        dailyPicks: 20,
        dailyInsights: 8,
        chatMessages: 'unlimited',
        playOfTheDay: true,
        advancedProfessorLock: false,
        premiumAnalytics: true,
        prioritySupport: false
      }
    default: // free
      return {
        dailyPicks: 2,
        dailyInsights: 2,
        chatMessages: 3,
        playOfTheDay: false,
        advancedProfessorLock: false,
        premiumAnalytics: false,
        prioritySupport: false
      }
  }
}
