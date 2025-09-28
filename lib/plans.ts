'use client'

export interface Plan {
  id: string
  stripePriceId: string // from Stripe dashboard
  tier: 'pro' | 'elite'
  name: string
  price: number
  /** Billing interval: week|month|year|day|one_time */
  interval: 'week' | 'month' | 'year' | 'day' | 'one_time',
  features: string[],
  savings?: string,
}

// Updated with correct pricing matching mobile app tiers
export const PLANS: Plan[] = [
  {
    id: 'pro_weekly',
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_WEEKLY || '',
    tier: 'pro',
    name: 'Weekly Pro',
    price: 12.49,
    interval: 'week',
    features: ['20 Daily AI Picks', '8 Daily Insights', 'Professor Lock Chat', 'Real-time Updates', 'Play of the Day'],
  },
  {
    id: 'pro_monthly',
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY || '',
    tier: 'pro',
    name: 'Pro Monthly',
    price: 24.99,
    interval: 'month',
    features: ['20 Daily AI Picks', '8 Daily Insights', 'Professor Lock Chat', 'Real-time Updates', 'Play of the Day'],
    savings: 'Save 50%',
  },
  {
    id: 'pro_yearly',
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY || '',
    tier: 'pro',
    name: 'Yearly Pro',
    price: 199.99,
    interval: 'year',
    features: ['20 Daily AI Picks', '8 Daily Insights', 'Professor Lock Chat', 'Real-time Updates', 'Play of the Day', '7-Day Free Trial'],
    savings: 'Save 83%',
  },
  {
    id: 'pro_lifetime',
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_LIFETIME || '',
    tier: 'pro',
    name: 'Lifetime Pro',
    price: 349.99,
    interval: 'one_time',
    features: ['20 Daily AI Picks', '8 Daily Insights', 'Professor Lock Chat', 'Real-time Updates', 'Play of the Day', 'All Future Updates'],
    savings: 'Best Value',
  },
  {
    id: 'elite_weekly',
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ELITE_WEEKLY || '',
    tier: 'elite',
    name: 'Weekly Elite',
    price: 14.99,
    interval: 'week',
    features: ['30 Daily AI Picks', '12 Daily Insights', 'Advanced Professor Lock', 'Premium Analytics', 'Lock of the Day', 'Early Feature Access'],
  },
  {
    id: 'elite_monthly',
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ELITE_MONTHLY || '',
    tier: 'elite',
    name: 'Monthly Elite',
    price: 29.99,
    interval: 'month',
    features: ['30 Daily AI Picks', '12 Daily Insights', 'Advanced Professor Lock', 'Premium Analytics', 'Lock of the Day', 'Early Feature Access'],
    savings: 'Save 50%',
  },
  {
    id: 'elite_yearly',
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ELITE_YEARLY || '',
    tier: 'elite',
    name: 'Yearly Elite',
    price: 199.99,
    interval: 'year',
    features: ['30 Daily AI Picks', '12 Daily Insights', 'Advanced Professor Lock', 'Premium Analytics', 'Lock of the Day', 'Early Feature Access', '3-Day Free Trial'],
    savings: 'Save 72%',
  },
]
