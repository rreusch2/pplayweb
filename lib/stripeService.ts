/**
 * Stripe Service for Web App Integration
 * Handles Stripe pricing table integration and smart checkout flow
 */

export interface StripeProduct {
  id: string
  name: string
  price: number
  interval: 'day' | 'week' | 'month' | 'year'
  features: string[]
  popular?: boolean
}

export const STRIPE_PRODUCTS: Record<string, StripeProduct> = {
  'day_pass_pro': {
    id: 'day_pass_pro',
    name: 'Day Pass Pro',
    price: 4.99,
    interval: 'day',
    features: ['20 daily AI picks', 'Basic Professor Lock', '8 insights'],
  },
  'day_pass_elite': {
    id: 'day_pass_elite', 
    name: 'Day Pass Elite',
    price: 7.99,
    interval: 'day',
    features: ['30 daily AI picks', 'Advanced Professor Lock', '12 insights', 'Premium analytics'],
  },
  'weekly_pro': {
    id: 'weekly_pro',
    name: 'Weekly Pro', 
    price: 9.99,
    interval: 'week',
    features: ['20 daily AI picks', 'Basic Professor Lock', '8 insights', 'Trends access'],
    popular: true,
  },
  'weekly_elite': {
    id: 'weekly_elite',
    name: 'Weekly Elite',
    price: 14.99, 
    interval: 'week',
    features: ['30 daily AI picks', 'Advanced Professor Lock', '12 insights', 'Premium analytics', 'Early access'],
  }
}

/**
 * Smart Onboarding Flow Logic
 * Determines whether to skip subscription modal based on Stripe selection
 */
export class StripeOnboardingManager {
  private selectedProduct: StripeProduct | null = null
  private userEmail: string | null = null

  setSelectedProduct(productId: string) {
    this.selectedProduct = STRIPE_PRODUCTS[productId] || null
    console.log('🎯 Selected Stripe product:', this.selectedProduct?.name)
  }

  setUserEmail(email: string) {
    this.userEmail = email
  }

  hasPreSelectedProduct(): boolean {
    return this.selectedProduct !== null
  }

  getSelectedProduct(): StripeProduct | null {
    return this.selectedProduct
  }

  /**
   * Creates Stripe checkout URL with user context
   */
  createCheckoutUrl(baseUrl: string): string {
    if (!this.selectedProduct) {
      throw new Error('No product selected for checkout')
    }

    const successUrl = `${baseUrl}/api/stripe/success?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${baseUrl}/dashboard?checkout=cancelled`

    // Build Stripe checkout URL (this would be replaced with actual Stripe integration)
    const checkoutUrl = new URL('https://checkout.stripe.com/pay')
    
    // Add parameters for the selected product
    checkoutUrl.searchParams.set('success_url', successUrl)
    checkoutUrl.searchParams.set('cancel_url', cancelUrl)
    
    if (this.userEmail) {
      checkoutUrl.searchParams.set('prefilled_email', this.userEmail)
    }

    return checkoutUrl.toString()
  }

  /**
   * Determines onboarding flow based on user context
   */
  getOnboardingFlow(): 'preferences-then-stripe' | 'preferences-then-tiered' | 'standard' {
    if (this.hasPreSelectedProduct()) {
      return 'preferences-then-stripe'
    }
    return 'preferences-then-tiered'
  }

  /**
   * Clears selected product (used when user cancels or completes checkout)
   */
  clear() {
    this.selectedProduct = null
    this.userEmail = null
    console.log('🧹 Cleared Stripe onboarding context')
  }
}

// Singleton instance for managing onboarding state
export const stripeOnboardingManager = new StripeOnboardingManager()

/**
 * Helper function to detect if user came from Stripe pricing table
 */
export function detectStripeOrigin(): string | null {
  if (typeof window === 'undefined') return null
  
  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get('stripe_product') || localStorage.getItem('stripe_selected_product')
}

/**
 * Helper function to store Stripe product selection in localStorage
 */
export function storeStripeSelection(productId: string) {
  if (typeof window === 'undefined') return
  
  localStorage.setItem('stripe_selected_product', productId)
  stripeOnboardingManager.setSelectedProduct(productId)
}

/**
 * Helper function to clear Stripe product selection
 */
export function clearStripeSelection() {
  if (typeof window === 'undefined') return
  
  localStorage.removeItem('stripe_selected_product')
  stripeOnboardingManager.clear()
}
