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

// Optional update for Stripe-specific columns; ignore errors if columns don't exist
async function safeUpdateStripeFields(userId: string, fields: Record<string, any>) {
  try {
    const { error } = await supabaseAdmin.from('profiles').update(fields).eq('id', userId)
    if (error) {
      console.warn('Stripe-specific profile update skipped:', error.message)
    }
  } catch (e: any) {
    console.warn('Stripe-specific profile update error (ignored):', e?.message || e)
  }
}

function extractCustomerId(customer: string | Stripe.Customer | Stripe.DeletedCustomer | null | undefined): string | undefined {
  if (!customer) return undefined
  if (typeof customer === 'string') return customer
  const candidate = (customer as Stripe.Customer).id
  return typeof candidate === 'string' ? candidate : undefined
}

const PLAN_KEYS = [
  'pro_daypass',
  'pro_weekly',
  'pro_monthly',
  'pro_yearly',
  'pro_lifetime',
  'elite_daypass',
  'elite_weekly',
  'elite_monthly',
  'elite_yearly',
  'elite_lifetime',
] as const

type PlanKey = typeof PLAN_KEYS[number]

type PlanConfig = {
  tier: 'pro' | 'elite'
  planType: 'day' | 'week' | 'month' | 'year' | 'lifetime'
  duration: 'daypass' | 'week' | 'month' | 'year' | 'lifetime'
  maxDailyPicks: number
  isLifetime?: boolean
}

const PLAN_CONFIG: Record<PlanKey, PlanConfig> = {
  pro_daypass:      { tier: 'pro',   planType: 'day',       duration: 'daypass', maxDailyPicks: 20 },
  pro_weekly:       { tier: 'pro',   planType: 'week',      duration: 'week',    maxDailyPicks: 20 },
  pro_monthly:      { tier: 'pro',   planType: 'month',     duration: 'month',   maxDailyPicks: 20 },
  pro_yearly:       { tier: 'pro',   planType: 'year',      duration: 'year',    maxDailyPicks: 20 },
  pro_lifetime:     { tier: 'pro',   planType: 'lifetime',  duration: 'lifetime', maxDailyPicks: 20, isLifetime: true },
  elite_daypass:    { tier: 'elite', planType: 'day',       duration: 'daypass', maxDailyPicks: 30 },
  elite_weekly:     { tier: 'elite', planType: 'week',      duration: 'week',    maxDailyPicks: 30 },
  elite_monthly:    { tier: 'elite', planType: 'month',     duration: 'month',   maxDailyPicks: 30 },
  elite_yearly:     { tier: 'elite', planType: 'year',      duration: 'year',    maxDailyPicks: 30 },
  elite_lifetime:   { tier: 'elite', planType: 'lifetime',  duration: 'lifetime', maxDailyPicks: 30, isLifetime: true },
}

const PLAN_ENV_KEYS: Record<PlanKey, string[]> = {
  pro_daypass:    ['NEXT_PUBLIC_STRIPE_PRICE_PRO_DAYPASS'],
  pro_weekly:     ['NEXT_PUBLIC_STRIPE_PRICE_PRO_WEEKLY'],
  pro_monthly:    ['NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY'],
  pro_yearly:     ['NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY'],
  pro_lifetime:   ['NEXT_PUBLIC_STRIPE_PRICE_PRO_LIFETIME'],
  elite_daypass:  ['NEXT_PUBLIC_STRIPE_PRICE_ELITE_DAYPASS'],
  elite_weekly:   ['NEXT_PUBLIC_STRIPE_PRICE_ELITE_WEEKLY'],
  elite_monthly:  ['NEXT_PUBLIC_STRIPE_PRICE_ELITE_MONTHLY'],
  elite_yearly:   ['NEXT_PUBLIC_STRIPE_PRICE_ELITE_YEARLY'],
  elite_lifetime: ['NEXT_PUBLIC_STRIPE_PRICE_ELITE_LIFETIME'],
}

const HARDCODED_PRICE_TO_PLAN: Record<string, PlanKey> = {
  // Elite prices
  price_1RsHrXRo1RFNyzsn6tf8SYDr: 'elite_weekly',
  price_1RsHswRo1RFNyzsnyyluM3J2: 'elite_monthly',
  price_1RsHugRo1RFNyzsnhKEKMAE6: 'elite_yearly',
  price_1SBVgmRo1RFNyzsnVPrt2JDK: 'elite_daypass',
  price_1SBVaSRo1RFNyzsnLdiz5euz: 'elite_lifetime',
}

