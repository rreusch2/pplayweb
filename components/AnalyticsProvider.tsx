'use client'
import { useEffect } from 'react'
import { initFacebookPixel, initGoogleAnalytics } from '@/lib/analytics'

export default function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize Facebook Pixel
    const fbPixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID
    if (fbPixelId) {
      initFacebookPixel(fbPixelId)
      console.log('✅ Facebook Pixel initialized:', fbPixelId)
    } else {
      console.warn('⚠️ Facebook Pixel ID not found in environment variables')
    }

    // Initialize Google Analytics (recommended additional tracking)
    const gaId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
    if (gaId) {
      initGoogleAnalytics(gaId)
      console.log('✅ Google Analytics initialized (GA4 Measurement ID):', gaId)
    }
  }, [])

  return <>{children}</>
}
