import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

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

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

// Enhanced logging function
function logWebhook(level: 'info' | 'warn' | 'error', message: string, data?: any) {
  const timestamp = new Date().toISOString()
  const prefix = `[${timestamp}] [STRIPE-WEBHOOK] [${level.toUpperCase()}]`
  
  if (data) {
    console.log(prefix, message, JSON.stringify(data, null, 2))
  } else {
    console.log(prefix, message)
  }
}

// Enhanced subscription data calculation
function calculateSubscriptionData(subscriptionType: string, subscription?: Stripe.Subscription) {
  const now = new Date()
  let expiresAt: Date
  let tier: string
  let planType: string

  // If we have a Stripe subscription object, use its period end
  if (subscription && subscription.current_period_end) {
    expiresAt = new Date(subscription.current_period_end * 1000)
  } else {
    // Fallback to manual calculation
    switch (subscriptionType) {
      case 'pro_daypass':
        expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24 hours
        break
      case 'pro_weekly':
      case 'elite_weekly':
        expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days
        break
      case 'pro_monthly':
      case 'elite_monthly':
        expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days
        break
      case 'pro_yearly':
      case 'elite_yearly':
        expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000) // 365 days
        break
      case 'pro_lifetime':
        expiresAt = new Date(now.getTime() + 100 * 365 * 24 * 60 * 60 * 1000) // 100 years
        break
      default:
        expiresAt = now
    }
  }

  // Determine tier and plan type
  if (subscriptionType.startsWith('elite_')) {
    tier = 'elite'
    planType = subscriptionType.replace('elite_', '')
  } else if (subscriptionType.startsWith('pro_')) {
    tier = 'pro'
    planType = subscriptionType.replace('pro_', '')
  } else {
    // Legacy mapping
    tier = 'pro'
    planType = subscriptionType
  }

  return {
    tier,
    planType,
    expiresAt: expiresAt.toISOString()
  }
}

// Enhanced user profile update function
async function updateUserProfile(userId: string, updateData: any, context: string) {
  try {
    logWebhook('info', `Updating user profile for ${context}`, { userId, updateData })

    // First, get current user data to avoid overwriting important fields
    const { data: currentProfile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (fetchError) {
      logWebhook('error', 'Failed to fetch current user profile', fetchError)
      throw fetchError
    }

    if (!currentProfile) {
      logWebhook('error', 'User profile not found', { userId })
      throw new Error(`User profile not found for ID: ${userId}`)
    }

    // Merge update data with current profile
    const finalUpdateData = {
      ...updateData,
      updated_at: new Date().toISOString()
    }

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update(finalUpdateData)
      .eq('id', userId)

    if (updateError) {
      logWebhook('error', 'Failed to update user profile', updateError)
      throw updateError
    }

    logWebhook('info', `Successfully updated user profile for ${context}`, { userId, finalUpdateData })
    return true

  } catch (error) {
    logWebhook('error', `Error updating user profile for ${context}`, error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Get the raw body as text for signature verification
    const body = await request.text()
    const headersList = await headers()
    const sig = headersList.get('stripe-signature')

    logWebhook('info', 'Received webhook request', { 
      hasSignature: !!sig,
      bodyLength: body.length,
      hasSecret: !!endpointSecret
    })

    if (!sig) {
      logWebhook('error', 'No Stripe signature found in headers')
      return NextResponse.json(
        { error: 'No signature found' },
        { status: 400 }
      )
    }

    let event: Stripe.Event;

    if (!endpointSecret) {
      logWebhook('warn', "⚠️ STRIPE_WEBHOOK_SECRET not set. Skipping signature verification. THIS IS INSECURE.")
      try {
        event = JSON.parse(body) as Stripe.Event;
      } catch (err) {
        logWebhook('error', 'Failed to parse request body', err)
        return NextResponse.json({ error: 'Failed to parse request body.' }, { status: 400 });
      }
    } else {
      try {
        // Verify the webhook signature
        event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
        logWebhook('info', 'Webhook signature verified successfully')
      } catch (err) {
        logWebhook('error', 'Webhook signature verification failed', err)
        return NextResponse.json(
          { error: `Webhook signature verification failed: ${err}` },
          { status: 400 }
        );
      }
    }

    logWebhook('info', `Processing webhook event: ${event.type}`, { 
      eventId: event.id,
      created: event.created 
    })

    // Handle the event with enhanced error handling
    let result = { processed: false, error: null }

    switch (event.type) {
      case 'checkout.session.completed':
        result = await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break
      case 'payment_intent.succeeded':
        result = await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
        break
      case 'payment_intent.payment_failed':
        result = await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent)
        break
      case 'payment_intent.canceled':
        result = await handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent)
        break
      case 'customer.subscription.created':
        result = await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break
      case 'customer.subscription.updated':
        result = await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
      case 'customer.subscription.deleted':
        result = await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      case 'invoice.payment_succeeded':
        result = await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break
      case 'invoice.payment_failed':
        result = await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break
      default:
        logWebhook('info', `Unhandled event type: ${event.type}`)
        result = { processed: false, error: `Unhandled event type: ${event.type}` }
    }

    const processingTime = Date.now() - startTime
    logWebhook('info', `Webhook processing completed`, { 
      eventType: event.type,
      eventId: event.id,
      processed: result.processed,
      processingTimeMs: processingTime,
      error: result.error
    })

    return NextResponse.json({ 
      received: true, 
      processed: result.processed,
      processingTimeMs: processingTime
    })

  } catch (error) {
    const processingTime = Date.now() - startTime
    logWebhook('error', 'Webhook handler failed', { error, processingTimeMs: processingTime })
    
    return NextResponse.json(
      { error: 'Webhook handler failed', processingTimeMs: processingTime },
      { status: 500 }
    )
  }
}

