import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import SubscriptionChecker from '../../../../lib/subscriptionChecker'

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

// Verify cron job authorization
function verifyCronAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.warn('CRON_SECRET not configured - allowing cron job for development')
    return true
  }

  if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
    return false
  }

  return true
}

export async function POST(request: NextRequest) {
  try {
    // Verify authorization for cron jobs
    if (!verifyCronAuth(request)) {
      console.error('Unauthorized cron request')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const startTime = Date.now()
    const today = new Date().toISOString().split('T')[0]
    
    console.log(`🔄 Starting subscription maintenance cron job - ${new Date().toISOString()}`)

    // Get all users with subscriptions that need checking
    const { data: users, error: usersError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, subscription_tier, subscription_status, subscription_expires_at, updated_at')
      .neq('subscription_tier', 'free')
      .or('subscription_status.eq.active,subscription_status.eq.past_due,subscription_status.eq.unpaid')

    if (usersError) {
      console.error('Error fetching users for cron:', usersError)
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    if (!users || users.length === 0) {
      console.log('✅ No active subscriptions to check')
      return NextResponse.json({
        message: 'No active subscriptions to check',
        usersChecked: 0,
        duration: `${Date.now() - startTime}ms`
      })
    }

    console.log(`📊 Found ${users.length} users with active subscriptions to check`)

    // Track results
    let checkedCount = 0
    let updatedCount = 0
    let errorCount = 0
    const results: any[] = []

    // Check subscriptions in batches to avoid rate limits
    const batchSize = 10
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize)
      const batchPromises = batch.map(async (user) => {
        try {
          const beforeStatus = {
            tier: user.subscription_tier,
            status: user.subscription_status,
            expiresAt: user.subscription_expires_at
          }

          // Check subscription status with Stripe
          const result = await SubscriptionChecker.checkUserSubscriptionStatus(user.id)
          checkedCount++

          // Compare if anything changed
          const changed = (
            result.tier !== beforeStatus.tier ||
            result.status !== beforeStatus.status ||
            result.expiresAt !== beforeStatus.expiresAt
          )

          if (changed) {
            updatedCount++
            console.log(`🔄 Updated subscription for user ${user.id}: ${beforeStatus.tier}→${result.tier}`)
          }

          return {
            userId: user.id,
            email: user.email,
            changed,
            before: beforeStatus,
            after: {
              tier: result.tier,
              status: result.status,
              expiresAt: result.expiresAt
            }
          }

        } catch (error) {
          errorCount++
          console.error(`❌ Error checking subscription for user ${user.id}:`, error)
          return {
            userId: user.id,
            email: user.email,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      })

      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)

      // Small delay between batches to avoid overwhelming Stripe API
      if (i + batchSize < users.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    // Log cron job completion
    const duration = Date.now() - startTime
    const summary = {
      timestamp: new Date().toISOString(),
      usersFound: users.length,
      usersChecked: checkedCount,
      usersUpdated: updatedCount,
      errors: errorCount,
      duration: `${duration}ms`
    }

    console.log(`✅ Subscription maintenance cron completed:`, summary)

    // Store cron job log in database for monitoring
    try {
      await supabaseAdmin
        .from('cron_logs')
        .insert({
          job_type: 'subscription_maintenance',
          status: errorCount === 0 ? 'success' : 'partial_success',
          summary: summary,
          details: results.length <= 50 ? results : results.slice(0, 50), // Limit details size
          created_at: new Date().toISOString()
        })
    } catch (logError) {
      console.warn('Failed to store cron log:', logError)
      // Don't fail the cron job if logging fails
    }

    return NextResponse.json({
      success: true,
      ...summary,
      details: results
    })

  } catch (error) {
    console.error('Subscription maintenance cron failed:', error)
    
    try {
      await supabaseAdmin
        .from('cron_logs')
        .insert({
          job_type: 'subscription_maintenance',
          status: 'failed',
          summary: { error: error instanceof Error ? error.message : 'Unknown error' },
          created_at: new Date().toISOString()
        })
    } catch (logError) {
      console.warn('Failed to store error log:', logError)
    }

    return NextResponse.json(
      { error: 'Subscription maintenance failed' },
      { status: 500 }
    )
  }
}

// Manual trigger endpoint (GET)
export async function GET(request: NextRequest) {
  try {
    // Allow manual triggers in development, require auth in production
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    if (!isDevelopment) {
      const authHeader = request.headers.get('authorization')
      if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: 'Authorization required for manual trigger' },
          { status: 401 }
        )
      }
    }

    console.log('🔧 Manual subscription maintenance trigger')
    
    // Forward to POST handler
    return await POST(request)

  } catch (error) {
    console.error('Manual subscription maintenance trigger failed:', error)
    return NextResponse.json(
      { error: 'Manual trigger failed' },
      { status: 500 }
    )
  }
}
