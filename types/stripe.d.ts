// TypeScript declarations for Stripe Pricing Table web component
import React from 'react'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'stripe-pricing-table': {
        'pricing-table-id': string
        'publishable-key': string
        className?: string
        style?: React.CSSProperties
        children?: React.ReactNode
      }
    }
  }
  
  // Global Stripe types
  interface Window {
    Stripe?: any
  }
}

export {}