const PRODUCT_TO_PLAN: Record<string, PlanKey> = {
  prod_T7lDN3HLfwVpkU: 'elite_daypass',
}

const PRICE_TO_PLAN = new Map<string, PlanKey>()

function registerPriceMapping(plan: PlanKey, priceId?: string | null) {
  if (priceId) {
    PRICE_TO_PLAN.set(priceId, plan)
  }
}

for (const [plan, envKeys] of Object.entries(PLAN_ENV_KEYS) as [PlanKey, string[]][]) {
  for (const envKey of envKeys) {
    const value = process.env[envKey]
    if (value) {
      registerPriceMapping(plan, value)
    }
  }
}

for (const [priceId, plan] of Object.entries(HARDCODED_PRICE_TO_PLAN) as [string, PlanKey][]) {
  registerPriceMapping(plan, priceId)
}

function isPlanKey(value: string | null | undefined): value is PlanKey {
  if (!value) return false
  return Object.prototype.hasOwnProperty.call(PLAN_CONFIG, value)
}

function normalizeInterval(value?: string | null): 'daypass' | 'week' | 'month' | 'year' | 'lifetime' | null {
  if (!value) return null
  const normalized = value.toLowerCase()
  switch (normalized) {
    case 'day':
    case 'daypass':
    case 'day_pass':
      return 'daypass'
    case 'week':
    case 'weekly':
      return 'week'
    case 'month':
    case 'monthly':
      return 'month'
    case 'year':
    case 'yearly':
      return 'year'
    case 'lifetime':
      return 'lifetime'
    default:
      return null
  }
}

function buildPlanKeyFromTierInterval(tier?: string | null, interval?: string | null): PlanKey | null {
  if (!tier || !interval) return null
  const normalizedTier = tier.toLowerCase()
  const normalizedInterval = normalizeInterval(interval)
  if (!normalizedInterval) return null
  const intervalKey = normalizedInterval === 'daypass' ? 'daypass' : normalizedInterval === 'lifetime' ? 'lifetime' : `${normalizedInterval === 'week' ? 'weekly' : normalizedInterval === 'month' ? 'monthly' : 'yearly'}`
  const candidate = `${normalizedTier}_${intervalKey}`
  if (isPlanKey(candidate)) {
    return candidate
  }
  return null
}

type ResolveUserContextArgs = {
  metadata?: Stripe.Metadata | null
  stripeCustomer?: string | Stripe.Customer | Stripe.DeletedCustomer | null
  customerEmail?: string | null
}

