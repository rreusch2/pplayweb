"use client"

import { useEffect, useState, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/SimpleAuthContext'

// TypeScript declaration for ChatKit global
declare global {
  interface Window {
    ChatKit: {
      create: (options: any) => {
        element: HTMLElement
      }
    }
  }
}

interface SelfHostedChatKitProps {
  className?: string
  onSessionStart?: () => void
  onSessionEnd?: () => void
}

export default function SelfHostedChatKit({ 
  className = "h-[600px] w-full",
  onSessionStart,
  onSessionEnd
}: SelfHostedChatKitProps) {
  
  const { user, session, profile } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const chatkitRef = useRef<HTMLDivElement>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize ChatKit with vanilla JS (more reliable for self-hosted)
  const initializeChatKit = useCallback(async () => {
    if (!user || !session || !chatkitRef.current || isInitialized) return
    
    try {
      setIsLoading(true)
      console.log('🎯 Initializing self-hosted ChatKit...')
      
      // Get client secret
      const res = await fetch('/api/chatkit/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          user_id: user.id,
          user_email: user.email,
          tier: profile?.subscription_tier,
          preferences: {
            sports: profile?.preferred_sports,
            risk_tolerance: profile?.risk_tolerance,
            betting_style: profile?.betting_style
          }
        })
      })
      
      if (!res.ok) {
        throw new Error(`Session failed: ${res.status}`)
      }
      
      const data = await res.json()
      console.log('✅ Got session data:', data.session_id)
      
      // Load ChatKit script if not already loaded
      if (!window.ChatKit) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://cdn.platform.openai.com/deployments/chatkit/chatkit.js'
          script.onload = resolve
          script.onerror = reject
          document.head.appendChild(script)
        })
      }
      
      // Initialize ChatKit with vanilla JS
      const chatkit = window.ChatKit.create({
        api: { 
          clientToken: data.client_secret
        }
      })
      
      // Mount to our div
      if (chatkitRef.current) {
        chatkitRef.current.innerHTML = ''
        chatkitRef.current.appendChild(chatkit.element)
      }
      
      setIsInitialized(true)
      onSessionStart?.()
      
    } catch (error) {
      console.error('❌ ChatKit initialization failed:', error)
      setError('Failed to initialize Professor Lock')
    } finally {
      setIsLoading(false)
    }
  }, [user, session, profile, onSessionStart, isInitialized])

  useEffect(() => {
    console.log('🎯 SelfHostedChatKit mounting...')
    console.log('User:', user?.id)
    console.log('Server: https://pykit-production.up.railway.app')
    
    initializeChatKit()

    return () => {
      console.log('🔌 SelfHostedChatKit unmounting')
      onSessionEnd?.()
    }
  }, [initializeChatKit, onSessionEnd])

  // Show authentication required
  if (!user) {
    return (
      <div className="flex h-[600px] items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-black/60 via-black/50 to-black/60">
        <div className="text-center">
          <div className="mb-4 text-6xl">🎯</div>
          <p className="text-lg text-slate-300 mb-2">Please log in to access Professor Lock</p>
          <p className="text-sm text-slate-500">Your AI sports betting assistant</p>
        </div>
      </div>
    )
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex h-[600px] items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-black/60 via-black/50 to-black/60">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white mx-auto"></div>
          <p className="text-lg text-slate-300">Loading Professor Lock...</p>
          <p className="text-sm text-slate-500 mt-2">Self-hosted with advanced widgets</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="flex h-[600px] items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-black/60 via-black/50 to-black/60">
        <div className="text-center max-w-md px-4">
          <div className="mb-4 text-5xl">⚠️</div>
          <p className="mb-2 text-lg text-red-400">{error}</p>
          <p className="text-sm text-slate-500 mb-4">
            Having trouble connecting to the server
          </p>
          <button 
            onClick={() => {
              setError(null)
              setIsLoading(true)
              window.location.reload()
            }} 
            className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  // Render ChatKit
  return (
    <div className={className}>
      <div className="h-full rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-black/60 via-black/50 to-black/60 backdrop-blur-sm">
        <div 
          ref={chatkitRef}
          className="w-full h-full"
          style={{ minHeight: '400px' }}
        />
      </div>
      
      {/* Self-hosted indicator */}
      <div className="mt-2 text-xs text-slate-500 text-center flex items-center justify-center gap-2">
        <span className={`inline-block w-2 h-2 rounded-full ${isInitialized ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></span>
        <span>Self-hosted • {isInitialized ? 'Advanced widgets enabled' : 'Initializing...'}</span>
      </div>
    </div>
  )
}

