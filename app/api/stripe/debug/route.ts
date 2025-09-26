import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const email = searchParams.get('email')

    if (!userId && !email) {
      return NextResponse.json(
        { error: 'userId or email parameter required' },
        { status: 400 }
      )
    }

    const debugInfo: any = {
      timestamp: new Date().toISOString(),
      environment: {
        hasStripeSecretKey: !!process.env.STRIPE_SECRET_KEY,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET
      }
    }

    // Get user from Supabase
    let userProfile = null
    if (userId) {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error) {
        debugInfo.supabaseError = error
      } else {
        userProfile = data
      }
    } else if (email) {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single()
      
      if (error) {
        debugInfo.supabaseError = error
      } else {
        userProfile = data
      }
    }

    debugInfo.userProfile = userProfile ? {
      id: userProfile.id,
      email: userProfile.email,
      subscription_tier: userProfile.subscription_tier,
      subscription_status: userProfile.subscription_status,
      subscription_plan_type: userProfile.subscription_plan_type,
      subscription_expires_at: userProfile.subscription_expires_at,
      subscription_started_at: userProfile.subscription_started_at,
      subscription_source: userProfile.subscription_source,
      created_at: userProfile.created_at,
      updated_at: userProfile.updated_at
    } : null

    // Check Stripe if we have email
    const searchEmail = userProfile?.email || email
    if (searchEmail) {
      try {
        const customers = await stripe.customers.list({
          email: searchEmail,
          limit: 5
        })

        debugInfo.stripeCustomers = customers.data.map(customer => ({
          id: customer.id,
          email: customer.email,
          created: customer.created,
          metadata: customer.metadata
        }))

        if (customers.data.length > 0) {
          const customerId = customers.data[0].id

          // Get subscriptions
          const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            limit: 10
          })

          debugInfo.stripeSubscriptions = subscriptions.data.map(sub => ({
            id: sub.id,
            status: sub.status,
            current_period_start: sub.current_period_start,
            current_period_end: sub.current_period_end,
            created: sub.created,
            metadata: sub.metadata,
            items: sub.items.data.map(item => ({
              price_id: item.price.id,
              product_id: item.price.product,
              interval: item.price.recurring?.interval,
              amount: item.price.unit_amount
            }))
          }))

          // Get recent payments
          const paymentIntents = await stripe.paymentIntents.list({
            customer: customerId,
            limit: 5
          })

          debugInfo.recentPayments = paymentIntents.data.map(pi => ({
            id: pi.id,
            status: pi.status,
            amount: pi.amount,
            currency: pi.currency,
            created: pi.created,
            metadata: pi.metadata
          }))
        }

      } catch (stripeError) {
        debugInfo.stripeError = stripeError.message
      }
    }

    return NextResponse.json(debugInfo, { status: 200 })

  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json(
      { error: 'Debug endpoint failed', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, userId, email } = body

    if (!action) {
      return NextResponse.json(
        { error: 'action parameter required' },
        { status: 400 }
      )
    }

    let result: any = { action, timestamp: new Date().toISOString() }

    switch (action) {
      case 'check_subscription':
        if (!userId) {
          return NextResponse.json(
            { error: 'userId required for check_subscription' },
            { status: 400 }
          )
        }

        const { SubscriptionChecker } = await import('../../../lib/subscriptionChecker')
        const status = await SubscriptionChecker.checkUserSubscriptionStatus(userId)
        result.subscriptionStatus = status
        break

      case 'fix_inconsistencies':
        const { SubscriptionChecker: Checker } = await import('../../../lib/subscriptionChecker')
        const fixResult = await Checker.fixSubscriptionInconsistencies()
        result.fixResult = fixResult
        break

      case 'test_webhook_signature':
        const testPayload = JSON.stringify({
          type: 'test_event',
          data: { test: true }
        })
        
        try {
          const sig = stripe.webhooks.generateTestHeaderString({
            payload: testPayload,
            secret: process.env.STRIPE_WEBHOOK_SECRET!
          })
          
          result.webhookTest = {
            hasSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
            testSignature: sig,
            testPayload
          }
        } catch (webhookError) {
          result.webhookError = webhookError.message
        }
        break

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }

    return NextResponse.json(result, { status: 200 })

  } catch (error) {
    console.error('Debug POST error:', error)
    return NextResponse.json(
      { error: 'Debug action failed', details: error.message },
      { status: 500 }
    )
  }
}