// Enhanced checkout session handler
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  try {
    logWebhook('info', 'Processing checkout session completed', { 
      sessionId: session.id,
      mode: session.mode,
      paymentStatus: session.payment_status
    })

    const userId = (session.client_reference_id as string) || (session.metadata?.userId as string) || ''

    if (!userId) {
      logWebhook('error', 'No user ID found in checkout session', { 
        sessionId: session.id,
        clientReferenceId: session.client_reference_id,
        metadata: session.metadata
      })
      return { processed: false, error: 'No user ID found' }
    }

    // One-time payment flow (daypass/lifetime)
    if (session.mode === 'payment') {
      const piId = session.payment_intent as string | null
      if (!piId) {
        logWebhook('error', 'No payment intent found in one-time payment session', { sessionId: session.id })
        return { processed: false, error: 'No payment intent found' }
      }

      const paymentIntent = await stripe.paymentIntents.retrieve(piId)
      const subscriptionType = (paymentIntent.metadata?.subscription_type as string) || ''
      
      if (!subscriptionType) {
        logWebhook('error', 'No subscription type found in payment intent metadata', { 
          paymentIntentId: piId,
          metadata: paymentIntent.metadata
        })
        return { processed: false, error: 'No subscription type found' }
      }

      const subData = calculateSubscriptionData(subscriptionType)
      
      await updateUserProfile(userId, {
        subscription_tier: subData.tier,
        subscription_status: 'active',
        subscription_plan_type: subData.planType,
        subscription_started_at: new Date().toISOString(),
        subscription_expires_at: subData.expiresAt,
        subscription_source: 'stripe_web'
      }, 'checkout session completed (one-time)')

      return { processed: true, error: null }
    }

    // Subscription flow
    if (session.mode === 'subscription' && session.subscription) {
      const subId = session.subscription as string
      const subscription = await stripe.subscriptions.retrieve(subId)
      const subscriptionType = (subscription.metadata?.subscription_type as string) || ''
      const currentPeriodEnd = subscription.current_period_end
      const interval = subscription.items.data[0]?.price?.recurring?.interval || 'month'
      
      const tier = subscriptionType.startsWith('elite') ? 'elite' : 'pro'

      await updateUserProfile(userId, {
        subscription_tier: tier,
        subscription_status: subscription.status,
        subscription_plan_type: interval,
        subscription_started_at: new Date().toISOString(),
        subscription_expires_at: new Date(currentPeriodEnd * 1000).toISOString(),
        subscription_source: 'stripe_web'
      }, 'checkout session completed (subscription)')

      return { processed: true, error: null }
    }

    logWebhook('warn', 'Unknown checkout session mode', { mode: session.mode })
    return { processed: false, error: `Unknown session mode: ${session.mode}` }

  } catch (error) {
    logWebhook('error', 'Error in handleCheckoutSessionCompleted', error)
    return { processed: false, error: error.message }
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    logWebhook('info', 'Processing payment intent succeeded', { 
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency
    })

    const userId = paymentIntent.metadata.user_id
    const subscriptionType = paymentIntent.metadata.subscription_type

    if (!userId || !subscriptionType) {
      logWebhook('error', 'Missing required metadata in payment intent', {
        paymentIntentId: paymentIntent.id,
        userId,
        subscriptionType,
        metadata: paymentIntent.metadata
      })
      return { processed: false, error: 'Missing required metadata' }
    }

    const subscriptionData = calculateSubscriptionData(subscriptionType)
    
    await updateUserProfile(userId, {
      subscription_tier: subscriptionData.tier,
      subscription_status: 'active',
      subscription_plan_type: subscriptionData.planType,
      subscription_started_at: new Date().toISOString(),
      subscription_expires_at: subscriptionData.expiresAt,
      subscription_source: 'stripe_web'
    }, 'payment intent succeeded')

    return { processed: true, error: null }

  } catch (error) {
    logWebhook('error', 'Error in handlePaymentIntentSucceeded', error)
    return { processed: false, error: error.message }
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    logWebhook('info', 'Processing payment intent failed', { 
      paymentIntentId: paymentIntent.id,
      lastPaymentError: paymentIntent.last_payment_error
    })

    // Just log the failure, don't change user subscription status
    return { processed: true, error: null }

  } catch (error) {
    logWebhook('error', 'Error in handlePaymentIntentFailed', error)
    return { processed: false, error: error.message }
  }
}

