"use client"

import { useEffect, useState, useCallback, useMemo } from 'react'
import { ChatKit, useChatKit } from '@openai/chatkit-react'
import { useAuth } from '@/contexts/SimpleAuthContext'

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

  // Configure for custom backend (self-hosted Python server)
  const options = useMemo(() => {
    if (!user || !session) return null
    
    return {
      api: {
        // Point to our self-hosted Python server (NO domainKey for custom backends!)
        url: 'https://pykit-production.up.railway.app/chatkit',
        domainKey: process.env.NEXT_PUBLIC_CHATKIT_DOMAIN_KEY ?? 'unknown-domain',
        
        // Custom fetch with auth headers for our backend
        fetch: (input: RequestInfo | URL, init?: RequestInit) => {
          console.log('🌐 ChatKit request to:', input)
          
          return fetch(input, {
            ...init,
            headers: {
              ...init?.headers,
              'Authorization': `Bearer ${session.access_token}`,
              'X-User-Id': user.id,
              'X-User-Email': user.email || '',
              'X-User-Tier': profile?.subscription_tier || 'free',
            },
          })
        }
      }
    }
  }, [user, session, profile])

  // Use ChatKit hook with self-hosted config (fallback to prevent null error)
  const chatkit = useChatKit(options || { 
    api: { 
      url: 'https://pykit-production.up.railway.app/chatkit',
      domainKey: process.env.NEXT_PUBLIC_CHATKIT_DOMAIN_KEY ?? 'unknown-domain',
      fetch: (_input: RequestInfo | URL, _init?: RequestInit) =>
        Promise.resolve(new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 }))
    }
  })

  // Ensure a thread exists so ChatKit initializes and starts requesting
  useEffect(() => {
    if (chatkit?.setThreadId) {
      console.log('🧵 Initializing ChatKit thread...')
      chatkit.setThreadId('new')
    }
  }, [chatkit])

  useEffect(() => {
    console.log('🎯 SelfHostedChatKit mounting...')
    console.log('User:', user?.id)
    console.log('Server: https://pykit-production.up.railway.app')
    console.log('ChatKit object:', chatkit)
    console.log('ChatKit control:', chatkit?.control)
    console.log('Options:', options)
    
    // ChatKit will handle initialization when options are ready
    if (options) {
      setIsLoading(false)
    }

    return () => {
      console.log('🔌 SelfHostedChatKit unmounting')
      onSessionEnd?.()
    }
  }, [options, onSessionEnd, chatkit])

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
        {chatkit?.control ? (
          <ChatKit 
            control={chatkit.control}
            className="w-full h-full"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white mx-auto"></div>
              <p className="text-lg text-slate-300">Initializing ChatKit...</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Self-hosted indicator */}
      <div className="mt-2 text-xs text-slate-500 text-center flex items-center justify-center gap-2">
        <span className={`inline-block w-2 h-2 rounded-full ${chatkit?.control ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></span>
        <span>Self-hosted • {chatkit?.control ? 'Connected to Python server' : 'Connecting...'}</span>
      </div>
    </div>
  )
}

