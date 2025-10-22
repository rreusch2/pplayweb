"use client"

import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '@/contexts/SimpleAuthContext'
import { useChatKit, ChatKit } from '@openai/chatkit-react'

interface ProfessorLockCustomProps {
  className?: string
  onSessionStart?: () => void
  onSessionEnd?: () => void
}

export default function ProfessorLockCustom({ 
  className = "",
  onSessionStart,
  onSessionEnd
}: ProfessorLockCustomProps) {
  const { user, profile } = useAuth()
  const [error, setError] = useState<string | null>(null)

  const serverUrl = process.env.NEXT_PUBLIC_CHATKIT_SERVER_URL || 'https://pykit-production.up.railway.app/chatkit'
  const domainKey = process.env.NEXT_PUBLIC_CHATKIT_DOMAIN_KEY || 'domain_pk_68ee8f22d84c8190afddda0c6ca72f7c0560633b5555ebb2'

  console.log('🎯 Configuring ChatKit for Custom Backend')
  console.log('🐍 Server URL:', serverUrl)
  console.log('🔑 Domain Key:', domainKey)
  console.log('👤 User:', user?.id, 'Tier:', profile?.subscription_tier)

  // Configure ChatKit options for custom backend
  const options = useMemo(() => {
    return {
      api: {
        // For custom backends with Python SDK
        url: serverUrl,
        domainKey: domainKey,
        fetch: (input: RequestInfo | URL, init?: RequestInit) => {
          const headers = {
            ...init?.headers,
            'X-User-Id': user?.id || '',
            'X-User-Email': user?.email || '',
            'X-User-Tier': profile?.subscription_tier || 'free',
          }
          const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url
          console.log('🌐 ChatKit fetch:', url, 'with headers:', headers)
          return fetch(input, { ...init, headers })
        },
      },
      theme: {
        colorScheme: 'dark' as const,
      },
      composer: {
        placeholder: "What's the play today, champ? Ask about odds, build parlays, or get insights...",
      },
      startScreen: {
        greeting: "🎯 Professor Lock is locked in! Let's find some winners, champ! 💰",
        prompts: [
          { 
            label: "Today's best value bets", 
            prompt: "Analyze today's games and give me top 3 confident picks", 
            icon: 'star' as const
          },
          { 
            label: 'Build me a 3-leg parlay', 
            prompt: "Build a 3-leg parlay with strong value and reasonable risk", 
            icon: 'write' as const
          },
          { 
            label: 'Find hot player props', 
            prompt: "Show the best player prop bets with strong value today", 
            icon: 'bolt' as const
          },
        ],
      },
      onError: (event: any) => {
        console.error('🚨 ChatKit error:', event.error)
        setError(event.error?.message || 'An error occurred')
      },
      onLog: (event: any) => {
        console.log('🪵 ChatKit log:', event.name, event.data)
      },
      onResponseStart: () => {
        console.log('🟢 Response started')
      },
      onResponseEnd: () => {
        console.log('🟣 Response ended')
      },
    }
  }, [user, profile, serverUrl, domainKey])

  const { control } = useChatKit(options)

  useEffect(() => {
    if (user && control) {
      console.log('✅ ChatKit initialized with custom backend')
      console.log('🎮 Control object:', control)
      onSessionStart?.()
    }
    return () => {
      onSessionEnd?.()
    }
  }, [user, control, onSessionStart, onSessionEnd])

  if (!user) {
    return (
      <div className="flex h-[600px] items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-black/60 via-black/50 to-black/60">
        <div className="text-center">
          <p className="text-white/60">Please sign in to access Professor Lock</p>
        </div>
      </div>
    )
  }

  if (!control) {
    return (
      <div className="flex h-[600px] items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-black/60 via-black/50 to-black/60">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
          <p className="text-white/40">Initializing Professor Lock...</p>
        </div>
      </div>
    )
  }

  console.log('🎨 Rendering ChatKit with control:', !!control)

  return (
    <div
      className={`relative rounded-2xl border border-white/10 overflow-hidden ${className}`}
      style={{ 
        minHeight: '600px', 
        height: '600px', 
        width: '100%',
        background: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(20,20,30,0.9) 100%)'
      }}
    >
      {error && (
        <div className="absolute top-3 left-3 z-50 text-xs px-3 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30">
          ⚠️ {error}
        </div>
      )}
      <div className="absolute top-3 right-3 z-50 text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
        ⚡ Custom API
      </div>
      
      {/* ChatKit Component for Custom Backend */}
      <ChatKit 
        control={control} 
        className="w-full h-full"
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      />
    </div>
  )
}
