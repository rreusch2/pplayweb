import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break
        
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription)
        break
        
      case 'customer.subscription.deleted':
        await handleSubscriptionCancelled(event.data.object as Stripe.Subscription)
        break
        
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break
        
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break
        
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id
  const subscriptionTier = session.metadata?.subscription_tier
  const subscriptionType = session.metadata?.subscription_type
  
  if (!userId || subscriptionType !== 'api') return

  // Update user's API subscription status
  const limits = {
    free: 1000,
    startup: 25000,
    enterprise: 100000
  }

  await supabase
    .from('users')
    .update({
      api_subscription_tier: subscriptionTier,
      api_subscription_id: session.subscription,
      api_monthly_limit: limits[subscriptionTier as keyof typeof limits] || 1000,
      api_current_usage: 0 // Reset usage on new subscription
    })
    .eq('id', userId)

  console.log(`API subscription activated for user ${userId}: ${subscriptionTier}`)
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id
  const subscriptionTier = subscription.metadata?.subscription_tier
  const subscriptionType = subscription.metadata?.subscription_type
  
  if (!userId || subscriptionType !== 'api') return

  const limits = {
    free: 1000,
    startup: 25000,
    enterprise: 100000
  }

  const isActive = subscription.status === 'active'
  const finalTier = isActive ? subscriptionTier : 'free'

  await supabase
    .from('users')
    .update({
      api_subscription_tier: finalTier,
      api_subscription_id: isActive ? subscription.id : null,
      api_monthly_limit: limits[finalTier as keyof typeof limits] || 1000
    })
    .eq('id', userId)

  console.log(`API subscription updated for user ${userId}: ${finalTier} (${subscription.status})`)
}

async function handleSubscriptionCancelled(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id
  const subscriptionType = subscription.metadata?.subscription_type
  
  if (!userId || subscriptionType !== 'api') return

  // Downgrade to free tier
  await supabase
    .from('users')
    .update({
      api_subscription_tier: 'free',
      api_subscription_id: null,
      api_monthly_limit: 1000
    })
    .eq('id', userId)

  console.log(`API subscription cancelled for user ${userId}`)
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string
  if (!subscriptionId) return

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const userId = subscription.metadata?.user_id
  const subscriptionType = subscription.metadata?.subscription_type
  
  if (!userId || subscriptionType !== 'api') return

  // Reset monthly usage on successful payment (new billing cycle)
  await supabase
    .from('users')
    .update({
      api_current_usage: 0
    })
    .eq('id', userId)

  // Reset API key usage counters
  await supabase
    .from('api_keys')
    .update({
      current_month_usage: 0
    })
    .eq('user_id', userId)

  console.log(`API usage reset for user ${userId} - new billing cycle`)
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string
  if (!subscriptionId) return

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const userId = subscription.metadata?.user_id
  const subscriptionType = subscription.metadata?.subscription_type
  
  if (!userId || subscriptionType !== 'api') return

  // Optional: Send notification email or temporarily suspend API access
  // For now, just log the failed payment
  console.log(`API subscription payment failed for user ${userId}`)
}