async function resolveUserContext({
  metadata,
  stripeCustomer,
  customerEmail,
}: ResolveUserContextArgs): Promise<{ userId: string | null; stripeCustomerId?: string; customerEmail?: string | null }> {
  const meta: Record<string, string | null> = metadata ?? {}
  const userIdFromMeta =
    meta.user_id ||
    meta.userId ||
    meta.user ||
    meta.profile_id ||
    meta.profileId ||
    null

  const stripeCustomerId = extractCustomerId(stripeCustomer)

  if (userIdFromMeta) {
    return { userId: String(userIdFromMeta), stripeCustomerId, customerEmail }
  }

  if (stripeCustomerId) {
    try {
      const { data: profileByStripe } = await supabaseAdmin
        .from('profiles')
        .select('id, email')
        .eq('stripe_customer_id', stripeCustomerId)
        .maybeSingle()

      if (profileByStripe?.id) {
        return {
          userId: profileByStripe.id,
          stripeCustomerId,
          customerEmail: profileByStripe.email ?? customerEmail ?? null,
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed lookup by stripe_customer_id:', error)
    }
  }

  let normalizedEmail: string | null = null

  if (customerEmail) {
    normalizedEmail = customerEmail.trim().toLowerCase()
  }

  if (!normalizedEmail && stripeCustomerId) {
    try {
      const customer = await stripe.customers.retrieve(stripeCustomerId)
      if (!('deleted' in customer) && typeof customer.email === 'string') {
        normalizedEmail = customer.email.trim().toLowerCase()
      }
    } catch (error) {
      console.warn('⚠️ Unable to fetch Stripe customer for email resolution:', error)
    }
  }

  if (normalizedEmail) {
    try {
      const { data: profileByEmail } = await supabaseAdmin
        .from('profiles')
        .select('id, stripe_customer_id')
        .eq('email', normalizedEmail)
        .maybeSingle()

      if (profileByEmail?.id) {
        if (!profileByEmail.stripe_customer_id && stripeCustomerId) {
          await safeUpdateStripeFields(profileByEmail.id, { stripe_customer_id: stripeCustomerId })
        }

        return {
          userId: profileByEmail.id,
          stripeCustomerId: stripeCustomerId ?? profileByEmail.stripe_customer_id ?? undefined,
          customerEmail: normalizedEmail,
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed lookup by email:', error)
    }
  }

  return {
    userId: null,
    stripeCustomerId,
    customerEmail: normalizedEmail ?? customerEmail ?? null,
  }
}

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

// Map Stripe recurring.interval to our plan type labels
function mapIntervalToPlanType(interval?: string | null): 'weekly' | 'monthly' | 'yearly' | 'daypass' | 'lifetime' {
  const normalized = normalizeInterval(interval)
  switch (normalized) {
    case 'week':
      return 'weekly'
    case 'year':
      return 'yearly'
    case 'daypass':
      return 'daypass'
    case 'lifetime':
      return 'lifetime'
    case 'month':
    default:
      return 'monthly'
  }
}

function isElitePriceId(priceId?: string | null): boolean {
  if (!priceId) return false
  const plan = PRICE_TO_PLAN.get(priceId)
  if (plan) {
    return PLAN_CONFIG[plan].tier === 'elite'
  }
  return false
}

function resolvePlanKey(options: {
  metadata?: Stripe.Metadata | null
  priceId?: string | null
  interval?: string | null
  productId?: string | null
}): PlanKey | null {
  const { metadata, priceId, interval, productId } = options

  const metadataCandidate = metadata?.subscription_type || metadata?.planId || metadata?.plan_id || metadata?.plan || null
  if (isPlanKey(metadataCandidate)) {
    return metadataCandidate
  }

  const tierFromMetadata = metadata?.tier || metadata?.subscription_tier
  const intervalFromMetadata = metadata?.interval || metadata?.plan_interval || metadata?.billing_interval || metadata?.duration
  const planFromTierInterval = buildPlanKeyFromTierInterval(tierFromMetadata, intervalFromMetadata || interval)
  if (planFromTierInterval) {
    return planFromTierInterval
  }

  if (priceId) {
    const mapped = PRICE_TO_PLAN.get(priceId)
    if (mapped) {
      return mapped
    }
  }

  if (productId) {
    const mapped = PRODUCT_TO_PLAN[productId]
    if (mapped) {
      return mapped
    }
  }

  if (tierFromMetadata) {
    const fallbackPlan = buildPlanKeyFromTierInterval(tierFromMetadata, interval)
    if (fallbackPlan) {
      return fallbackPlan
    }
  }

  return null
}

function deriveTier(planKey: PlanKey | null, metadata?: Stripe.Metadata | null, priceId?: string | null): 'pro' | 'elite' | 'free' {
  if (planKey) {
    return PLAN_CONFIG[planKey].tier
  }
  const metaTier = metadata?.tier || metadata?.subscription_tier
  if (typeof metaTier === 'string') {
    const normalized = metaTier.toLowerCase()
    if (normalized.includes('elite')) return 'elite'
    if (normalized.includes('pro')) return 'pro'
  }
  if (priceId && isElitePriceId(priceId)) {
    return 'elite'
  }
  return 'pro'
}

function derivePlanType(planKey: PlanKey | null, metadata?: Stripe.Metadata | null, interval?: string | null): string | null {
  if (planKey) {
    return PLAN_CONFIG[planKey].planType
  }
  const metaPlanType = metadata?.plan_type || metadata?.plan_interval || metadata?.billing_interval || metadata?.interval
  if (typeof metaPlanType === 'string') {
    const normalized = normalizeInterval(metaPlanType)
    if (normalized === 'daypass') return 'day'
    if (normalized === 'week') return 'week'
    if (normalized === 'month') return 'month'
    if (normalized === 'year') return 'year'
    if (normalized === 'lifetime') return 'lifetime'
  }
  const normalizedInterval = normalizeInterval(interval)
  switch (normalizedInterval) {
    case 'daypass':
      return 'day'
    case 'week':
      return 'week'
    case 'year':
      return 'year'
    case 'lifetime':
      return 'lifetime'
    case 'month':
    default:
      return 'month'
  }
}

function deriveDuration(planKey: PlanKey | null, metadata?: Stripe.Metadata | null, interval?: string | null): 'daypass' | 'week' | 'month' | 'year' | 'lifetime' {
  if (planKey) {
    return PLAN_CONFIG[planKey].duration
  }
  const normalizedMeta = normalizeInterval(metadata?.duration || metadata?.plan_interval || metadata?.billing_interval || metadata?.interval)
  if (normalizedMeta) {
    return normalizedMeta
  }
  return normalizeInterval(interval) || 'month'
}

function computeExpiration(planKey: PlanKey | null, metadata?: Stripe.Metadata | null, interval?: string | null): string | null {
  const duration = deriveDuration(planKey, metadata, interval)
  const now = new Date()
  switch (duration) {
    case 'daypass':
      now.setTime(now.getTime() + 24 * 60 * 60 * 1000)
      return now.toISOString()
    case 'week':
      now.setDate(now.getDate() + 7)
      return now.toISOString()
    case 'month':
      now.setMonth(now.getMonth() + 1)
      return now.toISOString()
    case 'year':
      now.setFullYear(now.getFullYear() + 1)
      return now.toISOString()
    case 'lifetime':
      return new Date('2099-12-31').toISOString()
    default:
      return now.toISOString()
  }
}

function getPlanMaxDailyPicks(planKey: PlanKey | null, inferredTier: 'pro' | 'elite' | 'free'): number {
  if (planKey) {
    return PLAN_CONFIG[planKey].maxDailyPicks
  }
  return inferredTier === 'elite' ? 30 : inferredTier === 'pro' ? 20 : 2
}

function getNumericProperty(target: unknown, key: string): number | null {
  if (!target) return null
  const record = target as Record<string, unknown>
  const value = record?.[key]
  return typeof value === 'number' ? value : null
}

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

    // Handle the event
    let handlerError: string | undefined
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session).catch(e => { handlerError = String(e) })
        break
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent).catch(e => { handlerError = String(e) })
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
    const userId = paymentIntent.metadata.user_id || paymentIntent.metadata.userId
    const subscriptionType = paymentIntent.metadata.subscription_type || paymentIntent.metadata.planId

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

// Handle successful completion of Stripe Checkout
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  try {
    console.log('🎉 Checkout session completed:', session.id)
    const userId = (session.client_reference_id as string) || (session.metadata?.userId as string) || ''

    if (!userId) {
      console.error('❌ No userId found in checkout session')
      return
    }

    console.log('👤 Processing subscription for user:', userId)

    // One-time payment flow (daypass/lifetime) -> no subscription
    if (session.mode === 'payment') {
      const piId = session.payment_intent as string | null
      if (!piId) return
      const paymentIntent = await stripe.paymentIntents.retrieve(piId)
      const subscriptionType = (paymentIntent.metadata?.subscription_type as string) || ''
      if (!subscriptionType) return

      console.log('💳 Processing one-time payment:', subscriptionType)
      const subData = getSubscriptionData(subscriptionType)
      
      // Special handling for lifetime purchases
      const updateData: any = {
        subscription_tier: subData.tier,
        subscription_status: 'active',
        subscription_plan_type: subData.planType,
        subscription_started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        max_daily_picks: subData.tier === 'elite' ? 30 : (subData.tier === 'pro' ? 20 : 2),
        subscription_provider: 'stripe',
      }
      
      if (subData.isLifetime) {
        // Lifetime: no expiration, reset welcome bonus
        updateData.subscription_expires_at = null
        updateData.welcome_bonus_claimed = false
        updateData.welcome_bonus_expires_at = null
      } else {
        updateData.subscription_expires_at = subData.expiresAt
      }
      
      // Add customer ID tracking
      if (session.customer) {
        updateData.stripe_customer_id = typeof session.customer === 'string' ? session.customer : session.customer.id
      }
      
      const { error } = await supabaseAdmin
        .from('profiles')
        .update(updateData)
        .eq('id', userId)

      if (error) {
        console.error('❌ Error updating profile after checkout (payment):', error)
      } else {
        console.log('✅ Successfully updated user to', subData.tier, 'tier')
      }
      return
    }

    // Subscription flow -> use Stripe subscription current period end
    if (session.mode === 'subscription' && session.subscription) {
      const subId = session.subscription as string
      const subscription = await stripe.subscriptions.retrieve(subId, {
        expand: ['items.data.price.product']
      })

      const price = subscription.items.data[0]?.price
      const priceId = price?.id ?? null
      const productId = typeof price?.product === 'string' ? price.product : (price?.product as Stripe.Product | undefined)?.id ?? null
      const recurringInterval = price?.recurring?.interval ?? null
      const planKey = resolvePlanKey({
        metadata: subscription.metadata,
        priceId,
        interval: recurringInterval,
        productId,
      })

      const inferredTier = deriveTier(planKey, subscription.metadata, priceId)
      const planType = derivePlanType(planKey, subscription.metadata, recurringInterval)
      const currentPeriodEndUnix = getNumericProperty(subscription, 'current_period_end')
      const expiresAt = currentPeriodEndUnix
        ? new Date(currentPeriodEndUnix * 1000).toISOString()
        : computeExpiration(planKey, subscription.metadata, recurringInterval)
      const maxDailyPicks = getPlanMaxDailyPicks(planKey, inferredTier)

      console.log('🔄 Processing subscription:', {
        subscriptionId: subscription.id,
        inferredTier,
        planType,
        priceId,
        planKey,
      })

      const updateData = {
        subscription_tier: inferredTier,
        subscription_status: subscription.status ?? 'active',
        subscription_plan_type: planType,
        subscription_started_at: new Date().toISOString(),
        subscription_expires_at: expiresAt,
        updated_at: new Date().toISOString(),
        max_daily_picks: maxDailyPicks,
        subscription_provider: 'stripe',
        stripe_customer_id: extractCustomerId(subscription.customer) ?? null,
        stripe_subscription_id: subscription.id,
        stripe_price_id: priceId,
      }

      const { error } = await supabaseAdmin
        .from('profiles')
        .update(updateData)
        .eq('id', userId)

      if (error) {
        console.error('❌ Error updating profile after checkout (subscription):', error)
      } else {
        console.log('✅ Successfully activated', inferredTier, 'subscription for user')
      }
    }
  } catch (error) {
    console.error('❌ Error in handleCheckoutSessionCompleted:', error)
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('Subscription created:', subscription.id)

  try {
    const { userId, stripeCustomerId } = await resolveUserContext({
      metadata: subscription.metadata,
      stripeCustomer: subscription.customer,
      customerEmail: (subscription as any)?.customer_email ?? (subscription as any)?.customer_details?.email ?? null,
    })

    if (!userId) {
      console.warn('⚠️ Unable to resolve user for subscription.created event')
      return
    }

    const price = subscription.items.data[0]?.price
    const priceId = price?.id ?? null
    const productId = typeof price?.product === 'string' ? price.product : (price?.product as Stripe.Product | undefined)?.id ?? null
    const recurringInterval = price?.recurring?.interval ?? null
    const planKey = resolvePlanKey({
      metadata: subscription.metadata,
      priceId,
      interval: recurringInterval,
      productId,
    })

    const inferredTier = deriveTier(planKey, subscription.metadata, priceId)
    const planType = derivePlanType(planKey, subscription.metadata, recurringInterval)
    const currentPeriodEndUnix = getNumericProperty(subscription, 'current_period_end')
    const expiresAt = currentPeriodEndUnix
      ? new Date(currentPeriodEndUnix * 1000).toISOString()
      : computeExpiration(planKey, subscription.metadata, recurringInterval)
    const maxDailyPicks = getPlanMaxDailyPicks(planKey, inferredTier)

    const profileUpdate: Record<string, any> = {
      subscription_tier: inferredTier,
      subscription_status: subscription.status ?? 'active',
      subscription_plan_type: planType,
      subscription_started_at: new Date().toISOString(),
      subscription_expires_at: expiresAt,
      subscription_source: 'stripe',
      max_daily_picks: maxDailyPicks,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update(profileUpdate)
      .eq('id', userId)

    if (error) {
      console.error('❌ Error updating profile on subscription creation:', error)
    } else {
      console.log(`✅ Subscription created for user ${userId}: tier=${inferredTier}, plan=${planType}`)
    }

    await safeUpdateStripeFields(userId, {
      stripe_customer_id: stripeCustomerId ?? extractCustomerId(subscription.customer),
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      current_period_start: (() => {
        const unix = getNumericProperty(subscription, 'current_period_start')
        return unix ? new Date(unix * 1000).toISOString() : null
      })(),
      current_period_end: expiresAt,
      cancel_at_period_end: subscription.cancel_at_period_end ?? false,
      canceled_at: (() => {
        const unix = getNumericProperty(subscription, 'canceled_at')
        return unix ? new Date(unix * 1000).toISOString() : null
      })(),
    })
  } catch (error) {
    console.error('Error handling subscription creation:', error)
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('🔄 Subscription updated:', subscription.id)

  try {
    const { userId, stripeCustomerId } = await resolveUserContext({
      metadata: subscription.metadata,
      stripeCustomer: subscription.customer,
      customerEmail: (subscription as any)?.customer_email ?? (subscription as any)?.customer_details?.email ?? null,
    })

    if (!userId) {
      console.warn('⚠️ Unable to resolve user for subscription.updated event')
      return
    }

    const baseUpdate: Record<string, any> = {
      subscription_status: subscription.status,
      updated_at: new Date().toISOString(),
    }

    if (subscription.status === 'canceled' || subscription.status === 'unpaid' || subscription.status === 'past_due') {
      console.log('⬇️ Downgrading user to free tier due to:', subscription.status)
      baseUpdate.subscription_tier = 'free'
      baseUpdate.subscription_expires_at = new Date().toISOString()
      baseUpdate.max_daily_picks = 2
      baseUpdate.canceled_at = new Date().toISOString()
      await supabaseAdmin.from('profiles').update(baseUpdate).eq('id', userId)
      await safeUpdateStripeFields(userId, {
        stripe_subscription_id: subscription.id,
        stripe_price_id: subscription.items.data[0]?.price?.id ?? null,
        stripe_customer_id: stripeCustomerId ?? extractCustomerId(subscription.customer),
        stripe_status: subscription.status,
      })
      return
    }

    const price = subscription.items.data[0]?.price
    const priceId = price?.id ?? null
    const productId = typeof price?.product === 'string' ? price.product : (price?.product as Stripe.Product | undefined)?.id ?? null
    const recurringInterval = price?.recurring?.interval ?? null

    const planKey = resolvePlanKey({
      metadata: subscription.metadata,
      priceId,
      interval: recurringInterval,
      productId,
    })

    const inferredTier = deriveTier(planKey, subscription.metadata, priceId)
    const planType = derivePlanType(planKey, subscription.metadata, recurringInterval)
    const currentPeriodEndUnix = getNumericProperty(subscription, 'current_period_end')
    const expiresAt = currentPeriodEndUnix
      ? new Date(currentPeriodEndUnix * 1000).toISOString()
      : computeExpiration(planKey, subscription.metadata, recurringInterval)
    const maxDailyPicks = getPlanMaxDailyPicks(planKey, inferredTier)

    const updateData: Record<string, any> = {
      ...baseUpdate,
      subscription_tier: inferredTier,
      subscription_plan_type: planType,
      subscription_expires_at: expiresAt,
      max_daily_picks: maxDailyPicks,
      subscription_provider: 'stripe',
      stripe_customer_id: stripeCustomerId ?? extractCustomerId(subscription.customer),
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', userId)

    if (error) {
      console.error('❌ Error updating profile on subscription update:', error)
    } else {
      console.log(`✅ Subscription updated for user ${userId}: ${subscription.status} (tier: ${inferredTier})`)
    }

    await safeUpdateStripeFields(userId, {
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      stripe_customer_id: stripeCustomerId ?? extractCustomerId(subscription.customer),
      current_period_start: (() => {
        const unix = getNumericProperty(subscription, 'current_period_start')
        return unix ? new Date(unix * 1000).toISOString() : null
      })(),
      current_period_end: expiresAt,
      cancel_at_period_end: subscription.cancel_at_period_end ?? false,
      canceled_at: (() => {
        const unix = getNumericProperty(subscription, 'canceled_at')
        return unix ? new Date(unix * 1000).toISOString() : null
      })(),
      stripe_status: subscription.status,
    })
  } catch (error) {
    console.error('❌ Error handling subscription update:', error)
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('🗑️ Subscription deleted:', subscription.id)
  
  try {
    const userId = subscription.metadata.user_id || subscription.metadata.userId
    
    if (userId) {
      console.log('⬇️ Downgrading user to free tier due to subscription deletion')
      
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({
          subscription_tier: 'free',
          subscription_status: 'canceled',
          subscription_expires_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          max_daily_picks: 2,
          stripe_subscription_id: null,
          stripe_price_id: null,
          canceled_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (error) {
        console.error('❌ Error updating profile on subscription deletion:', error)
      } else {
        console.log(`✅ Subscription canceled for user ${userId}, downgraded to free tier`)
      }
    }
  } catch (error) {
    console.error('❌ Error handling subscription deletion:', error)
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Invoice payment succeeded:', invoice.id)
  
  try {
    // Cast invoice to access subscription property
    const subscriptionId = (invoice as any)?.subscription as string | null

    if (subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['items.data.price.product']
      })

      const { userId, stripeCustomerId } = await resolveUserContext({
        metadata: subscription.metadata,
        stripeCustomer: subscription.customer,
        customerEmail: (subscription as any)?.customer_email ?? (subscription as any)?.customer_details?.email ?? null,
      })

      if (!userId) {
        console.warn('⚠️ Unable to resolve user for invoice.payment_succeeded event')
        return
      }

      const price = subscription.items.data[0]?.price
      const priceId = price?.id ?? null
      const productId = typeof price?.product === 'string' ? price.product : (price?.product as Stripe.Product | undefined)?.id ?? null
      const recurringInterval = price?.recurring?.interval ?? null

      const planKey = resolvePlanKey({
        metadata: subscription.metadata,
        priceId,
        interval: recurringInterval,
        productId,
      })

      const inferredTier = deriveTier(planKey, subscription.metadata, priceId)
      const planType = derivePlanType(planKey, subscription.metadata, recurringInterval)
      const currentPeriodEndUnix = getNumericProperty(subscription, 'current_period_end')
      const expiresAt = currentPeriodEndUnix
        ? new Date(currentPeriodEndUnix * 1000).toISOString()
        : computeExpiration(planKey, subscription.metadata, recurringInterval)
      const maxDailyPicks = getPlanMaxDailyPicks(planKey, inferredTier)

      const { error } = await supabaseAdmin
        .from('profiles')
        .update({
          subscription_tier: inferredTier,
          subscription_status: 'active',
          subscription_plan_type: planType,
          subscription_expires_at: expiresAt,
          updated_at: new Date().toISOString(),
          max_daily_picks: maxDailyPicks,
          subscription_provider: 'stripe',
          stripe_subscription_id: subscription.id,
          stripe_price_id: priceId,
          stripe_customer_id: stripeCustomerId ?? extractCustomerId(subscription.customer),
        })
        .eq('id', userId)

      if (error) {
        console.error('Error renewing subscription on invoice payment:', error)
      } else {
        console.log(`Subscription renewed for user ${userId}`)
      }

      await safeUpdateStripeFields(userId, {
        stripe_status: 'active',
        stripe_subscription_id: subscription.id,
        stripe_customer_id: stripeCustomerId ?? extractCustomerId(subscription.customer),
        stripe_price_id: priceId,
        current_period_start: (() => {
          const unix = getNumericProperty(subscription, 'current_period_start')
          return unix ? new Date(unix * 1000).toISOString() : null
        })(),
        current_period_end: expiresAt,
        cancel_at_period_end: subscription.cancel_at_period_end ?? false,
        subscription_provider: 'stripe',
      })
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
      const userId = subscription.metadata.user_id || subscription.metadata.userId
      
      if (userId) {
        // Mark subscription as past_due, but don't immediately downgrade
        // Let the subscription status update handle the downgrade
        const { error } = await supabaseAdmin
          .from('profiles')
          .update({
            subscription_status: 'past_due',
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId)

        if (error) {
          console.error('Error updating profile on invoice payment failure:', error)
        } else {
          console.log(`Marked subscription as past_due for user ${userId}`)
        }
        await safeUpdateStripeFields(userId, {
          stripe_status: 'past_due',
          subscription_provider: 'stripe',
        })
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
  let isLifetime = false

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
      planType = 'lifetime'
      isLifetime = true
      expiresAt = new Date('2099-12-31') // Far future date
      break
    
    // Elite Plans
    case 'elite_daypass':
      tier = 'elite'
      planType = 'day'
      expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24 hours
      break
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
    case 'elite_lifetime':
      tier = 'elite'
      planType = 'lifetime'
      isLifetime = true
      expiresAt = new Date('2099-12-31') // Far future date
      break
    
    default:
      tier = 'free'
      planType = 'month'
      expiresAt = now
  }

  return {
    tier,
    planType,
    expiresAt: expiresAt.toISOString(),
    isLifetime
  }
}
