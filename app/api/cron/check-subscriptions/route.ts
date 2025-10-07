import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create Supabase client with service role key for admin operations
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
    // Verify this is coming from a cron job or authorized source
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔍 Checking for expired subscriptions...')
    
    const now = new Date().toISOString()
    
    // Find users with expired subscriptions that are still marked as active
    const { data: expiredUsers, error } = await supabaseAdmin
      .from('profiles')
      .select('id, email, subscription_tier, subscription_plan_type, subscription_expires_at')
      .not('subscription_tier', 'eq', 'free')
      .lt('subscription_expires_at', now)
      .eq('subscription_status', 'active')

    if (error) {
      console.error('Error fetching expired subscriptions:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!expiredUsers || expiredUsers.length === 0) {
      console.log('✅ No expired subscriptions found')
      return NextResponse.json({ 
        message: 'No expired subscriptions found',
        processed: 0 
      })
    }

    console.log(`⏰ Found ${expiredUsers.length} expired subscriptions`)

    // Downgrade expired users to free tier
    const downgradedUsers = []
    
    for (const user of expiredUsers) {
      try {
        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({
            subscription_tier: 'free',
            subscription_status: 'expired',
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)

        if (updateError) {
          console.error(`❌ Failed to downgrade user ${user.id}:`, updateError)
        } else {
          console.log(`⬇️ Downgraded user ${user.id} from ${user.subscription_tier} to free`)
          downgradedUsers.push({
            id: user.id,
            email: user.email,
            previousTier: user.subscription_tier,
            planType: user.subscription_plan_type,
            expiredAt: user.subscription_expires_at
          })
        }
      } catch (err) {
        console.error(`❌ Error processing user ${user.id}:`, err)
      }
    }

    console.log(`✅ Successfully processed ${downgradedUsers.length} expired subscriptions`)

    return NextResponse.json({
      message: `Processed ${downgradedUsers.length} expired subscriptions`,
      processed: downgradedUsers.length,
      downgradedUsers: downgradedUsers
    })

  } catch (error) {
    console.error('❌ Subscription check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Also handle POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request)
}
