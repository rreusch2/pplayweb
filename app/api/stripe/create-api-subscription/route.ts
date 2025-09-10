import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

export async function POST(request: Request) {
  try {
    const { tier } = await request.json()
    
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (userError) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // API subscription pricing
    const pricingConfig = {
      startup: {
        priceId: process.env.STRIPE_STARTUP_API_PRICE_ID!,
        price: 2900, // $29.00
        name: 'Startup API Plan',
        monthlyLimit: 25000
      },
      enterprise: {
        priceId: process.env.STRIPE_ENTERPRISE_API_PRICE_ID!,
        price: 9900, // $99.00
        name: 'Enterprise API Plan', 
        monthlyLimit: 100000
      }
    }

    const config = pricingConfig[tier as keyof typeof pricingConfig]
    if (!config) {
      return NextResponse.json({ error: 'Invalid subscription tier' }, { status: 400 })
    }

    // Create or get Stripe customer
    let customerId = userData.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: {
          supabase_user_id: user.id,
          subscription_type: 'api'
        }
      })
      customerId = customer.id
      
      // Update user with Stripe customer ID
      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: config.priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/developers/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/developers/dashboard`,
      metadata: {
        user_id: user.id,
        subscription_tier: tier,
        subscription_type: 'api'
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          subscription_tier: tier,
          subscription_type: 'api'
        }
      }
    })

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    })
    
  } catch (error) {
    console.error('Error creating API subscription:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
