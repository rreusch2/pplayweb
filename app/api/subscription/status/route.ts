import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Admin client for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

function isActive(status?: string | null) {
  return status === 'active' || status === 'trialing'
}

function notExpired(expiresAt?: string | null) {
  if (!expiresAt) return false
  // Handle lifetime subscriptions (far future dates)
  const expiryDate = new Date(expiresAt)
  return expiryDate.getTime() > Date.now()
}

export async function GET(req: NextRequest) {
  try {
    // Expect Authorization: Bearer <supabaseAccessToken>
    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Resolve the user from the token
    const {
      data: { user },
      error: userErr,
    } = await supabaseAdmin.auth.getUser(token)
    if (userErr || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Load profile row
    const { data: profiles, error: profErr } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .limit(1)

    if (profErr) {
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    const profile = profiles?.[0]

    if (!profile) {
      return NextResponse.json({
        userId: user.id,
        effectiveTier: 'free',
        source: 'none',
        subscription: null,
      })
    }

    // Compute effective tier considering Day Pass, Stripe, and RevenueCat
    const tier: string = profile.subscription_tier || 'free'
    const status: string | null = profile.subscription_status || null
    const expiresAt: string | null = profile.subscription_expires_at || null

    const dayPassTier: string | null = profile.day_pass_tier || null
    const dayPassExpiresAt: string | null = profile.day_pass_expires_at || null
    const dayPassActive = Boolean(dayPassTier) && notExpired(dayPassExpiresAt)

    const rcActive = Boolean(profile.revenuecat_entitlements) // loose check
    const stripeActive = isActive(status) && notExpired(expiresAt)

    let effectiveTier = 'free'
    let source: 'daypass' | 'stripe' | 'revenuecat' | 'none' = 'none'

    if (dayPassActive) {
      effectiveTier = dayPassTier as string
      source = 'daypass'
    } else if (stripeActive && tier !== 'free') {
      effectiveTier = tier
      source = 'stripe'
    } else if (rcActive && tier !== 'free') {
      effectiveTier = tier
      source = 'revenuecat'
    }

    return NextResponse.json({
      userId: user.id,
      effectiveTier,
      source,
      subscription: {
        tier: tier,
        status: status,
        planType: profile.subscription_plan_type || null,
        productId: profile.subscription_product_id || null,
        expiresAt: expiresAt,
        startedAt: profile.subscription_started_at || null,
        cancelAtPeriodEnd: profile.cancel_at_period_end ?? false,
        provider: profile.subscription_provider || null,
      },
      dayPass: {
        tier: profile.day_pass_tier || null,
        expiresAt: profile.day_pass_expires_at || null,
      },
      welcomeBonus: {
        active:
          Boolean(profile.welcome_bonus_claimed) &&
          profile.welcome_bonus_expires_at &&
          new Date(profile.welcome_bonus_expires_at).getTime() > Date.now(),
        expiresAt: profile.welcome_bonus_expires_at || null,
      },
    })
  } catch (err) {
    console.error('subscription/status error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
