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

// ⚠️  IMPORTANT: This webhook now only handles financial logging
// 🎯 RevenueCat webhooks handle ALL subscription tier changes
// This prevents duplicate/conflicting subscription updates

// 🚫 REMOVED: mapIntervalToPlanType and isElitePriceId
// 🎯 RevenueCat product mapping handles tier determination

// Safe insert of webhook event for audit trail; ignore if table missing
async function logWebhookEvent(event: Stripe.Event) {
  try {
    const { error } = await supabaseAdmin
      .from('stripe_webhook_events')
      .insert({ id: event.id, type: event.type, payload: event as any })
    if (error) {
      // If table doesn't exist or permission issues, just warn and continue
      console.warn('stripe_webhook_events insert skipped:', error.message)
    }
  } catch (e: any) {
    console.warn('stripe_webhook_events insert error (ignored):', e?.message || e)
  }
}

async function markWebhookProcessed(id: string, errorMsg?: string) {
  try {
    const { error } = await supabaseAdmin
      .from('stripe_webhook_events')
      .update({ processed: true, processed_at: new Date().toISOString(), error: errorMsg || null })
      .eq('id', id)
    if (error) {
      console.warn('stripe_webhook_events mark processed warn:', error.message)
    }
  } catch (e: any) {
    console.warn('stripe_webhook_events mark processed error (ignored):', e?.message || e)
  }
}

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
      console.error('STRIPE_WEBHOOK_SECRET is not set. Refusing to process webhook in production.')
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
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

    // Audit log (best-effort)
    await logWebhookEvent(event)

    // ⚠️  SUBSCRIPTION MANAGEMENT REMOVED - RevenueCat handles all tier changes
    // This webhook now only logs financial events for audit purposes
    
    let handlerError: string | undefined
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent).catch(e => { handlerError = String(e) })
        break
      
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent)
        break
      
      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent)
        break
      
      // 🚫 REMOVED: All subscription events (checkout, subscription_created/updated/deleted, invoice events)
      // 🎯 RevenueCat handles these via its own webhooks to avoid conflicts
      
      default:
        console.log(`📊 Stripe event logged: ${event.type} (subscription changes handled by RevenueCat)`)
    }

    // Mark processed (best-effort)
    await markWebhookProcessed(event.id, handlerError)

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
  console.log('💳 Payment succeeded (financial logging only):', paymentIntent.id)
  
  try {
    // ✅ ONLY update financial records - RevenueCat handles subscription tier changes
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
    } else {
      console.log('✅ Payment financial record updated. RevenueCat will handle subscription tier changes.')
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

// 🚫 REMOVED: handleCheckoutSessionCompleted
// 🎯 RevenueCat handles all subscription activations via its webhooks

// 🚫 REMOVED: handleSubscriptionCreated
// 🎯 RevenueCat INITIAL_PURCHASE event handles subscription creation

// 🚫 REMOVED: handleSubscriptionUpdated
// 🎯 RevenueCat RENEWAL/CANCELLATION events handle subscription changes

// 🚫 REMOVED: handleSubscriptionDeleted
// 🎯 RevenueCat EXPIRATION event handles subscription cancellations

// 🚫 REMOVED: handleInvoicePaymentSucceeded
// 🎯 RevenueCat RENEWAL event handles successful recurring payments

// 🚫 REMOVED: handleInvoicePaymentFailed
// 🎯 RevenueCat BILLING_ISSUE event handles failed payments

// 🚫 REMOVED: getSubscriptionData
// 🎯 RevenueCat provides subscription tier mapping in webhook events
