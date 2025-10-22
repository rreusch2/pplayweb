'use client'
import { usePathname, useRouter } from 'next/navigation'
import Navigation from './Navigation'
import { useAuth } from '@/contexts/SimpleAuthContext'
import { useEffect, useState } from 'react'
import { RefreshCw, AlertTriangle } from 'lucide-react'
import { clearAuthStorage } from '@/lib/supabase'

interface LayoutWrapperProps {
  children: React.ReactNode
}

const publicRoutes = ['/', '/privacy', '/terms', '/signin', '/signup']
const authRoutes = ['/signin', '/signup']

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { initializing, user, error, clearError } = useAuth()
  const [showErrorRecovery, setShowErrorRecovery] = useState(false)

  const isPublicRoute = publicRoutes.includes(pathname)
  const isAuthRoute = authRoutes.includes(pathname)

  // Show error recovery after 10 seconds if still initializing
  useEffect(() => {
    if (initializing && !isPublicRoute) {
      const timer = setTimeout(() => {
        setShowErrorRecovery(true)
      }, 10000)

      return () => clearTimeout(timer)
    } else {
      setShowErrorRecovery(false)
    }
  }, [initializing, isPublicRoute])

  // Handle auth state changes
  useEffect(() => {
    if (initializing) {
      return // Don't do anything while we're still figuring out the auth state
    }

    if (!user && !isPublicRoute) {
      console.log('[Layout] User not authenticated and on a protected route. Redirecting to home.')
      router.push('/')
    }

    if (user && isAuthRoute) {
      console.log('[Layout] User is authenticated but on an auth route. Redirecting to dashboard.')
      router.push('/dashboard')
    }
  }, [initializing, user, isPublicRoute, isAuthRoute, router])

  // Handle recovery action
  const handleRecovery = () => {
    console.log('[Layout] User initiated recovery')
    clearAuthStorage()
    clearError()
    window.location.href = '/' // Hard reload to reset everything
  }

  // Public routes render immediately for SEO/UX
  if (isPublicRoute) {
    return (
      <>
        <main id="main-content" role="main" className="h-full">
          {children}
        </main>
      </>
    )
  }

  // Show loading state with recovery option
  if (initializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <RefreshCw className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-white text-lg mb-2">Loading your account...</p>
          <p className="text-gray-400 text-sm mb-6">Please wait while we verify your session</p>
          
          {showErrorRecovery && (
            <div className="mt-8 p-4 bg-yellow-900/30 border border-yellow-700/50 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
              <p className="text-yellow-200 text-sm mb-4">
                Taking longer than expected? Your session might be corrupted.
              </p>
              <button
                onClick={handleRecovery}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Reset Session & Continue
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Show auth error if present
  if (error && !isPublicRoute) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-white text-xl font-semibold mb-2">Authentication Error</h2>
          <p className="text-gray-400 text-sm mb-6">
            We encountered an issue with your session. Please try refreshing or resetting your session.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Refresh Page
            </button>
            <button
              onClick={handleRecovery}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Reset Session & Continue
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Render the layout
  const showNav = user && !isPublicRoute

  return (
    <>
      {showNav && <Navigation />}
      <main id="main-content" role="main" className={!showNav ? 'h-full' : ''}>
        {children}
      </main>
    </>
  )
}