async function handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent) {
  try {
    logWebhook('info', 'Processing payment intent canceled', { 
      paymentIntentId: paymentIntent.id
    })

    // Just log the cancellation, don't change user subscription status
    return { processed: true, error: null }

  } catch (error) {
    logWebhook('error', 'Error in handlePaymentIntentCanceled', error)
    return { processed: false, error: error.message }
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  try {
    logWebhook('info', 'Processing subscription created', { 
      subscriptionId: subscription.id,
      status: subscription.status,
      currentPeriodEnd: subscription.current_period_end
    })

    const userId = subscription.metadata.user_id
    
    if (!userId) {
      logWebhook('error', 'No user ID found in subscription metadata', {
        subscriptionId: subscription.id,
        metadata: subscription.metadata
      })
      return { processed: false, error: 'No user ID found' }
    }

    const subscriptionType = subscription.metadata.subscription_type
    const currentPeriodEnd = subscription.current_period_end
    const interval = subscription.items.data[0]?.price?.recurring?.interval || 'month'
    const tier = subscriptionType?.startsWith('elite') ? 'elite' : 'pro'

    await updateUserProfile(userId, {
      subscription_tier: tier,
      subscription_status: 'active',
      subscription_plan_type: interval,
      subscription_started_at: new Date().toISOString(),
      subscription_expires_at: new Date(currentPeriodEnd * 1000).toISOString(),
      subscription_source: 'stripe_web'
    }, 'subscription created')

    return { processed: true, error: null }

  } catch (error) {
    logWebhook('error', 'Error in handleSubscriptionCreated', error)
    return { processed: false, error: error.message }
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    logWebhook('info', 'Processing subscription updated', { 
      subscriptionId: subscription.id,
      status: subscription.status,
      currentPeriodEnd: subscription.current_period_end
    })

    const userId = subscription.metadata.user_id
    
    if (!userId) {
      logWebhook('error', 'No user ID found in subscription metadata', {
        subscriptionId: subscription.id,
        metadata: subscription.metadata
      })
      return { processed: false, error: 'No user ID found' }
    }

    let updateData: any = {
      subscription_status: subscription.status,
      subscription_source: 'stripe_web'
    }

    // If subscription is canceled or past_due, downgrade to free
    if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
      updateData.subscription_tier = 'free'
      updateData.subscription_expires_at = new Date().toISOString()
    } else if (subscription.status === 'active' || subscription.status === 'trialing') {
      // Renew/extend subscription
      const subscriptionType = subscription.metadata.subscription_type
      const currentPeriodEnd = subscription.current_period_end
      const interval = subscription.items.data[0]?.price?.recurring?.interval || 'month'
      
      updateData.subscription_tier = subscriptionType?.startsWith('elite') ? 'elite' : 'pro'
      updateData.subscription_plan_type = interval
      updateData.subscription_expires_at = new Date(currentPeriodEnd * 1000).toISOString()
    }

    await updateUserProfile(userId, updateData, 'subscription updated')

    return { processed: true, error: null }

  } catch (error) {
    logWebhook('error', 'Error in handleSubscriptionUpdated', error)
    return { processed: false, error: error.message }
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    logWebhook('info', 'Processing subscription deleted', { 
      subscriptionId: subscription.id
    })

    const userId = subscription.metadata.user_id
    
    if (!userId) {
      logWebhook('error', 'No user ID found in subscription metadata', {
        subscriptionId: subscription.id,
        metadata: subscription.metadata
      })
      return { processed: false, error: 'No user ID found' }
    }

    await updateUserProfile(userId, {
      subscription_tier: 'free',
      subscription_status: 'canceled',
      subscription_expires_at: new Date().toISOString(),
      subscription_source: 'stripe_web'
    }, 'subscription deleted')

    return { processed: true, error: null }

  } catch (error) {
    logWebhook('error', 'Error in handleSubscriptionDeleted', error)
    return { processed: false, error: error.message }
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    logWebhook('info', 'Processing invoice payment succeeded', { 
      invoiceId: invoice.id,
      subscriptionId: invoice.subscription
    })

    const subscriptionId = invoice.subscription as string
    
    if (subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      const userId = subscription.metadata.user_id
      
      if (userId) {
        const subscriptionType = subscription.metadata.subscription_type
        const currentPeriodEnd = subscription.current_period_end
        const interval = subscription.items.data[0]?.price?.recurring?.interval || 'month'
        
        await updateUserProfile(userId, {
          subscription_tier: subscriptionType?.startsWith('elite') ? 'elite' : 'pro',
          subscription_status: 'active',
          subscription_plan_type: interval,
          subscription_expires_at: new Date(currentPeriodEnd * 1000).toISOString(),
          subscription_source: 'stripe_web'
        }, 'invoice payment succeeded')
      }
    }

    return { processed: true, error: null }

  } catch (error) {
    logWebhook('error', 'Error in handleInvoicePaymentSucceeded', error)
    return { processed: false, error: error.message }
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  try {
    logWebhook('info', 'Processing invoice payment failed', { 
      invoiceId: invoice.id,
      subscriptionId: invoice.subscription
    })

    const subscriptionId = invoice.subscription as string
    
    if (subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      const userId = subscription.metadata.user_id
      
      if (userId) {
        await updateUserProfile(userId, {
          subscription_status: 'past_due',
          subscription_source: 'stripe_web'
        }, 'invoice payment failed')
      }
    }

    return { processed: true, error: null }

  } catch (error) {
    logWebhook('error', 'Error in handleInvoicePaymentFailed', error)
    return { processed: false, error: error.message }
  }
}
