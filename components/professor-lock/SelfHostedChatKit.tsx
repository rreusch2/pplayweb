"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import { ChatKit, useChatKit } from '@openai/chatkit-react'
import { useAuth } from '@/contexts/SimpleAuthContext'
import { toast } from 'react-hot-toast'

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
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)

  // Your self-hosted server URL (Railway or wherever you deploy)
  const CHATKIT_SERVER_URL = process.env.NEXT_PUBLIC_CHATKIT_SERVER_URL || 
    'https://pykit-production.up.railway.app'

  const getClientSecret = useCallback(async () => {
    try {
      if (!user || !session) {
        throw new Error('User not authenticated')
      }

      console.log('🔐 Creating self-hosted ChatKit session...')
      console.log('User ID:', user.id)
      console.log('Server URL:', CHATKIT_SERVER_URL)
      
      // Call your self-hosted session endpoint
      const res = await fetch(`${CHATKIT_SERVER_URL}/api/chatkit/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          user_id: user.id,
          user_email: user.email,
          tier: profile?.subscription_tier || 'free',
          preferences: {
            sports: profile?.preferred_sports,
            risk_tolerance: profile?.risk_tolerance,
            betting_style: profile?.betting_style
          }
        })
      })

      if (!res.ok) {
        const errorText = await res.text()
        console.error('Session creation failed:', errorText)
        throw new Error(`Failed to create session: ${res.status}`)
      }

      const data = await res.json()
      console.log('✅ Self-hosted session created:', data.session_id)
      
      onSessionStart?.()
      
      return data.client_secret
    } catch (error) {
      console.error('❌ ChatKit session error:', error)
      setError('Failed to connect to Professor Lock')
      throw error
    }
  }, [user, session, profile, CHATKIT_SERVER_URL, onSessionStart])

  // ChatKit options for self-hosted server
  const options = {
    api: {
      // Point to your self-hosted server
      url: `${CHATKIT_SERVER_URL}/chatkit`,
      
      // Get client secret from your server
      async getClientSecret() {
        return await getClientSecret()
      },
      
      // Custom fetch to add user context headers
      fetch: async (url: string, init: RequestInit = {}) => {
        console.log('📡 ChatKit request to:', url)
        
        return fetch(url, {
          ...init,
          headers: {
            ...init.headers,
            'X-User-Id': user?.id || '',
            'X-User-Email': user?.email || '',
            'X-User-Tier': profile?.subscription_tier || 'free',
            'X-Session-Id': session?.access_token || '',
          },
        })
      }
    },
    theme: {
      colorScheme: 'dark' as const,
      borderRadius: 'large' as const,
      primaryColor: '#3b82f6',
      fontFamily: 'Inter, system-ui, sans-serif',
    },
    ui: {
      brandName: 'Professor Lock',
      brandIcon: '🎯',
      placeholder: 'Ask Professor Lock about betting strategies...',
      welcomeMessage: {
        title: '🎯 Professor Lock',
        subtitle: 'Your AI Sports Betting Expert',
        suggestions: [
          'Build me a 3-leg parlay for tonight',
          'Show me odds for MLB games',
          'What\'s the best player prop for Lakers?',
          'Analyze trends for Patrick Mahomes'
        ]
      }
    },
    composer: {
      placeholder: 'Ask for analysis, odds, parlays...',
      submitOnEnter: true,
      attachments: {
        enabled: false, // Can enable later if needed
      }
    },
    display: {
      showTimestamps: true,
      showMessageActions: true,
      animateMessages: true,
      autoScroll: true,
    },
    behavior: {
      autoFocus: true,
      persistThread: true,
      loadHistory: true,
    }
  }

  const { control } = useChatKit(options as any)

  useEffect(() => {
    console.log('🎯 SelfHostedChatKit mounting...')
    console.log('User:', user?.id)
    console.log('Server:', CHATKIT_SERVER_URL)
    
    // Load ChatKit script
    if (!document.querySelector('script[src*="chatkit.js"]')) {
      console.log('📦 Loading ChatKit script...')
      const script = document.createElement('script')
      script.src = 'https://cdn.platform.openai.com/deployments/chatkit/chatkit.js'
      script.async = true
      script.onload = () => {
        console.log('✅ ChatKit script loaded')
        setIsLoading(false)
        setIsReady(true)
      }
      script.onerror = () => {
        console.error('❌ Failed to load ChatKit script')
        setError('Failed to load ChatKit library')
        setIsLoading(false)
      }
      document.head.appendChild(script)
    } else {
      console.log('✅ ChatKit script already loaded')
      setIsLoading(false)
      setIsReady(true)
    }

    return () => {
      console.log('🔌 SelfHostedChatKit unmounting')
      onSessionEnd?.()
    }
  }, [onSessionEnd, user, CHATKIT_SERVER_URL])

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
        <ChatKit control={control} />
      </div>
      
      {/* Self-hosted indicator */}
      <div className="mt-2 text-xs text-slate-500 text-center flex items-center justify-center gap-2">
        <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
        <span>Self-hosted • Advanced widgets enabled</span>
      </div>
    </div>
  )
}

