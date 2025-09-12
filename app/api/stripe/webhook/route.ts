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

export async function POST(request: NextRequest) {
  try {
    // Get the raw body as text for signature verification
    const body = await request.text()
    const headersList = await headers()
    const sig = headersList.get('stripe-signature')

    if (!sig) {
      console.error('No Stripe signature found')
      return NextResponse.json(
        { error: 'No signature found' },
        { status: 400 }
      )
    }

    let event: Stripe.Event;

    if (!endpointSecret) {
      console.warn("⚠️ STRIPE_WEBHOOK_SECRET not set. Skipping signature verification. THIS IS INSECURE.")
      try {
        event = JSON.parse(body) as Stripe.Event;
      } catch (err) {
        return NextResponse.json({ error: 'Failed to parse request body.' }, { status: 400 });
      }
    } else {
      try {
        // Verify the webhook signature
        event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
      } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return NextResponse.json(
          { error: `Webhook signature verification failed: ${err}` },
          { status: 400 }
        );
      }
    }

    console.log('Received Stripe webhook event:', event.type)

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
        break
      
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent)
        break
      
      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent)
        break
      
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break
      
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break
      
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment succeeded:', paymentIntent.id)
  
  try {
    // Update payment status in database
    const { error: paymentError } = await supabaseAdmin
      .from('payments')
      .update({
        status: 'succeeded',
        metadata: {
          ...paymentIntent.metadata,
          stripe_payment_method: paymentIntent.payment_method,
          payment_succeeded_at: new Date().toISOString()
        }
      })
      .eq('stripe_payment_intent_id', paymentIntent.id)

    if (paymentError) {
      console.error('Error updating payment status:', paymentError)
      return
    }

    // Get user_id from payment intent metadata
    const userId = paymentIntent.metadata.user_id
    const subscriptionType = paymentIntent.metadata.subscription_type

    if (userId && subscriptionType) {
      // Update user's subscription in profiles table
      const subscriptionData = getSubscriptionData(subscriptionType)
      
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
          subscription_tier: subscriptionData.tier,
          subscription_status: 'active',
          subscription_plan_type: subscriptionData.planType,
          subscription_started_at: new Date().toISOString(),
          subscription_expires_at: subscriptionData.expiresAt,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (profileError) {
        console.error('Error updating user profile:', profileError)
      } else {
        console.log(`Updated subscription for user ${userId} to ${subscriptionType}`)
      }
    }

  } catch (error) {
    console.error('Error handling payment success:', error)
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment failed:', paymentIntent.id)
  
  try {
    const { error } = await supabaseAdmin
      .from('payments')
      .update({
        status: 'failed',
        metadata: {
          ...paymentIntent.metadata,
          failure_reason: paymentIntent.last_payment_error?.message || 'Unknown error',
          payment_failed_at: new Date().toISOString()
        }
      })
      .eq('stripe_payment_intent_id', paymentIntent.id)

    if (error) {
      console.error('Error updating failed payment status:', error)
    }
  } catch (error) {
    console.error('Error handling payment failure:', error)
  }
}

