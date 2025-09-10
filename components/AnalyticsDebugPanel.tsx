'use client'
import { useState } from 'react'
import { 
  trackEvent, 
  trackSignupStart, 
  trackSignupComplete, 
  trackAppStoreClick, 
  trackCTAClick,
  trackGoogleEvent 
} from '@/lib/analytics'

export default function AnalyticsDebugPanel() {
  const [isVisible, setIsVisible] = useState(false)

  // Only show in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const testEvents = [
    {
      name: 'Test PageView',
      action: () => trackEvent('PageView'),
      description: 'Basic page view event'
    },
    {
      name: 'Test Signup Start',
      action: () => trackSignupStart(),
      description: 'User clicked signup button'
    },
    {
      name: 'Test Signup Complete', 
      action: () => trackSignupComplete('test-user-123'),
      description: 'User completed registration'
    },
    {
      name: 'Test App Store Click',
      action: () => trackAppStoreClick(),
      description: 'User clicked App Store download'
    },
    {
      name: 'Test CTA Click',
      action: () => trackCTAClick('Test Button'),
      description: 'Generic CTA button click'
    },
    {
      name: 'Test Purchase Event',
      action: () => trackEvent('Purchase', { value: 19.99, currency: 'USD' }),
      description: 'Test subscription purchase'
    }
  ]

  return (
    <>
      {/* Debug Toggle Button */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium"
        >
          🧪 Analytics Debug
        </button>
      </div>

      {/* Debug Panel */}
      {isVisible && (
        <div className="fixed bottom-16 right-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 w-80 max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Analytics Testing
            </h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Pixel ID:</strong> {process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || 'Not Set'}
            </div>
            
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <strong>GA ID:</strong> {process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID || 'Not Set'}
            </div>

            <hr className="border-gray-200 dark:border-gray-600" />

            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Test Events:
            </div>

            {testEvents.map((event, index) => (
              <div key={index} className="space-y-1">
                <button
                  onClick={event.action}
                  className="w-full text-left bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 px-3 py-2 rounded text-sm border border-blue-200 dark:border-blue-800"
                >
                  {event.name}
                </button>
                <div className="text-xs text-gray-500 dark:text-gray-400 px-3">
                  {event.description}
                </div>
              </div>
            ))}

            <hr className="border-gray-200 dark:border-gray-600" />

            <div className="text-xs text-gray-500 dark:text-gray-400">
              💡 Check browser console for tracking logs
              <br />
              📊 Use Facebook Pixel Helper extension
              <br />
              📈 View Events Manager for real-time data
            </div>
          </div>
        </div>
      )}
    </>
  )
}
