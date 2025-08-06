'use client'
import { useEffect, useState } from 'react'
import { RefreshCw, AlertCircle } from 'lucide-react'

interface AuthFallbackProps {
  onRetry?: () => void
  timeout?: number
}

export default function AuthFallback({ onRetry, timeout = 15000 }: AuthFallbackProps) {
  const [showRetry, setShowRetry] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowRetry(true)
    }, timeout)

    return () => clearTimeout(timer)
  }, [timeout])

  const handleRetry = () => {
    if (onRetry) {
      onRetry()
    } else {
      // Fallback: refresh the page
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-6">
        <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
        <p className="text-white text-lg mb-2">Loading...</p>
        <p className="text-gray-400 text-sm mb-6">Initializing secure connection</p>
        
        {showRetry && (
          <div className="space-y-4">
            <div className="flex items-center justify-center text-yellow-400 mb-4">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span className="text-sm">Taking longer than expected</span>
            </div>
            <button
              onClick={handleRetry}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors duration-200 flex items-center mx-auto"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Connection
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
