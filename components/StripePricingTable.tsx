'use client'
import { useEffect } from 'react'

interface StripePricingTableProps {
  className?: string
  showHeader?: boolean
  headerTitle?: string
  headerDescription?: string
}

export default function StripePricingTable({ 
  className = "",
  showHeader = true,
  headerTitle = "Choose Your Plan",
  headerDescription = "Unlock the power of AI-driven sports betting predictions. Start winning today."
}: StripePricingTableProps) {
  
  useEffect(() => {
    // Load Stripe pricing table script if not already loaded
    if (!document.querySelector('script[src="https://js.stripe.com/v3/pricing-table.js"]')) {
      const script = document.createElement('script')
      script.src = 'https://js.stripe.com/v3/pricing-table.js'
      script.async = true
      document.head.appendChild(script)
    }
  }, [])

  return (
    <div className={`stripe-pricing-section ${className}`}>
      {showHeader && (
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {headerTitle}
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            {headerDescription}
          </p>
        </div>
      )}
      
      <div className="stripe-pricing-table-container">
        <stripe-pricing-table 
          pricing-table-id="prctbl_1SBid2Ro1RFNyzsnNSVVWWK8"
          publishable-key="pk_live_51QWQQ5Ro1RFNyzsn6yoUYUELzd8WWKuV5fxdLQJhCd9BEXPBWbjaw10gC1IHJg2CnbPLV02FTZ2lexwYBWbi1PXK00Uqs9PtlB">
        </stripe-pricing-table>
      </div>
      
      {/* Additional CTA or Features */}
      <div className="text-center mt-8">
        <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>Cancel anytime</span>
          </div>
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>Secure payment</span>
          </div>
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>Instant access</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// TypeScript declarations are handled in types/stripe.d.ts
