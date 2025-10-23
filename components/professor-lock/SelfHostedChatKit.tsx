"use client"

import { useEffect, useState } from 'react'
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

  // Configure ChatKit for self-hosted backend
  const chatkit = useChatKit({
    initialThread: null,
    api: {
      url: 'https://pykit-production.up.railway.app/chatkit',
      domainKey: 'domain_pk_68ee8f22d84c8190afddda0c6ca72f7c0560633b5555ebb2',
      fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
        if (!user || !session) {
          return new Response(JSON.stringify({ error: 'Not authenticated' }), { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          })
        }
        
        console.log('🌐 ChatKit request:', input)
        
        const response = await fetch(input, {
          ...init,
          headers: {
            ...init?.headers,
            'Authorization': `Bearer ${session.access_token}`,
            'X-User-Id': user.id,
            'X-User-Email': user.email || '',
            'X-User-Tier': profile?.subscription_tier || 'free',
          },
        })
        
        console.log('🌐 ChatKit response:', response.status)
        return response
      },
    },
    composer: {
      placeholder: "Ask Professor Lock anything about today's slate…",
    },
    startScreen: {
      greeting: "What can I help you lock today?",
      prompts: [
        { label: "Build a Parlay", prompt: "/parlay" },
        { label: "Compare Odds", prompt: "/odds Lakers vs Celtics" },
        { label: "Top Player Props", prompt: "/player Caitlin Clark" },
        { label: "Betting Insights", prompt: "/insights" },
      ],
    },
    onError: ({ error }) => {
      console.error('[ChatKit error]', error)
      setError(error instanceof Error ? error.message : 'ChatKit error')
    },
    onLog: (detail) => {
      console.debug('[ChatKit log]', detail)
    },
  })

  useEffect(() => {
    console.log('🎯 SelfHostedChatKit mounted')
    console.log('User:', user?.id)
    console.log('ChatKit control exists:', !!chatkit?.control)
    console.log('ChatKit full object:', chatkit)
    
    if (chatkit?.control && user) {
      console.log('✅ ChatKit ready - setting loading false')
      setIsLoading(false)
      onSessionStart?.()
    }
  }, [chatkit?.control, user])
  
  useEffect(() => {
    return () => {
      console.log('🔌 SelfHostedChatKit unmounting')
      onSessionEnd?.()
    }
  }, [])

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

  // Render ChatKit - no wrapper, direct rendering
  if (!chatkit?.control) {
    return (
      <div className={className}>
        <div className="flex h-full items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-black/60 via-black/50 to-black/60">
          <div className="text-center">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white mx-auto"></div>
            <p className="text-lg text-slate-300">Initializing ChatKit...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <div 
        className="h-full w-full bg-white rounded-lg overflow-hidden"
        style={{ minHeight: '400px' }}
      >
        <ChatKit
          control={chatkit.control}
          style={{ 
            width: '100%', 
            height: '100%',
            display: 'block',
            backgroundColor: 'white'
          }}
        />
      </div>
      
      {/* Self-hosted indicator */}
      <div className="mt-2 text-xs text-slate-500 text-center flex items-center justify-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
        <span>Professor Lock • Self-hosted on Railway</span>
      </div>
    </div>
  )
}