async function handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment canceled:', paymentIntent.id)
  
  try {
    const { error } = await supabaseAdmin
      .from('payments')
      .update({
        status: 'canceled',
        metadata: {
          ...paymentIntent.metadata,
          payment_canceled_at: new Date().toISOString()
        }
      })
      .eq('stripe_payment_intent_id', paymentIntent.id)

    if (error) {
      console.error('Error updating canceled payment status:', error)
    }
  } catch (error) {
    console.error('Error handling payment cancellation:', error)
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('Subscription created:', subscription.id)
  
  try {
    const userId = subscription.metadata.user_id
    
    if (userId) {
      // Get subscription plan details from metadata or price ID
      const subscriptionObj = subscription as unknown as Stripe.Subscription & { current_period_end: number }
      const subscriptionType = subscriptionObj.metadata.subscription_type
      const currentPeriodEnd = subscriptionObj.current_period_end
      const interval = subscriptionObj.items.data[0]?.price?.recurring?.interval || 'month'
      const tier = subscriptionType?.startsWith('elite') ? 'elite' : 'pro'

      const { error } = await supabaseAdmin
        .from('profiles')
        .update({
          subscription_tier: tier,
          subscription_status: 'active',
          subscription_plan_type: interval,
          subscription_started_at: new Date().toISOString(),
          subscription_expires_at: new Date(currentPeriodEnd * 1000).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) {
        console.error('Error updating profile on subscription creation:', error)
      } else {
        console.log(`Subscription created for user ${userId}: ${subscriptionType}`)
      }
    }
  } catch (error) {
    console.error('Error handling subscription creation:', error)
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Subscription updated:', subscription.id)
  
  try {
    const userId = subscription.metadata.user_id
    
    if (userId) {
      let updateData: any = {
        subscription_status: subscription.status,
        updated_at: new Date().toISOString()
      }

      // If subscription is canceled or past_due, handle accordingly
      if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
        updateData.subscription_tier = 'free'
        updateData.subscription_expires_at = new Date().toISOString()
      } else if (subscription.status === 'active' || subscription.status === 'trialing') {
        // Renew/extend subscription from Stripe period
        const subscriptionObj = subscription as unknown as Stripe.Subscription & { current_period_end: number }
        const subscriptionType = subscriptionObj.metadata.subscription_type
        const currentPeriodEnd = subscriptionObj.current_period_end
        const interval = subscriptionObj.items.data[0]?.price?.recurring?.interval || 'month'
        updateData.subscription_tier = subscriptionType?.startsWith('elite') ? 'elite' : 'pro'
        updateData.subscription_plan_type = interval
        updateData.subscription_expires_at = new Date(currentPeriodEnd * 1000).toISOString()
      }

      const { error } = await supabaseAdmin
        .from('profiles')
        .update(updateData)
        .eq('id', userId)

      if (error) {
        console.error('Error updating profile on subscription update:', error)
      } else {
        console.log(`Subscription updated for user ${userId}: ${subscription.status}`)
      }
    }
  } catch (error) {
    console.error('Error handling subscription update:', error)
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Subscription deleted:', subscription.id)
  
  try {
    const userId = subscription.metadata.user_id
    
    if (userId) {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({
          subscription_tier: 'free',
          subscription_status: 'canceled',
          subscription_expires_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) {
        console.error('Error updating profile on subscription deletion:', error)
      } else {
        console.log(`Subscription canceled for user ${userId}`)
      }
    }
  } catch (error) {
    console.error('Error handling subscription deletion:', error)
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Invoice payment succeeded:', invoice.id)
  
  try {
    // Cast invoice to access subscription property
    const invoiceWithSub = invoice as any
    const subscriptionId = invoiceWithSub.subscription
    
    if (subscriptionId) {
      // Get subscription details to renew user access
      const subscriptionResp = await stripe.subscriptions.retrieve(subscriptionId)
      const subscription = subscriptionResp as unknown as Stripe.Subscription & { current_period_end: number }
      const userId = subscription.metadata.user_id
      
      if (userId) {
        const subscriptionType = subscription.metadata.subscription_type
        const currentPeriodEnd = subscription.current_period_end
        const interval = subscription.items.data[0]?.price?.recurring?.interval || 'month'
        const { error } = await supabaseAdmin
          .from('profiles')
          .update({
            subscription_tier: subscriptionType?.startsWith('elite') ? 'elite' : 'pro',
            subscription_status: 'active',
            subscription_plan_type: interval,
            subscription_expires_at: new Date(currentPeriodEnd * 1000).toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)

        if (error) {
          console.error('Error renewing subscription on invoice payment:', error)
        } else {
          console.log(`Subscription renewed for user ${userId}`)
        }
      }
    }
  } catch (error) {
    console.error('Error handling invoice payment success:', error)
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Invoice payment failed:', invoice.id)
  
  try {
    // Cast invoice to access subscription property
    const invoiceWithSub = invoice as any
    const subscriptionId = invoiceWithSub.subscription
    
    if (subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      const userId = subscription.metadata.user_id
      
      if (userId) {
        // Mark subscription as past_due, but don't immediately downgrade
        // Let the subscription status update handle the downgrade
        const { error } = await supabaseAdmin
          .from('profiles')
          .update({
            subscription_status: 'past_due',
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)

        if (error) {
          console.error('Error updating profile on invoice payment failure:', error)
        } else {
          console.log(`Marked subscription as past_due for user ${userId}`)
        }
      }
    }
  } catch (error) {
    console.error('Error handling invoice payment failure:', error)
  }
}

function getSubscriptionData(subscriptionType: string) {
  const now = new Date()
  let expiresAt: Date
  let tier: string
  let planType: string

  switch (subscriptionType) {
    // Pro Plans
    case 'pro_daypass':
      tier = 'pro'
      planType = 'day'
      expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24 hours
      break
    case 'pro_weekly':
      tier = 'pro'
      planType = 'week'
      expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days
      break
    case 'pro_monthly':
      tier = 'pro'
      planType = 'month'
      expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days
      break
    case 'pro_yearly':
      tier = 'pro'
      planType = 'year'
      expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000) // 365 days
      break
    case 'pro_lifetime':
      tier = 'pro'
      planType = 'one_time'
      expiresAt = new Date(now.getTime() + 100 * 365 * 24 * 60 * 60 * 1000) // 100 years (lifetime)
      break
    
    // Elite Plans
    case 'elite_weekly':
      tier = 'elite'
      planType = 'week'
      expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days
      break
    case 'elite_monthly':
      tier = 'elite'
      planType = 'month'
      expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days
      break
    case 'elite_yearly':
      tier = 'elite'
      planType = 'year'
      expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000) // 365 days
      break
    
    default:
      tier = 'free'
      planType = 'month'
      expiresAt = now
  }

  return {
    tier,
    planType,
    expiresAt: expiresAt.toISOString()
  }
}
