import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// Map Stripe Price IDs to our internal subscription types
// These env vars come from the Next.js environment and should be set in .env/.env.local
function resolveSubscriptionType(priceId: string): string | null {
  const map: Record<string, string> = {
    [(process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_DAYPASS || '')]: 'pro_daypass',
    [(process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_WEEKLY || '')]: 'pro_weekly',
    [(process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY || '')]: 'pro_monthly',
    [(process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY || '')]: 'pro_yearly',
    [(process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_LIFETIME || '')]: 'pro_lifetime',
    [(process.env.NEXT_PUBLIC_STRIPE_PRICE_ELITE_WEEKLY || '')]: 'elite_weekly',
    [(process.env.NEXT_PUBLIC_STRIPE_PRICE_ELITE_MONTHLY || '')]: 'elite_monthly',
    [(process.env.NEXT_PUBLIC_STRIPE_PRICE_ELITE_YEARLY || '')]: 'elite_yearly',
  }
  return map[priceId] || null
}

export async function POST(req: NextRequest) {
  try {
    const { priceId, userId, successUrl, cancelUrl } = await req.json()

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Determine plan type from price and whether it's one-time vs recurring
    const subscriptionType = resolveSubscriptionType(priceId)
    const isOneTimeProduct = subscriptionType === 'pro_lifetime' || subscriptionType === 'pro_daypass'
    
    // Build params conditionally to avoid passing payment_intent_data in subscription mode
    const baseParams: any = {
      mode: isOneTimeProduct ? 'payment' : 'subscription',
      payment_method_types: ['card', 'cashapp', 'us_bank_account', 'link'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      client_reference_id: userId,
      metadata: {
        userId,
        productType: isOneTimeProduct ? 'one_time' : 'subscription',
        subscription_type: subscriptionType || 'unknown',
        price_id: priceId,
      },
      customer_email: undefined, // You can add user email here if available
      allow_promotion_codes: true,
      // Note: automatic_payment_methods removed due to API version compatibility
      // payment_method_types already specifies the methods we want to support
    }

    if (isOneTimeProduct) {
      baseParams.payment_intent_data = {
        metadata: {
          user_id: userId,
          subscription_type: subscriptionType || 'unknown',
          price_id: priceId,
        },
      }
    } else {
      baseParams.subscription_data = {
        metadata: {
          user_id: userId,
          subscription_type: subscriptionType || 'unknown',
          price_id: priceId,
        },
      }
    }

    const session = await stripe.checkout.sessions.create(baseParams)

    return NextResponse.json({ sessionId: session.id })
  } catch (error: any) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}