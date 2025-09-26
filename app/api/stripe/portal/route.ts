import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const {
      data: { user },
      error: userErr,
    } = await supabaseAdmin.auth.getUser(token)

    if (userErr || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Prefer profile email, fallback to auth user email
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .limit(1)

    const email = profiles?.[0]?.email || user.email

    // Find or create Stripe customer
    let customerId: string | undefined

    if (email) {
      const list = await stripe.customers.list({ email, limit: 1 })
      if (list.data.length) {
        customerId = list.data[0].id
      } else {
        const cust = await stripe.customers.create({ email, metadata: { user_id: user.id } })
        customerId = cust.id
      }
    } else {
      // No email available; create an anonymous customer tied to user_id
      const cust = await stripe.customers.create({ metadata: { user_id: user.id } })
      customerId = cust.id
    }

    const returnUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://parleyapp.ai'

    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId!,
      return_url: returnUrl,
    })

    return NextResponse.json({ url: portal.url })
  } catch (e: any) {
    console.error('create portal error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
